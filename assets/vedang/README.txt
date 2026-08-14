Vedang Yog Studio — case-study screenshots
==========================================

These images are used by ../../vedang.html (the case study).

The case study also shows the REAL site live via an <iframe> of
https://vedangyoga.in, so it works even if these images are absent.

Files
-----
  shot-hero.jpg        landing / hero (breathing orb + WhatsApp CTA)
  shot-schedule.jpg    the daily schedule ("Nine batches, every day")
  shot-instructor.jpg  founder Purvi Soni — portrait + credentials
  shot-mobile.jpg      the site on a phone (shown in a phone frame)
  preview.jpg          1200x630-ish social/OG card (og:image)
  shot-gallery.jpg     studio gallery (spare, not currently placed)
  shot-pricing.jpg     pricing plans (spare, not currently placed)

How these were made
-------------------
Captured with headless Chromium straight from the live Vedang Yog Studio
source (github.com/jxjha/vedang), rendered locally — the vedangyoga.in
site itself was NOT modified. To refresh them, re-run a Playwright
screenshot pass against that repo's index.html.

Each <img> falls back to a small filename placeholder if the file is
missing, so dropping in newer/higher-fidelity shots (same names) just
works. Note the live-site fonts (Cormorant Garamond / Manrope) load from
Google Fonts, so a local capture without network shows a serif fallback;
capture with fonts available for a pixel-perfect match.
