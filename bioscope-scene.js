/* ============================================================================
   bioscope-scene.js — the cabinet, the crank and the camera rig.

   Ported from React-Three-Fiber JSX to imperative three.js r128. The geometry,
   proportions and interaction physics are unchanged; only the plumbing differs.
   Depends on: THREE (r128), window.BIOSCOPE (bioscope-lib.js).
   ========================================================================== */
(function () {
  "use strict";

  var B = window.BIOSCOPE;
  var BOX = B.BOX, FRONT_Z = B.FRONT_Z, LENS = B.LENS, CRANK = B.CRANK, STAND = B.STAND;

  /* Crank feel — radians/sec while simply held, spin-up and coast-down rates. */
  var HOLD_SPEED = 4.2, SPIN_UP = 6, FRICTION = 1.9, MAX_SPEED = 22;
  var DRAG_THRESHOLD = 4;      // px before a hold counts as a deliberate drag
  var FRAME_DURATION = 7000;   // ms a picture holds in the peep view

  var damp = function (x, y, lambda, dt) { return THREE.MathUtils.lerp(x, y, 1 - Math.exp(-lambda * dt)); };

  /* ── GEOMETRY ────────────────────────────────────────────────────────────── */

  /** The octagonal front elevation, extruded backwards into the cabinet. */
  function cabinetGeometry() {
    var hw = BOX.halfWidth, hh = BOX.halfHeight, c = BOX.chamfer, depth = BOX.depth;
    var shape = new THREE.Shape();
    shape.moveTo(-hw + c, -hh);
    shape.lineTo(hw - c, -hh);
    shape.lineTo(hw, -hh + c);
    shape.lineTo(hw, hh - c);
    shape.lineTo(hw - c, hh);
    shape.lineTo(-hw + c, hh);
    shape.lineTo(-hw, hh - c);
    shape.lineTo(-hw, -hh + c);
    shape.closePath();

    var geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth, bevelEnabled: true, bevelThickness: 0.012,
      bevelSize: 0.012, bevelSegments: 2, curveSegments: 1
    });
    geo.translate(0, 0, -depth / 2);
    geo.computeVertexNormals();
    return geo;
  }

  /** The flared brass bell, drawn as a profile and spun on the lathe. */
  function hornGeometry() {
    var points = [], steps = 26;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      // Exponential flare: narrow throat opening into a morning-glory bell.
      points.push(new THREE.Vector2(0.03 + Math.pow(t, 2.4) * 0.25, t * 0.28));
    }
    points.push(new THREE.Vector2(0.292, 0.29));   // rolled lip
    points.push(new THREE.Vector2(0.274, 0.287));
    return new THREE.LatheGeometry(points, 48);
  }

  /** The S-bend of pipe carrying the horn up off the lid. */
  function hornArmGeometry() {
    var curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, 0.1, -0.03),
      new THREE.Vector3(0.14, 0.2, -0.06),
      new THREE.Vector3(0.27, 0.27, -0.06)
    ]);
    return new THREE.TubeGeometry(curve, 40, 0.028, 14, false);
  }

  /** A slack decorative chain looping between two points on the front panel. */
  function chainGeometry(from, to, sag) {
    var mid = from.clone().lerp(to, 0.5);
    mid.y -= sag; mid.z += 0.01;
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([from, mid, to]), 32, 0.006, 6, false);
  }

  /** Clones a texture so one canvas can be mapped at different scales per face. */
  function mapped(texture, rx, ry, ox, oy) {
    var t = texture.clone();
    t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.offset.set(ox || 0, oy || 0);
    return t;
  }

  /* ── THE BIOSCOPE ────────────────────────────────────────────────────────── */

  function buildBioscope(opts) {
    var onSelectLens = opts.onSelectLens || function () {};
    var onHoverChange = opts.onHoverChange || function () {};
    var audio = opts.audio;

    var root = new THREE.Group();
    var pickables = [];      // meshes the raycaster cares about
    var eyepieces = [];
    var reelSpin = { value: 0 };

    var brass = B.brassTexture();
    var front = B.frontPanelTexture();
    var side = B.sidePanelTexture();
    var sign = B.signboardTexture();
    var wood = B.standTexture();

    var brassMat = new THREE.MeshStandardMaterial({ map: brass, metalness: 0.95, roughness: 0.28 });
    var woodMat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.85, metalness: 0.05 });

    function brassMesh(geo, castShadow) {
      var m = new THREE.Mesh(geo, brassMat);
      if (castShadow) m.castShadow = true;
      return m;
    }

    /* ---- Beaten-earth floor, just enough for the shadow to sit on ---- */
    var floor = new THREE.Mesh(
      new THREE.CircleGeometry(3.2, 48),
      new THREE.MeshStandardMaterial({ color: 0x241c14, roughness: 0.95, metalness: 0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.02;
    floor.receiveShadow = true;
    root.add(floor);

    /* ---- Folding X-stand ---- */
    var stand = new THREE.Group();
    stand.position.y = -BOX.halfHeight - STAND.legLength * 0.41;
    STAND.zs.forEach(function (z) {
      [1, -1].forEach(function (dir) {
        var leg = new THREE.Mesh(
          new THREE.BoxGeometry(STAND.legThickness, STAND.legLength, STAND.legThickness), woodMat);
        leg.position.set(0, 0, z);
        leg.rotation.z = dir * STAND.tilt;
        leg.castShadow = leg.receiveShadow = true;
        stand.add(leg);
      });
      // Pivot bolt where the legs cross
      var bolt = brassMesh(new THREE.CylinderGeometry(0.022, 0.022, STAND.legThickness * 2.4, 12));
      bolt.position.set(0, 0, z);
      bolt.rotation.x = Math.PI / 2;
      stand.add(bolt);
    });
    // Cross-brace tying the two pairs together
    var brace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, STAND.zs[0] * 2 + 0.1, 10), woodMat);
    brace.position.y = -STAND.legLength * 0.42;
    brace.rotation.x = Math.PI / 2;
    stand.add(brace);
    root.add(stand);

    /* ---- Painted cabinet ---- */
    // Extrude caps are UV-mapped in shape coordinates, so scale to fit.
    var frontMapped = mapped(front, 1 / (BOX.halfWidth * 2), 1 / (BOX.halfHeight * 2), 0.5, 0.5);
    var sideMapped = mapped(side, 1.4, 1.4);
    var cabinet = new THREE.Mesh(cabinetGeometry(), [
      new THREE.MeshStandardMaterial({ map: frontMapped, roughness: 0.62, metalness: 0.05 }), // caps
      new THREE.MeshStandardMaterial({ map: sideMapped, roughness: 0.7, metalness: 0.05 })    // walls
    ]);
    cabinet.castShadow = cabinet.receiveShadow = true;
    root.add(cabinet);

    // Metal banding along the bottom edge, as on every travelling box.
    var band = brassMesh(new THREE.BoxGeometry(BOX.halfWidth * 1.9, 0.03, BOX.depth + 0.02));
    band.position.y = -BOX.halfHeight - 0.008;
    root.add(band);

    // Painted signboard across the top of the front panel, in a brass frame.
    var signFrame = brassMesh(new THREE.BoxGeometry(BOX.halfWidth * 1.58, 0.185, 0.018));
    signFrame.position.set(0, BOX.halfHeight - 0.115, FRONT_Z + 0.012);
    root.add(signFrame);
    var signPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(BOX.halfWidth * 1.48, 0.145),
      new THREE.MeshStandardMaterial({
        map: sign, roughness: 0.55, emissive: new THREE.Color(0x1b4f9c), emissiveIntensity: 0.25
      }));
    signPlate.position.set(0, BOX.halfHeight - 0.115, FRONT_Z + 0.023);
    root.add(signPlate);

    /* ---- Eyepieces ---- */
    LENS.xs.forEach(function (x) {
      var g = new THREE.Group();
      g.position.set(x, LENS.y, 0);
      var z = FRONT_Z + LENS.barrelLength / 2;

      // Flange sunk into the panel
      var flange = brassMesh(new THREE.CylinderGeometry(LENS.radius * 1.32, LENS.radius * 1.32, 0.016, 32), true);
      flange.position.z = FRONT_Z + 0.008;
      flange.rotation.x = Math.PI / 2;
      g.add(flange);

      // The picture waiting inside, at the bottom of the barrel.
      var pic = new THREE.Mesh(
        new THREE.CircleGeometry(LENS.radius * 0.97, 40),
        new THREE.MeshBasicMaterial({ color: 0x150f08 }));
      pic.position.z = FRONT_Z + 0.02;
      g.add(pic);

      // Barrel, open at both ends so you look straight down it.
      var barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(LENS.radius, LENS.radius * 1.12, LENS.barrelLength, 32, 1, true),
        new THREE.MeshStandardMaterial({ map: brass, metalness: 0.95, roughness: 0.25, side: THREE.DoubleSide }));
      barrel.position.z = z;
      barrel.rotation.x = Math.PI / 2;
      barrel.castShadow = true;
      g.add(barrel);

      // Knurled rim at the mouth
      var rim = brassMesh(new THREE.TorusGeometry(LENS.radius * 1.06, 0.016, 12, 44));
      rim.position.z = z + LENS.barrelLength / 2;
      g.add(rim);

      // Glass: barely there, just enough to catch a highlight.
      var glass = new THREE.Mesh(
        new THREE.CircleGeometry(LENS.radius * 0.98, 40),
        new THREE.MeshPhysicalMaterial({
          color: 0xc9d8e0, roughness: 0.05, metalness: 0,
          transparent: true, opacity: 0.13, depthWrite: false }));
      glass.position.z = z + LENS.barrelLength / 2 - 0.006;
      g.add(glass);

      var glow = new THREE.PointLight(0xffb85c, 0.35, 0.6);
      glow.position.z = FRONT_Z + 0.02;
      g.add(glow);

      // Hover ring
      var ring = new THREE.Mesh(
        new THREE.RingGeometry(LENS.radius * 1.16, LENS.radius * 1.3, 40),
        new THREE.MeshBasicMaterial({ color: 0xffd479, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
      ring.position.z = z + LENS.barrelLength / 2 + 0.004;
      ring.visible = false;
      g.add(ring);

      // Hit target — a disc slightly proud of the glass.
      var hit = new THREE.Mesh(
        new THREE.CircleGeometry(LENS.radius * 1.25, 24),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      hit.position.z = z + LENS.barrelLength / 2 + 0.01;
      hit.userData.role = "lens";
      g.add(hit);
      pickables.push(hit);

      root.add(g);
      eyepieces.push({ group: g, pic: pic, glow: glow, ring: ring, hit: hit, hovered: false });
    });

    // Decorative chains slung between the eyepieces.
    for (var i = 0; i < LENS.xs.length - 1; i++) {
      var from = new THREE.Vector3(LENS.xs[i], LENS.y - LENS.radius * 1.3, FRONT_Z + 0.005);
      var to = new THREE.Vector3(LENS.xs[i + 1], LENS.y - LENS.radius * 1.3, FRONT_Z + 0.005);
      root.add(new THREE.Mesh(chainGeometry(from, to, 0.09), brassMat));
    }

    // Brass listening trumpets on the chamfered cheeks.
    [-1, 1].forEach(function (dir) {
      var t = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.038, 0.11, 24, 1, true),
        new THREE.MeshStandardMaterial({ map: brass, metalness: 0.95, roughness: 0.3, side: THREE.DoubleSide }));
      t.position.set(dir * (BOX.halfWidth + 0.03), LENS.y + 0.02, FRONT_Z * 0.35);
      t.rotation.z = dir * Math.PI * 0.5;
      t.castShadow = true;
      root.add(t);
    });

    /* ---- Lid furniture: turntable, tonearm, horn, finials ---- */
    var lid = new THREE.Group();
    lid.position.y = BOX.halfHeight;

    var plate = new THREE.Mesh(new THREE.CircleGeometry(0.23, 40),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0e, roughness: 0.7 }));
    plate.position.set(-0.12, 0.008, 0.02);
    plate.rotation.x = -Math.PI / 2;
    lid.add(plate);

    var spool = new THREE.Group();
    spool.position.set(-0.12, 0.014, 0.02);
    var disc = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.012, 48),
      new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.35, metalness: 0.2 }));
    disc.castShadow = true;
    spool.add(disc);
    var label = new THREE.Mesh(new THREE.CircleGeometry(0.07, 32),
      new THREE.MeshStandardMaterial({ color: 0xb8231d, roughness: 0.6 }));
    label.position.y = 0.008; label.rotation.x = -Math.PI / 2;
    spool.add(label);
    var spindle = brassMesh(new THREE.CircleGeometry(0.008, 12));
    spindle.position.y = 0.012; spindle.rotation.x = -Math.PI / 2;
    spool.add(spindle);
    lid.add(spool);

    var tonearm = new THREE.Group();
    tonearm.position.set(0.16, 0.03, 0.16);
    var arm = brassMesh(new THREE.CylinderGeometry(0.011, 0.011, 0.28, 12), true);
    arm.position.set(-0.13, 0.02, -0.09); arm.rotation.z = Math.PI / 2;
    tonearm.add(arm);
    tonearm.add(brassMesh(new THREE.SphereGeometry(0.028, 16, 12)));
    lid.add(tonearm);

    // Gramophone horn — bell aimed at whoever is standing at the crank.
    var hornGroup = new THREE.Group();
    hornGroup.position.set(0.3, 0.02, -0.12);
    hornGroup.add(brassMesh(hornArmGeometry(), true));
    var bellGroup = new THREE.Group();
    bellGroup.position.set(0.27, 0.27, -0.06);
    bellGroup.rotation.set(Math.PI * 0.38, 0, Math.PI * 0.24);
    var bell = new THREE.Mesh(hornGeometry(), new THREE.MeshStandardMaterial({
      map: brass, metalness: 0.96, roughness: 0.22, side: THREE.DoubleSide,
      emissive: new THREE.Color(0x492c05), emissiveIntensity: 0.55 }));
    bell.castShadow = true;
    bellGroup.add(bell);
    var bellLight = new THREE.PointLight(0xffca7a, 1.3, 1.4);
    bellLight.position.y = 0.22;
    bellGroup.add(bellLight);
    hornGroup.add(bellGroup);
    lid.add(hornGroup);

    // Finials at the back corners
    [-1, 1].forEach(function (dir) {
      var f = new THREE.Group();
      f.position.set(dir * (BOX.halfWidth - 0.1), 0, -BOX.depth / 2 + 0.06);
      var ball = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0x1b4f9c, roughness: 0.4, metalness: 0.3 }));
      ball.position.y = 0.04; f.add(ball);
      var rod = brassMesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 8));
      rod.position.y = 0.12; f.add(rod);
      lid.add(f);
    });
    root.add(lid);

    /* ---- The crank ---- */
    // Outer group turns the local +Z axle to point out of the left cheek.
    var crankRoot = new THREE.Group();
    crankRoot.position.set(CRANK.x, CRANK.y, CRANK.z);
    crankRoot.rotation.y = -Math.PI / 2;

    var mountPlate = brassMesh(new THREE.CylinderGeometry(0.058, 0.062, 0.024, 24), true);
    mountPlate.position.z = 0.012; mountPlate.rotation.x = Math.PI / 2;
    crankRoot.add(mountPlate);

    var pivot = new THREE.Group();
    var spinner = new THREE.Group();

    var axle = brassMesh(new THREE.CylinderGeometry(0.022, 0.022, 0.11, 20), true);
    axle.position.z = 0.05; axle.rotation.x = Math.PI / 2;
    spinner.add(axle);

    var crankArm = brassMesh(new THREE.BoxGeometry(CRANK.armLength, 0.05, 0.024), true);
    crankArm.position.set(CRANK.armLength / 2, 0, 0.098);
    spinner.add(crankArm);

    var grip = new THREE.Group();
    grip.position.set(CRANK.armLength, 0, 0.145);
    var gripBody = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.1, 20),
      new THREE.MeshStandardMaterial({ map: wood, metalness: 0.1, roughness: 0.75 }));
    gripBody.rotation.x = Math.PI / 2; gripBody.castShadow = true;
    grip.add(gripBody);
    var gripCap = brassMesh(new THREE.SphereGeometry(0.036, 20, 16));
    gripCap.position.z = 0.05;
    grip.add(gripCap);
    // Invisible sphere that makes the handle comfortable to grab.
    var gripHit = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    gripHit.userData.role = "crank";
    grip.add(gripHit);
    pickables.push(gripHit);
    spinner.add(grip);

    pivot.add(spinner);
    crankRoot.add(pivot);

    // Halo tracing the arc the handle sweeps — faintly there so the crank reads
    // as the thing to touch, brighter once you find it.
    var halo = new THREE.Mesh(
      new THREE.TorusGeometry(CRANK.armLength * 1.02, 0.008, 10, 64),
      new THREE.MeshBasicMaterial({ color: 0xffd479, transparent: true, opacity: 0.2, depthWrite: false }));
    halo.position.z = 0.02;
    crankRoot.add(halo);
    root.add(crankRoot);

    // Warm bulb inside the cabinet, leaking out of the eyepieces.
    var innerBulb = new THREE.PointLight(0xff9d3c, 0.8, 1.2);
    innerBulb.position.set(0, LENS.y, FRONT_Z - 0.25);
    root.add(innerBulb);

    /* ── crank state ────────────────────────────────────────────────────── */
    var s = {
      angle: -Math.PI * 0.35,     // parked so the arm reads as a crank, not a stub
      velocity: 0, grabbed: false, dragging: false,
      lastPointerAngle: 0,
      downX: 0, downY: 0,
      pivotScreen: new THREE.Vector2(),
      lastNotch: Math.floor((-Math.PI * 0.35) / ((Math.PI * 2) / CRANK.notchesPerTurn)),
      lastTurn: Math.floor((-Math.PI * 0.35) / CRANK.radiansPerFrame),
      dragVelocity: 0,
      hoveredCrank: false
    };

    return {
      root: root, pickables: pickables, eyepieces: eyepieces,
      crank: s, spinner: spinner, pivot: pivot, halo: halo,
      spool: spool, tonearm: tonearm, reelSpin: reelSpin,
      setLensPicture: function (texture) {
        eyepieces.forEach(function (e) {
          if (texture) {
            e.pic.material.map = texture;
            e.pic.material.color.setHex(0xffffff);
            e.pic.material.needsUpdate = true;
          }
        });
      },
      dispose: function () {
        root.traverse(function (o) {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.dispose(); });
          }
        });
        B.disposeTextures();
      }
    };
  }

  /* ── EXPORT ──────────────────────────────────────────────────────────────── */
  window.BIOSCOPE_SCENE = {
    build: buildBioscope,
    HOLD_SPEED: HOLD_SPEED, SPIN_UP: SPIN_UP, FRICTION: FRICTION,
    MAX_SPEED: MAX_SPEED, DRAG_THRESHOLD: DRAG_THRESHOLD,
    FRAME_DURATION: FRAME_DURATION,
    damp: damp
  };
})();
