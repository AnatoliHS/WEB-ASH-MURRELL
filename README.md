# Ash Murrell

Personal website of Ash Murrell, brand strategist, speaker and host of *Amplified*. Built with [Eleventy](https://www.11ty.dev/).

## Getting started

```bash
npm install
npm start          # local dev server
npm run build      # build to dist/
```

## Project layout

- `src/` is the site. It holds only the theme and a starter page for now.
- `src/assets/style.css` is the theme: colours, type and base components.
- `src/_data/site.json` holds site-wide details: name, URL, default meta tags, contact and social links.
- `src/_includes/component/head.njk` is the page head.
- `content-import/` is everything extracted from the current ashmurrell.com site. It is reference material and is not built into the site. See `content-import/README.md`.
