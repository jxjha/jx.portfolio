# Product Requirements Document — jx.portfolio

| | |
|---|---|
| **Product** | Janmesh Jha — personal portfolio (`jx.portfolio`) |
| **Owner** | Janmesh Jha |
| **Status** | Live, actively developed |
| **Surface** | Static site, deployed on Vercel — every push to `main` publishes |
| **Scope of this document** | The whole site: shared systems, the home page, all nine case studies, and the four companion surfaces |

---

## 1. TL;DR

Most portfolios are a grid of cards linking to PDFs. This one is built on the opposite bet: **each page is an object you operate, not a document you scroll.** A street you drive down, a photo gallery you fly through, a crate of records you pull sleeves from, a hand-cranked bioscope you turn.

The site's job is to convert a stranger's thirty seconds of curiosity into a read of at least one case study, and to leave them with a specific, defensible impression: *this person thinks in systems and can build the thing, not just deck it.*

---

## 2. Problem

A portfolio has about ten seconds to survive triage.

The people who matter — hiring managers, recruiters, prospective collaborators — arrive skeptical, on a borrowed moment, often on a phone. The default portfolio fails them in three specific ways:

1. **It describes instead of demonstrating.** A page that *says* "strong product thinking" is asking to be believed. A page that *is* a working artifact has already proved something.
2. **It buries the decision.** Nine projects behind nine identical cards forces a visitor to gamble on which one is worth their time. Most gamble zero times and leave.
3. **It flattens range into a list.** Product, data, geospatial, research, media and music read as scatter unless the presentation gives them a common spine.

## 3. Goals

| ID | Goal | How it shows up |
|---|---|---|
| **G1** | Prove capability by demonstration, not assertion | Interactive case studies; live dashboard; working 3D scenes |
| **G2** | Make the choice of what to read easy and fast | Projects index with a plate that states what each study contains before the click |
| **G3** | Give range a spine | One visual system across every page — same paper, same palette, same four typefaces |
| **G4** | Respect the visitor's time | Under-two-second intro; no gate, no login, no cookie wall; every page reachable in one hop |
| **G5** | Stay maintainable by one person | No build step, no framework, no dependency graph to service |

## 4. Non-goals

- **Not a CMS.** Content lives in the HTML and small JS data files. There is no admin surface and there should not be one.
- **Not a blog.** No feed, no dated posts, no comment system.
- **Not a design-award submission.** Motion serves comprehension. When a flourish and a reader's understanding conflict, the flourish loses.
- **Not device-exhaustive.** The 3D surfaces target current desktop and modern mobile browsers. Legacy browsers get the content, not the spectacle.

## 5. Audience and jobs to be done

| Audience | The job they hire this site for | What "success" looks like for them |
|---|---|---|
| **Hiring manager** (product, data, strategy) | "Show me evidence this person can do the work I need done." | Reads one case study end to end; can name a specific method used |
| **Recruiter / screener** | "Confirm this profile is real and worth passing on in 60 seconds." | Finds role, scope, dates and the CV without hunting |
| **Prospective collaborator** | "Is this someone I'd want to build with?" | Gets range and taste; finds a contact route |
| **Peer / curious visitor** | "Show me something I haven't seen." | Plays with the bioscope, gallery or dashboard; shares it |

The site optimises for the **hiring manager** first. Where two audiences conflict, depth for the hiring manager wins over speed for the screener — with the caveat that the screener's path must never be *blocked*, only shorter.

## 6. Success metrics

**Note on honesty:** the site currently has **no analytics installed** (see `NFR-12`). The metrics below are the intended targets and the instrumentation needed to read them. They are written as commitments, not as achievements.

| Metric | Target | Status |
|---|---|---|
| Case-study reach — share of home visitors who open at least one case study | ≥ 35% | Not instrumented |
| Read depth — share of case-study visitors reaching the final section | ≥ 40% | Not instrumented |
| Ring traversal — share who open a *second* case study via prev/next | ≥ 20% | Not instrumented |
| CV downloads per unique visitor | ≥ 8% | Not instrumented |
| Time to first meaningful paint, mid-tier mobile | < 2.5s | Not measured |
| Intro duration | < 2s | **Met — 1.82s measured** |

## 7. Product principles

These are the tie-breakers. When a decision is contested, the earlier principle wins.

1. **Every page is an object.** The visitor operates something — a crank, a street, a needle, a flight path. If a page has no verb, it is not finished. *(The site states this thesis explicitly on `bioscope.html`: "Every page here is a bioscope.")*
2. **Earn the scroll.** Each screen must answer a question the previous screen raised. No section exists to fill space.
3. **The words carry the weight.** Illustration supports the sentence; it does not replace it. A visitor who reads only the text still gets the whole argument.
4. **Show the working.** Method names, real numbers, and the reasoning behind a decision — not just the outcome. Where data is confidential, rebuild the analysis on synthetic data and say so plainly.
5. **One texture, everywhere.** Paper grain, bone ground, oxblood and sienna. A visitor should be able to tell a screenshot came from this site with the header cropped off.
6. **No dead ends.** Every page offers a next move. The case-study ring wraps so there is never a terminal page.

---

## 8. Information architecture

17 pages, four tiers.

```
/  index.html ─── the showcase spine
│
├── Tier 1 · Case studies (the ring — casenav.js, wraps at both ends)
│     01 revamp.html        ReVamp — Smart Wardrobe
│     02 thesis.html        Expectation Exchange
│     03 skate.html         Hello Skate Mobility
│     04 assortment.html    Assortment Management ──> dashboard.html (live BI)
│     05 studio.html        Multimedia & UX
│     06 uav.html           UAV → Solar Yield
│     07 bias.html          Bias & Artificial Intelligence
│     08 agriculture.html   The Future of Farming
│     09 amdavad.html       Amazing Amdavad ──> bioscope.html (interaction piece)
│
├── Tier 2 · Companion surfaces (linked from home, not in the ring)
│     journey.html          Been There, Done That — the city of work
│     gallery.html          The Gallery — 21 photographs in 3D
│     music.html            The Record Library — 13 sides
│
├── Tier 3 · Children (reached from their parent, indexed but not navigated to directly)
│     dashboard.html        Multi-view BI dashboard (child of assortment)
│     bioscope.html         Hand-cranked interaction piece (child of amdavad)
│
└── Tier 4 · Utility
      404.html              Lost the trail
      drone.html            Legacy redirect → assortment.html (meta-refresh + JS)
```

**IA-01** — Every Tier 1 and Tier 2 page is reachable from the home page in one click.
**IA-02** — Every page returns to the projects index in one click ("← Back to the projects").
**IA-03** — The case-study ring wraps: from `amdavad.html`, "next" returns to `revamp.html`.
**IA-04** — `sitemap.xml` lists all 15 public pages with priorities reflecting tier.

---

## 9. Global requirements

Applies to every page unless a surface spec overrides it.

### 9.1 Opening sequence — `index.html` only

| ID | Requirement |
|---|---|
| **G-01** | On load, a full-screen panel shows one line of coordinates in monospace, centred. Nothing else is on screen — no counter, no place name, no caption, no progress bar. |
| **G-02** | The line scrambles through four fixes in order — Visnagar, Ahmedabad, Wernigerode, Ulm — with digits locking left to right. The line itself never moves. |
| **G-03** | Timing: 360 / 360 / 360 / 440 ms per fix, then a 300 ms upward lift. Total budget **under 2 seconds** (measured: 1.82s). |
| **G-04** | Longitudes are padded to a common character width so monospace columns do not jitter mid-scramble. |
| **G-05** | The intro is **skipped entirely** when the URL carries a hash (`index.html#projects`) or the visitor prefers reduced motion. |
| **G-06** | Scroll is locked and reset to the top for the duration, then `history.scrollRestoration` is handed back to the browser. |
| **G-07** | The hero animation waits on the intro (`window.introReady`) rather than playing unseen behind the panel. |

### 9.2 Navigation

| ID | Requirement |
|---|---|
| **G-10** | A fixed top nav on every page, using `mix-blend-mode: difference` so it stays legible over both bone and ink sections without a background plate. |
| **G-11** | Below 900px the link row is replaced by a burger opening a full-screen sheet. The sheet closes on link click, on Escape, and on resize above 900px. |
| **G-12** | The nav carries a music play control that shares its track list with `music.html` via `music-data.js` — one source of truth. |
| **G-13** | Every case study loads `casenav.js`, which injects a two-up previous/next strip. The ring wraps, so no page is a dead end. |

### 9.3 Look and feel

| ID | Requirement |
|---|---|
| **G-20** | Every page lays two `feTurbulence` grain layers over the ground — a fine fibre pass (`baseFrequency 0.82`, overlay, 42%) and a coarse mottle (`baseFrequency 0.012`, multiply, 14%) — so flat colour reads as paper. Delivered by `paper.css`, loaded after each page's inline styles. |
| **G-21** | A custom cursor (dot + trailing ring) replaces the system cursor on pointer devices; it is disabled entirely under `@media (hover: none)`. |
| **G-22** | The home page uses proximity scroll-snapping with `scroll-snap-stop: always`, so sections land cleanly without trapping a fast scroll. |

---

## 10. Home page requirements

`index.html` — the spine. Sections in order, each with its own job.

| # | Section | Job | Key requirements |
|---|---|---|---|
| 00 | **Hero** | State the name and the posture in one screen | **H-01** Two masked lines rise on load, gated behind the intro. **H-02** Links to gallery, music and Instagram sit at the fold. |
| 01 | **About** | The person, not the paperwork | **H-10** Oxblood ground for tonal contrast against the bone spine. **H-11** The CV downloads from the "RESUme" wordmark — one click, no form. |
| 02 | **Been There** | Where the work happened | **H-20** A vertical tree of roles, plus a portal into `journey.html`. |
| 03 | **Projects** | **Make the choice of what to read easy** | See §10.1 — the most load-bearing section on the site. |
| 04 | **Gallery** | Prove the eye behind the photographs | **H-40** Parallax floaters teasing real gallery frames; portal to `gallery.html`. |
| 05 | **Music** | Show the off-the-clock brain | **H-50** A 3D record deck that tilts as the section scrolls; portal to `music.html`. |
| 06 | **Contact** | Give a next move | **H-60** Direct email and social routes, no contact form. |

### 10.1 Projects section — index and specimen plate

The section is an **index, not a card wall**: a numbered contents list on the left, and a single specimen plate on the right that swaps as the visitor moves down the list.

| ID | Requirement | Rationale |
|---|---|---|
| **P-01** | The list shows number, title and meta per row. Hovering or focusing a row makes it the active row and swaps the plate. | A list scans faster than nine cards |
| **P-02** | The plate leads with **words**. The mark is a signature at ~90px, not the subject — it must never occupy more than a quarter of the plate's height. | The plate previously gave ~340px to the icon and read as decoration |
| **P-03** | The plate states, in order: figure number and meta, the mark, the title, a two-line description of what the case study *is*, three beats naming what is **inside** it, the call to action, and skill tags. | A visitor decides on content, not on aesthetics |
| **P-04** | The three "inside" beats must name things genuinely present in that case study — a method, an artifact, a number. No atmosphere. | Principle 4: show the working |
| **P-05** | All nine plates render at a consistent height so nothing jumps as the visitor moves down the list. | Verified: 545px across all nine |
| **P-06** | Below 900px the plate is hidden; each row must then carry its own one-line summary under the title. | Narrow-viewport visitors previously got **no description at all** |
| **P-07** | Project content lives in a single `PROJECTS` array — `href`, title, meta, mark, summary (`s`), description (`d`), `inside[]`, CTA, `tags[]`. Adding a project means adding one object. | Principle 5: maintainable by one person |

---

## 11. Case-study requirements

### 11.1 Shared contract

Every case study on the ring must satisfy these, whatever its subject.

| ID | Requirement |
|---|---|
| **CS-01** | Open with role, organisation, scope and year in a scannable block, above the fold. |
| **CS-02** | State the problem before the solution. The first substantive section is the premise, not the outcome. |
| **CS-03** | Name the methods used with their real names (RICE, MoSCoW, JTBD, PESTEL, photogrammetry, cohort analysis). A reader should be able to verify the vocabulary. |
| **CS-04** | Carry at least one interactive or visual artifact the reader can operate — not only prose and images. |
| **CS-05** | End with the outcome and what it cost to get there. No unqualified triumph. |
| **CS-06** | Where the underlying data is confidential, rebuild the analysis on synthetic data and **say so explicitly on the page**. |
| **CS-07** | Load `casenav.js` and offer "← Back to the projects". |

### 11.2 Per-case-study specs

**01 · ReVamp — Smart Wardrobe** · `revamp.html` · Product · 2022–23
Concept-to-business-case pipeline for an IoT wardrobe, run as a start-up simulation.
*Must contain:* How-Might-We framing → concept; three segments mapped by emotional job and fear; five named problems traced back to those fears; Business Model Canvas; RICE and MoSCoW prioritisation; MVP scope.
*Reader takeaway:* this person can take a vague frustration to a defensible, ranked, buildable plan.

**02 · Expectation Exchange** · `thesis.html` · Master's thesis · Grade 1.3
How HQ and 80+ country units at Bosch Rexroth communicate, and why they mostly don't.
*Must contain:* mixed-methods design (survey → strategic interviews → gap analysis); 21 discrete process gaps grouped by category; the resulting collaboration model and implementation roadmap; supervisor assessment.
*Reader takeaway:* this person can run real research inside a large organisation and land it with leadership.

**03 · Hello Skate Mobility** · `skate.html` · Founder's associate · 2021–22
Twelve months at a seed-stage e-scooter company, four roles on a rotating clock.
*Must contain:* the four hats (product, ops, GTM, fundraising); the prioritisation toolkit (JTBD, cohort and funnel analysis, PRDs with acceptance criteria, A/B before rollout); what 95% fleet uptime actually took as a *system*; the campus launch playbook.
*Reader takeaway:* this person operates under ambiguity and leaves systems behind, not heroics.

**04 · Assortment Management** · `assortment.html` → `dashboard.html` · Bosch Rexroth · Data & BI
A messy product portfolio turned into queryable decisions.
*Must contain:* the confidentiality note and the synthetic-data rebuild (`CS-06`); a relational schema designed from scratch; twelve business questions each mapped to a decision and answered by one query; a live multi-view dashboard.
*Reader takeaway:* this person owns the full pipeline — model, query, and the dashboard someone actually opens on a Monday.

**05 · Multimedia & UX** · `studio.html` · Bosch Rexroth · 2024
One internship run like a production studio, three workstreams from one desk.
*Must contain:* the AI-driven video pipeline from evidenced need to signed-off multilingual video in the LMS; seven-language localisation; the +17% measured usability lift and how it was measured.
*Reader takeaway:* this person ships production work solo at corporate scale.

**06 · UAV → Solar Yield** · `uav.html` · Geospatial · 3D
One campus roof in Wernigerode, one question: how much solar could it generate?
*Must contain:* the drone survey; photogrammetric 3D reconstruction; radiation modelling to 155 MWh/year; derived figures (capacity, CO₂ avoided, homes powered); an interactive flythrough of the reconstructed site.
*Reader takeaway:* this person turns physical measurement into a decision-grade energy number.

**07 · Bias & Artificial Intelligence** · `bias.html` · Research · interactive
How bias enters machine learning and what actually counters it.
*Must contain:* the four sources of bias (representation, label, proxy, feedback loop); four high-stakes arenas; a live fairness explorer implementing the 80% rule that the reader can push around.
*Reader takeaway:* this person can hold an ethics argument and make it tangible.

**08 · The Future of Farming** · `agriculture.html` · Tech assessment
What could realistically make US and UK food systems sustainable.
*Must contain:* PESTEL and megatrend scan; a technology radar placing eight enabling technologies by maturity; four SDG-aligned bets ranked by feasibility against impact.
*Reader takeaway:* this person can structure a wide, hype-prone domain into a sequenced portfolio of bets.

**09 · Amazing Amdavad** · `amdavad.html` → `bioscope.html` · Side venture · 2018–21
Co-founding a city-media brand and growing it 28×.
*Must contain:* the three interlocking engines (content, ads, events); the 7,000 → 200,000 curve over three years; the growth loop drawn as a loop, not a funnel.
*Reader takeaway:* this person learned product strategy by running one before knowing the vocabulary.

---

## 12. Companion surface requirements

**`journey.html` — Been There, Done That**
**J-01** A 3D street of every place worked or studied; buildings rise as the visitor reaches them.
**J-02** Scroll drives forward motion. **J-03** Any building opens its case study; buildings marked with an arrow carry a full study.

**`gallery.html` — The Gallery**
**GA-01** 21 photographs on a winding 3D path the visitor cruises rather than scrolling as a grid.
**GA-02** Images stream on demand from `gallery-images.js` with a visible loading progress indicator — the list is plain paths, never an inlined base64 blob.
**GA-03** Clicking a photograph enlarges it. **GA-04** Exit route to Instagram.

**`music.html` — The Record Library**
**M-01** 13 tracks presented as a crate of sleeves; clicking a sleeve drops the needle.
**M-02** Track data comes from `music-data.js`, shared with the home teaser — one source of truth.
**M-03** Playback state is reflected in the nav control across the site.

**`bioscope.html` — देखो मगर प्यार से**
**B-01** A hand-cranked bioscope rebuilt as an interface, with a reel of photographs inside; the visitor turns the crank.
**B-02** Carries the site's design thesis explicitly — the page that explains why every other page is built the way it is.
**B-03** Grain and flicker animations respect `prefers-reduced-motion`.

**`dashboard.html` — Live BI dashboard**
**D-01** Five views: Overview, Geography, Products, Customers, Margins.
**D-02** Driven entirely by `drone-data.js`, a synthetic dataset (900 orders, 357 customers, 80 models, 12 countries).
**D-03** Charts render to canvas via Chart.js 4.4.1 (cdnjs) — 15 chart surfaces across the five views.
**D-04** One-click return to the parent case study.

**`404.html`** — **E-01** Carries the site's voice ("Lost the trail") and routes back to the map.

---

## 13. Design system

| Token | Value | Use |
|---|---|---|
| `--bone` | `#F1E8D8` | Primary ground |
| `--bone-2` | `#E9DDC8` | Secondary ground |
| `--ink` | `#1E1411` | Body text, dark sections |
| `--oxblood` | `#5A201D` | Section grounds, headings |
| `--oxblood-2` | `#4A1815` | Deep accent |
| `--sienna` | `#C25A2E` | Primary accent, cursor, rules |
| `--sienna-2` | `#D9713F` | Accent on dark grounds |
| `--muted` | `#8A7A66` | Secondary text |
| `--line` | `rgba(30,20,17,.16)` | Hairlines and borders |

**Typography — four faces, four jobs.**

| Face | Role |
|---|---|
| **Anton** | Display. Section headings and the hero. Uppercase, tight leading. |
| **Fraunces** | Editorial serif. Case-study titles, pull quotes, project names. |
| **Archivo** | Body copy. |
| **Space Mono** | Utility and data. Labels, meta, coordinates, figures, tags. |

**DS-01** — All four faces load from a single Google Fonts request with `display=swap`.
**DS-02** — Layout uses `clamp()` for fluid type and spacing rather than breakpoint steps, except where structure genuinely changes (900px and 820px).
**DS-03** — Motion easing is consistent: `cubic-bezier(.2,.8,.2,1)` for entrances, `power3/4.out` for GSAP reveals.

---

## 14. Non-functional requirements

### Accessibility

**Current state is documented honestly. Items marked _Gap_ are open work, not claims.**

| ID | Requirement | Status |
|---|---|---|
| **NFR-01** | Every page declares `lang="en"` | ✅ All 17 pages |
| **NFR-02** | Interactive controls carry `aria-label`; the burger exposes `aria-expanded` and `aria-controls` | ✅ Nav, player, burger, music |
| **NFR-03** | The opening sequence honours `prefers-reduced-motion` | ✅ |
| **NFR-04** | Bioscope grain and flicker honour `prefers-reduced-motion` | ✅ |
| **NFR-05** | **All** motion — GSAP reveals, parallax, 3D auto-motion — honours `prefers-reduced-motion` | ⚠️ _Gap_ — only the intro and bioscope do today |
| **NFR-06** | Every content image carries a meaningful `alt` | ⚠️ _Gap_ — 3 across the site; gallery images inject `alt=""` |
| **NFR-07** | Projects list is keyboard-navigable and the plate updates on `focus`, not only `mouseenter` | ✅ Focus handler present |
| **NFR-08** | Visible focus states throughout, given `cursor: none` hides the system cursor | ⚠️ _Gap_ — needs an audit pass |
| **NFR-09** | 3D surfaces offer a non-3D content fallback | ⚠️ _Gap_ |

### Performance

| ID | Requirement | Status |
|---|---|---|
| **NFR-10** | No build step; no runtime framework | ✅ |
| **NFR-11** | Large media streams on demand rather than inlining — the gallery's 4.7MB base64 blob was replaced with a path list and progressive loading | ✅ |
| **NFR-12** | Analytics installed so §6 metrics can actually be read | ❌ _Not started_ |
| **NFR-13** | `ScrollTrigger.refresh()` runs after fonts settle, since Anton and Fraunces change section heights on arrival | ✅ |
| **NFR-14** | Total asset weight stays under ~15MB (currently ~14.8MB: gallery 5.9MB, music 7.7MB, bioscope 1.1MB) | ⚠️ At ceiling — next media addition needs compression first |

### SEO and sharing

**NFR-20** Every page carries `<title>`, `description`, and Open Graph / Twitter card tags.
**NFR-21** `sitemap.xml` and `robots.txt` are maintained alongside page additions.
**NFR-22** A page added to the ring must also be added to `casenav.js`, `sitemap.xml`, and the `PROJECTS` array — three touch points, by design, all in-repo.

---

## 15. Technical constraints

| Constraint | Detail |
|---|---|
| **Stack** | Plain HTML, CSS and vanilla JS. No bundler, no transpiler, no package manifest. |
| **Runtime dependencies** | GSAP 3.12.5 + ScrollTrigger (cdnjs) for scroll animation; three.js r128 (cdnjs) for the four 3D surfaces (`gallery`, `journey`, `uav`, `bioscope`); Chart.js 4.4.1 (cdnjs) for the dashboard; Google Fonts. All from CDN — nothing vendored. |
| **Failure mode** | If GSAP fails to load, the inline script throws before rendering the projects list. **Known fragility** — see §17. |
| **Shared modules** | `paper.css` (grain + type scale), `casenav.js` (ring), `music-data.js`, `gallery-images.js`, `drone-data.js`. |
| **Hosting** | Vercel. Push to `main` publishes. No preview gating, no environment variables, no server-side code. |
| **Local preview** | Any static server: `npx serve .` |

---

## 16. Content model

Content is data, not markup, wherever it repeats:

```js
// index.html — one object per project; adding a project means adding one entry
{
  href:   'assortment.html',
  t:      'Assortment Management',            // title
  m:      'Bosch Rexroth · Data & BI',        // meta line
  mark:   'grid',                             // key into the MARKS line-art set
  s:      'Excel guesswork replaced by …',    // one-line summary (narrow layouts)
  d:      'Raw tables to a Monday-morning …', // two-line plate description
  inside: ['Relational schema, from scratch', // three beats: what's actually in it
           '12 business questions in SQL',
           'Multi-view Power BI dashboard'],
  go:     'Open the case study',              // call to action
  tags:   ['SQL','Power BI','Schema']         // skill signals
}
```

| File | Owns |
|---|---|
| `index.html` → `PROJECTS` | The nine case studies as they appear on the index |
| `index.html` → `MARKS` | Stroke-only SVG line art, one mark per project |
| `casenav.js` → `ORDER` | Ring order for previous/next |
| `music-data.js` | 13 tracks, shared by home teaser and record library |
| `gallery-images.js` | 21 photograph paths |
| `drone-data.js` | Synthetic dataset behind the dashboard |

---

## 17. Known gaps and next steps

Ordered by what would move the metrics in §6 most.

| Priority | Item | Why |
|---|---|---|
| **P0** | Install analytics | Every metric in §6 is currently unreadable. Nothing else can be prioritised on evidence until this exists. |
| **P0** | Make the projects list resilient to a GSAP CDN failure | Today, if `gsap.min.js` fails, the inline script throws at `registerPlugin` and the entire projects list never renders. A guard or a local fallback removes a single point of failure on the site's most load-bearing section. |
| **P1** | Extend `prefers-reduced-motion` to all motion (`NFR-05`) | The site is motion-heavy; two surfaces honour the preference, the rest do not. |
| **P1** | Alt text pass across all imagery (`NFR-06`) | Three `alt` attributes site-wide. |
| **P2** | Focus-state audit (`NFR-08`) | `cursor: none` raises the stakes on visible focus. |
| **P2** | Compress gallery and music assets (`NFR-14`) | 13.6MB of the ~14.8MB total sits in two folders. |
| **P3** | Non-3D fallbacks for the four three.js surfaces (`NFR-09`) | Currently the content is only reachable through the scene. |

---

## 18. Release log

| Commit | Change |
|---|---|
| `bfe3001` | Project plate leads with words; three "inside" beats per study; narrow-layout rows carry a summary |
| `1dadc30` | Opening sequence stripped to the coordinates alone |
| `9c900a9` | Coordinate opening sequence added |
| `3e4e087` | Em dashes removed, layout widened, bioscope added to Amazing Amdavad |
| `617520b` | Lego-brick journey scene; hero building pop-in; CV updated |
| `b76f40c` | ReVamp corrected to the real artifacts; nav, marquee and shuffle fixes |
| `fdb3079` | Gallery refreshed to 21 curated photographs; 4.7MB base64 blob dropped |
