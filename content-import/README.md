# Content from ashmurrell.com

Extracted on 2026-11-04 from every URL in the live sitemap (93 pages, all returned 200). This folder is source material and is not built into the site.

## What's here

| Folder | Contents |
| --- | --- |
| `pages/` | Home, About, Speaking, Contact, Podcast and Blog, as Markdown |
| `blog/` | 11 posts with title, date, category, image and original URL |
| `podcast/` | 38 episodes (`NNN-slug.md`) with title, guest, date, Spotify and YouTube links, cover image, notes and original URL |
| `media/` | 62 original image and video files. Local only, not in Git, so keep a separate backup |
| `index.json` | List of all posts and episodes |

The 38 `/full-notes` pages have the same text as their episode pages, so each pair is one file.

## Site-wide details

- **Tagline:** Thrive over Survive.
- **Email:** info@ashmurrell.com
- **Address:** 1325 Highway #2, Unit 4, Belleville, ON, K8P4T3
- **Navigation:** About, Podcast, Blog, Speaking, Contact, Let's Talk
- **Social:** [YouTube](https://www.youtube.com/@amplifiedshow), [Spotify](https://open.spotify.com/show/6nZPE9m507aYJlTlz3gRdv), [Instagram](https://www.instagram.com/thatunexpectedcanadian/), [LinkedIn](https://www.linkedin.com/in/ashmurrell-amp/), [Substack](https://thatunexpectedcanadian.substack.com/)
- **Contact form fields:** First Name, Last Name, Email, Business Name (optional), Business Website (optional), Reason (Podcast, Speaking, Consulting, Sponsorship)
- **Brand files:** `foTFhP2dJHFT3CAnLu539bTpbo.png` (favicon), `T8zcOaH80i9gFQBP0QQRSiEsNzI.png` (logo mark), `B8boUZ02wUXoapNREHWhqtXhU.svg` (wordmark), `izv3LdPSp2FvyHGp8BhKQmXFg2k.png` (share image), `sOSmPNgXndkQlI8MYdxq27CC70.mp4` (home hero video)

## Episode dates

The live site mixes DD/MM and MM/DD. Each `date` was worked out from the episode order, and `date_as_shown` keeps the original text. Please check:

- Episodes 3, 4, 9, 12, 13, 17, 20, 21, 25, 29, 30, 33, 34 and 38 could be read either way.
- Episode 10 (14 Sep 2025) is dated after episode 11 (6 Jun 2025).
- Episode 1 is dated 4 Apr 2023, more than a year before episode 2 (5 May 2024).

## Changes made during extraction

- Removed an unfilled Framer token (`{{LdKYyr34X}}`) from the episode meta descriptions.
- Pointed internal links at site-root paths and media at local files.
- Left out "Next Episode" and next-post links, since the new site can generate them.

## Problems on the live site, not to carry over

- The "Let's Talk" nav button links to `https://@info@ashmurrell.com`, which is broken. Use `mailto:` instead.
- The footer's About and Podcast links both go to the home page.
- "Listen to Amplified" on Home and About links to the home page rather than the podcast.
- The Blog page's title tag is the podcast's title.
- All blog posts share one generic meta description.
- Most images have no alt text, and the About hero's alt text ("company's staff members in conference room") doesn't sound written for this site.
- Episode 28's URL has a typo (`/he-difference-between...`).
- Episode 38's "Next Episode" chain ends at a broken link on episode 1 (`/podcast/:MJs3bHJAs`).

## Gaps

- 7 of the 11 blog posts have no category, because the blog page only renders the first 4 until "Load More" is clicked.
- Episodes 32 and 33 have very short notes (about 55 words each).
- The share image is a 1889x911 screenshot of the current hero. A 1200x630 image would suit social previews better.

## Old URLs

Every file has `source_url` and `legacy_path`. Some new filenames differ from the old URLs (curly quotes, parentheses and dots removed), so use `legacy_path` to set up redirects if the new URLs change.
