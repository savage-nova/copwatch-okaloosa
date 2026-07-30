# Okaloosa Copwatch

Independent, volunteer-run civilian oversight of the Okaloosa County Sheriff's Office.

We document public law enforcement activity, publish what we find, and help residents understand their rights — clearly, and backed by facts. This repository contains the source for our public website.

**Not affiliated with, endorsed by, or operated by any government agency.**

<img width="1910" height="873" alt="Image" src="https://github.com/user-attachments/assets/a8c12edb-c4e0-48da-ae1c-e8407fd0c315" />

---

## About the project

Okaloosa Copwatch is a static website with a small live-data layer:

- A public incident log and monthly activity dashboard
- Third-party accountability data (via [Police Scorecard](https://policescorecard.org/fl/sheriff/okaloosa-county))
- A live local-news feed filtered to county law-enforcement coverage
- A know-your-rights reference for Florida law
- A public "Share Your Story" intake, reviewed privately before anything is published
- Full funding transparency — every dollar donated, logged and shown publicly

## Live site

🔗 [okaloosacopwatch.org](https://okaloosacopwatch.org) _(once DNS is pointed — see Deployment below)_

## Tech stack

No framework, no build step — plain HTML/CSS/JS by design, so anyone can read, audit, or fork this code without special tooling.

| Layer                                                            | Choice                                                                                  | Why                                                                                                     |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Structure/Styling                                                | Vanilla HTML5 + CSS                                                                     | Zero dependencies, fully auditable                                                                      |
| Interactivity                                                    | Vanilla JavaScript (ES5-leaning)                                                        | Runs everywhere, no build pipeline                                                                      |
| Local news feed                                                  | [GNews API](https://gnews.io) → falls back to Google News RSS via rotating CORS proxies | Free tier, works from a static site with no backend                                                     |
| Live data (stats, incident log, spending log, story submissions) | [Cloud Firestore](https://firebase.google.com/docs/firestore)                           | Free tier never pauses for inactivity; public read/write rules enforce privacy without a custom backend |
| Hosting                                                          | Netlify / GitHub Pages / Vercel (any static host)                                       | Free, simple drag-and-drop or Git-based deploy                                                          |

## Project structure

```
├── index.html          # Site markup
├── style.css            # All styling
├── script.js             # All interactivity, news feed, and Firestore data layer
├── firestore.rules       # Security rules — paste into Firebase Console
└── README.md
```

## Getting started locally

```bash
git clone https://github.com/savage-nova/copwatch-okaloosa.git
cd copwatch-okaloosa
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Opening `index.html` directly via `file://` will break the live news feed and database calls — always serve it through a local server, even for quick testing.

## Configuration

Two values need to be set in `script.js` before the live data features work. Until they're set, the site runs fine on placeholder/fallback data.

```js
var GNEWS_API_KEY = "YOUR_GNEWS_API_KEY"; // free key from gnews.io
var FIREBASE_PROJECT_ID = "YOUR_FIREBASE_PROJECT_ID"; // from Firebase Console → Project Settings
```

### Setting up Firestore

1. Create a free project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** in production mode
3. Paste the contents of `firestore.rules` into the **Rules** tab and publish
4. Create the following collections (see `firestore.rules` for exact read/write permissions on each):
   - `site_stats`, `funding_totals`, `spending_log`, `incident_log`, `monthly_incidents` — public read-only
   - `story_submissions` — public create-only (submissions are never publicly readable)
   - `published_stories` — public read-only (populated manually after reviewing a submission)

## Deployment

Any static host works. No build step is required — deploy the repository as-is.

- **Netlify:** drag the repo folder onto [app.netlify.com/drop](https://app.netlify.com/drop), or connect the GitHub repo for automatic deploys
- **GitHub Pages:** enable Pages in repo settings, pointing at the `main` branch root
- **Vercel:** import the repo, no framework preset needed

## Contributing

This is a small volunteer project. If you'd like to help:

- Open an issue for bugs or suggestions
- Pull requests welcome for accessibility, performance, or content-accuracy fixes
- For anything touching legal content (Know Your Rights, Scorecard data), please cite your source in the PR description

## Legal

All legal and rights information on the site reflects publicly available law as of the last update and is provided for general information only — **it is not legal advice.** See the site's Legal & Disclosures section for details and how to reach a licensed attorney.

## License

Code in this repository is available under the [MIT License](LICENSE) unless noted otherwise. Data pulled from third-party sources (Police Scorecard, Google News) remains the property of its original publishers — see in-page citations and linked sources.

## Contact

📧 okaloosacopwatch@protonmail.com
