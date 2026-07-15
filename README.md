# Setup Checklist — Launching Okaloosa Copwatch

Everything in order, from files on your computer to a live, donation-ready site.

---

## Part 0: If you're specifically worried about targeted retaliation

Read this before Part 1. A few sequencing changes and additions make a real difference if you think the local Sheriff's Office might respond to this personally rather than just institutionally.

### A. Keep your home address off every public filing

This is the single highest-leverage thing you can do. Florida LLC filings, FDACS registrations, and domain registrations are all public record by default.

- **Use a commercial registered agent** (~$100–150/yr — Northwest Registered Agent and ReviaLaw are common choices) for your LLC instead of listing yourself. Their address goes on public record, not yours.
- **Use a business mailing address**, not your home, on the FDACS filing and anywhere else that asks — a UPS Store mailbox or similar works and is far cheaper than it sounds (~$15–25/mo).
- **Use WHOIS privacy protection** when you buy your domain (most registrars include this free or for a couple dollars/year) — otherwise your domain registration also publishes your home address.

### B. Form the LLC _before_ you file with FDACS

Filing FDACS under your own name as an individual "sponsor" ties the public solicitation record directly to you personally. Filing it under an LLC (with a registered agent shielding your address) puts a layer of separation between "the org that's watching the Sheriff" and "your home address." This changes the order from the earlier checklist slightly — LLC first, then FDACS.

### C. Know Florida's anti-SLAPP protection exists

Florida has an anti-SLAPP statute (§ 768.295, F.S.) specifically designed to let someone quickly dismiss — and recover attorney's fees from — a lawsuit filed primarily to punish or silence speech on a public issue. If a retaliatory defamation or harassment lawsuit is ever filed against you or the org for your public oversight activity, this is a real, fast legal tool, not just theoretical. **Tell your attorney about this statute by name the moment anything like that happens** — it needs to be raised early in a case to be effective.

### D. Build a relationship with an attorney _before_ you need one

Don't wait for an incident. A short paid consult now with someone from the ACLU of Florida referral network or a Florida Bar Lawyer Referral attorney means:

- They already know your org structure and mission if something happens
- You have a name to call immediately, not a cold search during a crisis
- They can review your flyer/site language in advance for defamation risk (see F, below)

### E. Never operate as a single point of failure

A group with one visible leader is a much easier target than one with genuinely distributed roles. Practically:

- Rotate who's named as the LLC's registered manager/officer if more than one trusted person is willing
- Don't have footage, financial records, or login credentials live on only one person's personal devices — use shared, backed-up storage (see F)
- Multiple people should know how to access the donation platform and bank account, not just one

### F. Protect your documentation the moment it's captured

- Back up footage to cloud storage immediately after recording — a phone that gets confiscated, lost, or "malfunctions" shouldn't mean the footage is gone
- Timestamp and log every recording the same day (date, location, who was present) — contemporaneous notes carry more weight later than reconstructed memory
- Never edit raw footage before backing up the original — always preserve an unedited master copy

### G. Keep every public statement strictly factual

This matters more than it might seem. Sticking to "here's what we observed, here's the footage, here's the timestamp" — and avoiding characterizations, accusations of specific crimes, or speculation about motive — is both good practice _and_ your best defense against a defamation claim. Publish evidence; let people draw their own conclusions rather than stating conclusions for them.

### H. Visibility is itself a form of protection

Counterintuitively, being _more_ publicly known can lower your risk, not raise it — a well-documented, clearly law-abiding, publicly registered watchdog org is a much worse target for retaliation than an anonymous individual, because retaliation against a visible, organized group draws far more attention and legal scrutiny. This is part of why the LLC + FDACS filing + real website (not anonymous social posts) approach is genuinely protective, not just administrative box-checking.

---

### 1. Keep both files together

You have two files: `index-clean.html` and `index-clean.js`. They **must stay in the same folder** — the HTML loads the JS by a relative path (`<script src="index-clean.js">`). If you rename or move one, update the reference in the HTML to match.

### 2. Stop testing by double-clicking the file

Opening the file directly (`file:///Users/you/...`) blocks the news-feed API calls due to browser security rules. Instead, test it locally with a real local server:

```
cd path/to/your/folder
python3 -m http.server 8000
```

Then visit `http://localhost:8000/index-clean.html`. This is temporary — just for testing before you host it for real (Part 3).

### 3. Add your GNews API key

1. Sign up free at **gnews.io** (no credit card).
2. Copy your key from the dashboard.
3. Open `index-clean.js`, find line ~33:
   ```js
   var GNEWS_API_KEY = "YOUR_GNEWS_API_KEY";
   ```
4. Replace the placeholder with your real key. Save.
5. Without a key, the news feed still works — it just falls back to the free Google News RSS chain automatically.

### 4. Connect the database (so data updates without touching code)

The site's stats, spending log, incident log, and chart all pull from a real hosted database — no more editing files to update numbers. We're using **Firebase Firestore** rather than Supabase specifically because Firebase's free tier never pauses for inactivity (Supabase's free tier pauses after about a week of no traffic — a real problem for a site that won't have daily visitors early on).

1. Create a free project at **console.firebase.google.com** (no credit card required).
2. In the project, click **Firestore Database** in the left sidebar → **Create database** → choose **production mode** (we set our own rules in the next step).
3. Go to the **Rules** tab and replace the contents with what's in `firestore.rules` (provided alongside this checklist), then click **Publish**. This locks the database to public **read-only** access — visitors can never edit your data, only you can, by logging into the Console.
4. Create 5 collections using the **"Start collection"** button, adding one example document to each so the fields exist:

   | Collection ID       | Document ID         | Fields to add                                                                                                       |
   | ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------- |
   | `site_stats`        | `main`              | `incidents_logged` (number), `volunteer_hours` (number), `active_observers` (number), `flyers_distributed` (number) |
   | `funding_totals`    | `main`              | `total_raised` (number), `total_spent` (number)                                                                     |
   | `spending_log`      | _(auto-ID is fine)_ | `entry_date` (string, `YYYY-MM-DD`), `category` (string), `description` (string), `amount` (number)                 |
   | `incident_log`      | _(auto-ID is fine)_ | `entry_date` (string, `YYYY-MM-DD`), `description` (string), `status` (string: `Verified` or `Pending`)             |
   | `monthly_incidents` | _(auto-ID is fine)_ | `month_label` (string, e.g. `Sep`), `sort_order` (number), `value` (number), `flagged` (boolean)                    |

   For `spending_log`, `incident_log`, and `monthly_incidents`, add one document per real entry going forward (e.g. one document per expense, one per month).

5. Copy your **Project ID** from the gear icon → **Project Settings** (top of the general tab).
6. Open `index-clean.js`, find this line near the top:
   ```js
   var FIREBASE_PROJECT_ID = "YOUR_FIREBASE_PROJECT_ID";
   ```
7. Replace the placeholder with your real Project ID. Save.

From this point on, **updating your site's live numbers means opening Firebase Console → Firestore Database → clicking into a collection → editing a document** — not editing code, not redeploying, and the project stays live indefinitely with zero maintenance on the free tier.

If you skip this step entirely, the site still works — it just falls back to showing "—" placeholders until you're ready.

### 5. Replace every placeholder

Search both files for these and swap in your real info:
| Placeholder | Where | Replace with |
|---|---|---|
| `contact@example.org` | `index-clean.js` (mailto handler) | Your real contact email |
| `[email@example.org]` | HTML footer | Same email, for display |
| `@[social handle]` | HTML footer | Your real handle |
| `href="#"` on donate buttons | HTML Donate section | Your real donation page link (Part 5) |
| Hero photo frame text | HTML hero section (if using the newspaper/civic-tech versions) | An actual neutral image — see the photo guidance from earlier in this conversation |

### 6. Host it somewhere real

A local file only you can see isn't a launch. Easiest free options:

- **Netlify** — drag-and-drop the folder at app.netlify.com/drop, done in under a minute
- **GitHub Pages** — free if you're comfortable with GitHub, good if you'll keep editing the code over time
- **Vercel** — similar to Netlify, also free tier

Any of these give you a real `https://` URL, which fixes the `file://` restriction permanently and is what you'll actually put on flyers.

### 7. Buy a real domain (optional, but worth it for credibility)

A domain like `okaloosacopwatch.org` (~$12–20/yr from Namecheap, Google Domains, etc.) can point at your Netlify/GitHub Pages/Vercel site in a few clicks and looks far more legitimate on a flyer than a generic subdomain.

---

## Part 2: Set up the legal/financial side

_(Recap from earlier — doing this before you take a single donation keeps you clean.)_

### 7. Get a free EIN

IRS.gov, takes about 10 minutes. Needed to open a bank account even as an unincorporated group or LLC.

### 8. Open a dedicated bank account

Never mix donation money with personal funds. This one step protects you more than almost anything else on this list.

### 9. File your LLC — do this before Part 2's FDACS step

~$125 via Florida's Sunbiz.org, using a commercial registered agent (see Part 0.A) rather than your home address. Gives you personal liability protection and keeps your name off the solicitation registration.

### 10. File the FDACS small-charity exemption, under the LLC

Form FDACS-10110 + FDACS-10122, free, required once you're soliciting donations publicly (even before money comes in) — required if you're under $50k/year and all-volunteer. File this under your LLC's name and registered-agent address, not your personal name/address.

---

## Part 3: Turn on donations for real

### 11. Set up your donation platform

Sign up for **Zeffy** or **Givebutter** (both free, no platform fee if donor tips are enabled). This gives you a real donation page URL.

### 12. Wire the link into the site

Take that donation page URL and drop it into the `href="#"` placeholders on the **Donate via [Zeffy / Givebutter]** button in the HTML.

### 13. Set up a QR-friendly option too

Add a Cash App or Venmo business profile for the low-friction "scan and give $5" option — good for physical flyers, put that link in the second donate button.

---

## Part 4: Before you tell anyone it's live

### 14. Test everything once, end to end

- Click every nav link
- Submit the contact form (confirm it opens your email client correctly)
- Load the site on your phone
- Confirm the news feed loads (may take a moment on first load)
- Click the actual donate button and make sure it goes to a real, working page

### 15. Fill in your real numbers (whenever you have them)

The site is built to show a clean "—" instead of a misleading "0" until you have real data. Update these three spots in `index-clean.js` as things happen:

```js
var STATS = { incidents: 0, hours: 0, observers: 0, flyers: 0 };
var FUNDING = { raised: 0, spent: 0, balance: 0, expenseCount: 0 };
var SPENDING_LOG = [
  /* add entries here as you spend money */
];
```

---

## Suggested order if you want to move fast — and stay protected

1. Set up a registered agent service + business mailbox (Part 0.A) — same day, ~$150–300/yr total
2. EIN → bank account (same day, free)
3. File the LLC through that registered agent (Part 0.B / Part 2.9) — same week, ~$125
4. File the FDACS exemption under the LLC (Part 2.10) — same week, free
5. Host the site on Netlify, domain with WHOIS privacy on (Part 1) — same day, free–$20
6. Sign up for Zeffy/Givebutter, wire the link in — same day, free
7. Get the GNews key — 5 minutes, free
8. Set up Firebase Firestore and publish the security rules — 15–20 minutes, free, never pauses
9. Have a short consult with an ACLU FL or Bar-referral attorney before your first public flyer run — this week, low cost

You can realistically have a live, donation-capable, LLC-shielded site up within **one to two weeks**, for under $500 total — with your personal information kept off every public filing along the way.

---

# Roadmap

## Phase 1 — Foundation (Current)

- [ ] Project scaffolding (client + server monorepo)
- [ ] Database schema + Prisma setup
- [ ] Auth (signup, login, JWT middleware)
- [ ] Basic activity CRUD (API + UI)

## Phase 2 — Core Experience

- [ ] Activity list + detail pages with filtering
- [ ] Stats summary dashboard
- [ ] Form validation and error handling polish
- [ ] Deploy a staging environment

## Phase 3 — Maps & Media

- [ ] Leaflet map integration on activity detail page
- [ ] GPX file upload + parsing
- [ ] Manual route drawing
- [ ] Photo uploads

## Phase 4 — Polish & Share

- [ ] Elevation chart
- [ ] Public profile pages
- [ ] Mobile responsive pass
- [ ] Activity search

## Later / Ideas Backlog

- Social features (following other users, kudos/comments)
- Strava/Garmin import integration
- PWA support for offline logging on trail
- Weather data enrichment per activity (via public API)

---

Track progress against this roadmap by linking PRs to the relevant checkbox item. Update statuses here as features ship — see [Features](Features) for more detail on each item.
