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
