# Ash Murrell

Personal website of Ash Murrell, brand strategist, speaker and host of *Amplified*. Built with [Eleventy](https://www.11ty.dev/).

## Getting started

```bash
npm install
npm start          # local dev server
npm run build      # build to dist/
```

## Project layout

- `src/` is the site: pages, plus `src/podcast/` and `src/blog/` with one Markdown file per episode or post.
- `src/assets/style.css` is the theme: colours, type, components and layouts.
- `src/assets/_redirects` sends old ashmurrell.com URLs to their new addresses.
- `src/_data/site.json` holds site-wide details: name, URL, default meta tags, contact and social links.
- `src/_includes/component/head.njk` is the page head.
- `content-import/` is everything extracted from the current ashmurrell.com site. It is reference material and is not built into the site. See `content-import/README.md`.
- `functions/api/contact.js` is a Cloudflare Pages Function: the contact form posts to `/api/contact`, which checks Cloudflare Turnstile and emails the message through Resend.

## Contact form

The contact form lives in the "Let's Talk" drawer, on every page. Any link to `#contact` opens it (add `data-reason="Speaking"` etc. to pre-select a reason), and the old `/contact/` URL redirects to `/#contact`. It sends to `/api/contact`. Spam is blocked by [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) and a hidden honeypot field; mail goes out through [Resend](https://resend.com/).

**Site key:** set `turnstileSiteKey` in `src/_data/site.json`. While it's empty, the site uses Cloudflare's always-pass test key.

**Cloudflare Pages → Settings → Variables and Secrets** (Production, and Preview if wanted):

| Variable | |
|---|---|
| `TURNSTILE_SECRET_KEY` | Secret key of the Turnstile widget (encrypt) |
| `RESEND_API_KEY` | Resend API key with sending access (encrypt) |
| `CONTACT_FROM_EMAIL` | Optional. Sender on a domain verified in Resend; defaults to `Ash Murrell website <website@forms.ashmurrell.com>` |
| `CONTACT_TO_EMAIL` | Optional. Where messages go; defaults to `info@ashmurrell.com` |

In Resend, add and verify the domain `forms.ashmurrell.com` (its DNS records go on the `forms` subdomain), so mail can be sent from it.

In the Turnstile dashboard, add `ashmurrell.com` (and any preview hostnames) to the widget's hostnames.

**Locally:** copy `.dev.vars.example` to `.dev.vars`, fill it in, then `npm run dev:pages` (builds, then serves with Wrangler so `/api/contact` runs). `npm start` alone serves the pages but not the function.
