# The Third Place

Website for **The Third Place**, Nashik's workspace, studio and community. *Not home. Not office. Yours.*

A static site: plain HTML, CSS and JavaScript with no build step. It runs on any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

## Project structure

```
.
├── index.html          # the page
├── 404.html            # "page not found" page
├── css/styles.css      # all styles (design tokens at the top)
├── js/main.js          # menu, floor plan, seat finder, enquiry form
├── js/motion.js        # intro, cursor, word reveals, scroll animations (off for reduced motion)
├── js/fx.js            # optional effects, each with an on/off switch (see below)
├── css/fx.css          # styles for those effects (only apply when switched on)
├── assets/             # favicons + social share image
├── apps-script/Code.gs # Google Apps Script that writes enquiries to the Google Sheet
├── robots.txt
├── sitemap.xml
└── .nojekyll           # tells GitHub Pages to serve files as-is
```

## Run it locally

From the project folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Editing

- **Colours, type sizes, spacing, corner radius:** change the tokens in `:root` at the top of `css/styles.css`. Everything else uses them.
- **Phone / WhatsApp number:** `WA_NUMBER` at the top of `js/main.js`, plus the `tel:` links and the number shown in `index.html`.
- **Instagram:** search `index.html` for `_the3rdplace_`.

## Optional effects (easy to switch off)

The switches are at the top of `js/fx.js`:

```js
const FX = {
  dealCards:    true,  // Memberships: cards fan in from a stack and land in place
  shuffle:      false, // Memberships: the "I'm…" finder shuffles the deck, match lands on top
  readAlong:    true,  // The idea: text turns from faint Stone to Ink as you scroll
  tourDot:      true,  // The floor: a clay dot walks between zones
  colourFlow:   false, // Soft colour transitions between Paper, tint and Ink sections
  smoothScroll: true,  // Momentum scrolling, laptops/desktops only (Lenis, loaded from jsDelivr)
};
```

Set any of them to `false` and that effect is gone completely (its styles in `css/fx.css` stop applying too).
To remove all of them, delete the `fx.css` link and the `lenis` and `fx.js` script tags from `index.html`.
All effects respect "reduce motion" settings; smooth scrolling only runs on laptops/desktops with a mouse or trackpad.

## Updating the live site

`index.html` loads `css/styles.css?v=…`, `js/main.js?v=…` and `js/motion.js?v=…` (and `404.html` loads the CSS the same way).
When you change a CSS or JS file, bump that `v=` number (e.g. to today's date) so visitors' browsers fetch the new file instead of a cached copy.

## Enquiry form → Google Sheet

The form posts to a Google Apps Script web app, which adds a row to the enquiries sheet.

- The web app URL is `SHEET_ENDPOINT` in `js/main.js`.
- The script source is `apps-script/Code.gs`. To change it, edit it in the sheet's **Extensions → Apps Script**, then **Deploy → Manage deployments → Edit → Version: New version → Deploy**. The URL stays the same.
- If you ever create a **new** deployment instead, it gets a new URL: update `SHEET_ENDPOINT`.
- The deployment must be **Execute as: Me** and **Who has access: Anyone**, or visitors' submissions are blocked.

## Hosting on GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/ (root)**, then **Save**.
3. After a minute the site is live at `https://nainasachdev10.github.io/thethirdplace/`.

### Custom domain (thethirdplace.fun)

`index.html`, `robots.txt` and `sitemap.xml` already point to `https://thethirdplace.fun`. To serve the site there:

1. In **Settings → Pages → Custom domain**, enter `thethirdplace.fun` and save. GitHub adds a `CNAME` file to the repo.
2. At your domain provider, add DNS records:
   - `A` records for `@` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - a `CNAME` record for `www` pointing to `nainasachdev10.github.io`
3. Once DNS has updated, tick **Enforce HTTPS**.

> The 404 page uses root-relative links (`/css/...`), so it is styled correctly on the custom domain. On the temporary `github.io/thethirdplace/` address it will show unstyled until the domain is connected. The main page works on both.
