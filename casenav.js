/* casenav.js — shared prev/next between case studies.
   Loaded on every case-study page. Finds the current page in the ring
   and injects a two-up "previous / next" strip so a reader can move
   straight to the next story instead of backtracking to the index.
   The ring wraps, so there is never a dead end. */
(function(){
  const ORDER=[
    {f:'burgir.html',      t:'Burgergrill Meister'},
    {f:'vedang.html',      t:'Vedang Yoga'},
    {f:'revamp.html',      t:'ReVamp — Smart Wardrobe'},
    {f:'thesis.html',      t:'Expectation Exchange'},
    {f:'skate.html',       t:'Hello Skate Mobility'},
    {f:'assortment.html',  t:'Assortment Management'},
    {f:'studio.html',      t:'Multimedia & UX'},
    {f:'uav.html',         t:'UAV → Solar Yield'},
    {f:'bias.html',        t:'Bias & Artificial Intelligence'},
    {f:'agriculture.html', t:'The Future of Farming'},
    {f:'amdavad.html',     t:'Amazing Amdavad'}
  ];
  const here=(location.pathname.split('/').pop()||'').toLowerCase();
  const i=ORDER.findIndex(p=>p.f===here);
  if(i<0)return;
  const prev=ORDER[(i-1+ORDER.length)%ORDER.length];
  const next=ORDER[(i+1)%ORDER.length];

  /* container + palette: standard pages have a dark .outro; the 3D
     pages (uav) end with a light #endcta overlay instead */
  const outro=document.querySelector('.outro .wrap');
  const endcta=document.getElementById('endcta');
  const host=outro||endcta;
  if(!host)return;
  const light=!outro; // #endcta sits on the light sky

  if(!document.getElementById('casenav-style')){
    const css=`
    .casenav{display:grid;grid-template-columns:1fr 1fr;gap:18px;max-width:660px;margin:52px auto 0;
             padding-top:26px;border-top:1px solid rgba(241,232,216,.22);text-align:left}
    .casenav.light{border-top-color:rgba(30,20,17,.2)}
    /* reset any inherited .outro a / .endcta a pill styling from the host
       page — !important so it wins against nine different host stylesheets */
    .casenav a{display:flex !important;flex-direction:column;gap:7px;pointer-events:auto;
               border:0 !important;border-radius:0 !important;padding:0 !important;margin:0 !important;
               background:none !important;transition:transform .35s cubic-bezier(.2,.8,.2,1)}
    .casenav a:hover{transform:translateY(-3px)}
    .casenav .cn-next{text-align:right}
    .casenav .cn-dir{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;
                     color:var(--sienna-2,#E2703A);opacity:.85}
    .casenav .cn-ttl{font-family:'Fraunces',serif;font-size:clamp(15px,1.5vw,18px);line-height:1.2;
                     color:var(--bone,#F1E8D8)}
    .casenav.light .cn-ttl{color:var(--ink,#1E1411)}
    .casenav.light .cn-dir{color:var(--sienna,#C25A2E)}
    @media(max-width:520px){.casenav{gap:12px;margin-top:34px}.casenav .cn-ttl{font-size:14px}}
    `;
    const st=document.createElement('style');st.id='casenav-style';st.textContent=css;document.head.appendChild(st);
  }

  const nav=document.createElement('nav');
  nav.className='casenav'+(light?' light':'');
  nav.setAttribute('aria-label','More case studies');
  nav.innerHTML=
    `<a class="cn-prev" href="${prev.f}" data-hov><span class="cn-dir">← Previous</span><span class="cn-ttl">${prev.t}</span></a>`+
    `<a class="cn-next" href="${next.f}" data-hov><span class="cn-dir">Next →</span><span class="cn-ttl">${next.t}</span></a>`;
  host.appendChild(nav);
})();
