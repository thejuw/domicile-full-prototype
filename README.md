# Domicile — full personal app prototype

**Prototype · planning only · not production**

Founder click-through of the **Domicile personal app** (kit ed. 3.2) plus gated **business** and **crew** workspaces for Cedar & Stone, plus a standalone **W8 public/guest share shell**. Three accounts via Switch account: **Al · Personal** · **Cedar & Stone · Owner** · **Casey Nguyen · Crew**. Personal: Today · Map · Places · Explore · You (incl. Event organizer under You). Owner: Today · Inbox · Jobs · Business. Crew: Today · Jobs · Me. Also Stays, Ledger, move planning, Permissions MAP, private inquiry disclosure, and cold public hashes (business / event / stay / invite / grant / QR) without personal nav.

Phone frame (~390×844) on desktop with ambient glow; full-bleed on real phones. Warm parchment / terracotta / olive system. Zero build step, no CDN, system fonts.

## Open

```bash
open /workspace/domicile-full-prototype/index.html
# or
python3 -m http.server 8765 --directory /workspace/domicile-full-prototype
```

Then visit `http://localhost:8765/` or https://thejuw.github.io/domicile-full-prototype/. Hash routes work (e.g. `#stays-search`, `#permissions`, `#service-inquiry`, `#org-events`, `#org-event-detail`, `#org-event-edit`, `#biz-today`, `#biz-inbox`, `#biz-jobs`, `#biz-profile`, `#biz-finance`, `#biz-payments`, `#biz-settings`, plus **Messages** `#messages`, `#message-thread`, `#message-compose`, `#notifications`, `#assist`, `#support-cases`, `#support-case`, `#biz-catalog`, `#biz-customers`, `#biz-team`, `#crew-today`, `#crew-jobs`, `#crew-job-detail`, `#crew-me`, plus **W8** `#public`, `#public-business`, `#public-event`, `#public-stay`, `#public-stay-invite`, `#public-place`, `#public-qr`, `#public-handle`, `#public-signin`, `#public-gallery`). Bottom nav remembers the last screen per tab; **Owner / Crew / Personal navs replace each other** after Switch account (or cross-mode hash). **Public workspace hides all bottom navs.**

**Files:** `index.html` · `app.css` · `app.js` · this README.

## Screen inventory (50+)

### Shell tabs
| Tab | Screens |
|-----|---------|
| **Today** | Dashboard (arrivals, stay, appointment, hosting turnover, HOA) → Arrival detail · Appointment detail |
| **Map** | Permissioned faux MapLibre UI · layer toggles (destinations / businesses / events) · SVG city blobs |
| **Places** | Homes list → **East Cesar Chavez Cottage** Home Profile → Household · Facts/assets · Spending · Bills · Community (HOA balance) · Maintenance · **Hosting** |
| **Explore** | Hub → **Stays** · Services · Events · Packages · Sponsored (Ad-labeled) |
| **You** | Identity · Trips · Hosting · **Events I'm organizing** · Ledger · **Permissions & sharing** · **Connected services** · Move planning · **Messages** · Notifications · **Public & guest links (W8)** · Support / Assist / Cases |

### Stays — guest (Explore → Stays)
Search → results list/map → listing → checkout (instant / request) → confirmation → Trips → pre-arrival lock → **Demo unlock** → address / house guide / code → messaging → active stay → checkout checklist → receipt / review

### Stays — host (Places → Home → Hosting)
Dashboard · listing visibility (private vs public gated) · calendar with **Sep 23 conflict** · reservation / turnover · invite link

### Also included
- Arrivals card → ETA / coarse map / provider handoff
- Ledger: guest stay · service · HOA · utility lines
- Communities: Holly Grove HOA read-only balance
- Move planning: update once · preview recipients · who stays updated

## Suggested demo paths

### 60-second founder path (email-friendly)
1. **Today** — tap package arrival, then back; glance stay + turnover cards  
2. **Explore → Stays** → Search → **Oak & Waller Loft** → Instant book → Trips → **Demo: simulate unlock**  
3. **Places** → East Cesar Chavez Cottage → **Hosting** → Calendar (spot conflict)  
4. **You → Ledger** — source-attributed spend  

### Guest full spine
Explore → Stays → search → listing → checkout → Trips → unlock → check in → checkout → receipt

### Host spine
Places → Cottage → Hosting → Listing · Calendar · Reservation · Invite

### Home / community / move
Places → Home → Community (HOA) · **Today or You → Move Planning** → checklist → AI draft (HOA) → confirm send · USPS handoff · You → Permissions

### Connected services (~30s)
**You → Connected services** → Amazon (API apply · Follow home · Applied OK) → pin South Lamar / follow home → **Update now** → Exclude/Include on Move Planning → back → Move card shows follow/pinned/excluded counts. Add sheet lists capability honesty (API / Deep link / Draft). Demo only — not real OAuth.

### Permissions & sharing (~30s · MAP)
**You → Permissions & sharing** (or Today Quiet card / Map → Manage sharing) → pause **Sharing with people** (merchant & **inquiry** grants unchanged → Connected Services) → **I've shared** → Maya / Devon / Jordan / Cedar Creek task / **Cedar & Stone inquiry** / Priya expired → grant detail (precision, Follow vs Fixed, CT window, preview / extend / revoke / recipient-bound link+QR, access history) → **Shared with me** → **Public & handle** (@al message-only; public map off by default) → **Share destination** wizard. Pairwise IDs (`grant_maya_4c2e`, `grant_inq_cedar_7a2f`) · prototype only — not live OAuth.

Kit notes honored: authenticated recipient + purpose + fields/precision + time window + selection policy; grants bind to stable accounts not handles; peer expiry (CT); approximate never leaks exact geometry; Follow home vs Fixed version; future/historical default-denied; personal-sharing pause ≠ merchant revoke ≠ public off; recipient-bound links/QR (forwarding ≠ grant); public handle ≠ address; audit history without raw address dump; revoke honesty on screenshots; demo labeling throughout.

### Private inquiry disclosure (~30s · Explore → Services)
**Explore → Services** (banner: matched privately · businesses not notified until inquire) → **Cedar & Stone Clean Co.** → **Send private inquiry** → disclosure sheet (locked recipient, service, window, owned place vs view-only Maya, approx ON / exact OFF, inquiry alias “River Guest” vs @al, notes, provider preview without street) → **Submit** → toast with opaque grant id (no street) → **permission-detail** for `grant_inq_cedar_7a2f` (Approve exact / Not now · Preview as provider · Revoke). Pause sharing with people does **not** pause inquiry rows. Quote ≠ booking. **Single-demo:** submit refreshes the seeded Cedar inquiry id rather than spawning duplicates.

Kit (P40/P41/P43) honored: browsing ≠ leads; one provider only; explicit disclosure; default approx area; identity ≠ address; inquiry-scoped alias; no forward of view-only places; quote ≠ booking; opaque toast refs; revoke blocks new disclosure (copies not recalled); personal pause ≠ inquiry cancel; prototype labeling.

### Event organizer (~60s · personal · W5)
**Stay on Al · Personal** — no business/crew switch. Entry: **You → Events I'm organizing** (also Explore → Events → Organize an event · Today Events card).

1. Hub `#org-events` — East Side Porch Social (published) · Lantern Night draft · Spring Block Coffee (closed)  
2. Stats strip: interest only / confirmed / waitlist / seats left (honest · P45)  
3. Open Porch Social → RSVPs: Interest ≠ Pending ≠ Confirmed ≠ Waitlist ≠ Checked-in · Approve / Waitlist / Decline  
4. **Aliases** — display aliases only (e.g. Lantern Guest); no @root-handle map  
5. **Check-in** — tap Check in on a confirmed seat (Map open ≠ attendance)  
6. **Venue** — policy version · exact holders · Revoke / Bump version (authority warning)  
7. **Metrics** — interested / requested / confirmed / waitlist / attended labeled separately  
8. Broadcast sheet · Cancel (revokes future exact grants) · Close  
9. Explore → Events → Porch Social → **RSVP interest** syncs into organizer Interest list (not a seat) · ticketing off throughout  

Kit: venue publication ≠ Places/friend visibility; context aliases (P41); exact pin only to confirmed in-window (P42); honest ops metrics (P45); personal organizer chrome only.

### Business + Crew workspace (account switch required)
**You → Switch account…** shows three rows:
1. **Al · Personal** → personal Today  
2. **Cedar & Stone Clean Co. · Owner** (Al) → `#biz-today` · nav **Today · Inbox · Jobs · Business**  
3. **Casey Nguyen · Crew @ Cedar & Stone** → `#crew-today` · nav **Today · Jobs · Me** (platform crew account tied to the org — not an Owner overlay)

**Real account switch is the primary story** (Switch → Casey). Optional View-as-Crew lens is demoted; use Switch for full crew UX.

**Cross-mode rule:** Opening `#crew-*` while on Personal/Owner auto-switches to Casey (toast) and vice versa for `#biz-*` / personal hashes. Personal Explore never shows Owner inbox chrome. **Nothing business-shaped appears in personal mode.**

#### End-to-end click path (one session · inquiry → quote → job → crew)

**A. Resident (Al · Personal)** — already seeded: Explore → Services → Cedar inquiry → `grant_inq_cedar_7a2f` (or Permissions → that grant). Exact may be pending; Approve exact on Permissions if Owner requested it.

**B. Owner (Cedar & Stone)**  
1. Switch account → **Cedar & Stone · Owner** → Business Today  
2. **Inbox** → River Guest (`grant_inq_cedar_7a2f`) · Request exact if needed · resident Approves on Personal (or use approved exact)  
3. **Send quote** → opaque `quote_cedar_…` · quote ≠ booking  
4. **Accept quote (demo)** → creates/updates `job_deep_river_01` status `needs_assign`, links `inquiryId: grant_inq_cedar_7a2f`  
5. **Jobs** (board already has Turnover / Recurring / Move-out seeds) → River Guest job → **Assign crew** → **Casey Nguyen**  
6. Optional: Reassign → Riley · toast “Casey access ended · Riley now assigned” · Casey’s list loses that job  

**C. Crew (Casey)**  
7. Switch account → **Casey Nguyen · Crew** → Today / Jobs shows Deep clean River Guest (+ seeded Turnover mid-flight: **On the way**)  
8. Open job → scoped address (exact if grant approved / job unlocked) → **Start** → **On the way** → **Complete**  
   - Each tap writes a real `Date` stamp into `statusLog` and denormalized `startedAt` / `onTheWayAt` / `completedAt`  
   - Crew has **no reset** — note says ask Owner if tapped by accident; read-only status history timeline  
9. Switch back to Owner → Jobs list badges show live execution (Started / On the way / Completed) plus short duration (“Started 10:04a · 26m”)  
10. Open job detail → **Execution status** card (time since Started / On the way, active service duration, door-to-done when Completed) + **Status history** timeline  
11. **Owner reset** (Owner-only): **Reset to Scheduled** or **Step back** one status → clears later timestamps, writes audit row e.g. “Owner Al reset Completed → Scheduled” → Casey’s job detail reflects Scheduled again (shared `bizJobs`)

Owner Today shortcut: **Continue E2E: assign River Guest job** when that job exists unassigned.

**Seeded mid-flight:** `job_turnover_02` (Turnover · Loft Host) loads already **On the way** with Started (~26m ago) + On the way (~10m ago) history so Owner sees stamps/duration without clicking. River Guest E2E (`job_deep_river_01` via Accept quote) still works from Needs crew → Assign Casey → crew advance.

**Shared state (`bizJobs[]` in `app.js`):** id, inquiryId, service, whenLabel, customerAlias, status (`needs_assign|scheduled|in_progress|completed`), crewPhase (`null|started|on_way|completed`), assigneeId (`casey|riley|null`), addressExact / addressApprox, accessNotes, `startedAt` / `onTheWayAt` / `completedAt` (ISO), `statusLog: [{ status, atIso, byAccountId, byLabel, note?, kind?, fromStatus?, toStatus? }]`. Owner assign updates assigneeId; Crew lists filter `assigneeId === 'casey'`. Owner reset via `ownerResetJobStatus(jobId, targetStatus)` (workspace must be business / Al).

**Shared grant sync (`outgoingGrants`):**
- Provider Request exact ↔ `exactRequested` · resident Approve exact ↔ `precision: exact`  
- Provider Send quote ↔ `inquiryStatus: quoted` · Accept quote ↔ `accepted` + job row  
- Personal Pause sharing with people does **not** create/cancel inquiry, merchant rights, or jobs  

Kit: W2 · P38 team roles · P39 coverage · P43 inquiries/quotes · P45 ops. Crew is org-linked with role Crew — sees only assigned jobs (and schedule), not full inquiry inbox / all customers / finance. Exact address / access notes are job-scoped for the assignee during the job window; reassign revokes prior access. Opaque refs in toasts. Prototype labels throughout.


### Business suite hub (W2 · Owner → Business)

`#biz-profile` is a **directory hub** (not a thin stub): org header, quick stats (open inquiries · active jobs · outstanding AR · next payout), and you-row menu into every management surface. Bottom nav stays **Today · Inbox · Jobs · Business**.

| Screen | Hash | Notes |
|--------|------|--------|
| **Business hub** | `#biz-profile` | Org · stats · menu · Switch account |
| Public profile | `#biz-public-profile` | Guest preview · public ≠ address book |
| Service catalog | `#biz-catalog` · `#biz-catalog-detail` | Deep clean · Turnover · Tidy · add sheet (demo) |
| Coverage & schedule | `#biz-coverage` · `#biz-schedule` | East Austin · mobile stops · coverage ≠ capacity |
| Customers CRM | `#biz-customers` · `#biz-customer-detail` | River Guest + Loft Host + Maple · **no browse leads** |
| Team & permissions | `#biz-team` · `#biz-team-member` | Al Owner · Casey · Riley · capability matrix (P38) |
| Finance / Ledger | `#biz-finance` · `#biz-invoice-detail` | Quoted ≠ invoiced ≠ paid ≠ paid-out (P59) · tabs · export |
| Payments & payouts | `#biz-payments` | Hosted processor honesty · payout demo · not a wallet |
| Integrations | `#biz-integrations` | Calendar / CRM / processor · authority + demo toggles |
| Growth | `#biz-growth` | Funnel metrics · sponsored vs organic labeled |
| Business settings | `#biz-settings` | Owner-only · timezone CT · pause business sheet |

**Finance seed (distinct amounts):** River Guest outstanding (quoted=invoiced $210, unpaid); Loft Host paid pending payout ($135 quoted → $128 invoiced/paid); Maple paid-out ($85 → $81 after fee); Aug exception for refund demo.

#### Business suite click path (~60s)
1. Switch account → **Cedar & Stone · Owner** → **Business**
2. Glance stats → **Finance / Ledger** → Invoices tab → open Loft Host → note quoted/invoiced/paid/paid-out → **Refund (demo)** toast
3. Back → **Payments & payouts** → Run next payout (demo)
4. **Customers** → River Guest → inquiry / job / invoice links (deliberate CRM only)
5. **Team** → capability matrix → Switch → Casey (crew has no Business tab)
6. Switch back Owner → **Settings** → Pause business sheet (safe stop demo) or **Catalog** → Add offering

Kit: **W2** Business management · **P38** team/permissions · **P39** coverage/schedules · **P45** ops (coverage ≠ capacity) · **P55** catalogs · **P56** crews/dispatch · **P57** jobs · **P58** CRM/calendar integrations · **P59** invoices/payments/reconciliation · **P80** business finance ledger. Owner-only finance mutations, settings, payouts, refunds. Prototype labels throughout — no real payments/OAuth.

### Public / guest share shell (~60s · W8)

Standalone guest experience for recipients who open a link or QR **without** personal / business / crew chrome. Mode: `data-workspace="public"` · phone class `public-mode` · no bottom nav · slim “Domicile · Guest link · Sign in” chrome.

#### Cold deep links (GitHub Pages)
Base: `https://thejuw.github.io/domicile-full-prototype/`

| Surface | Hash | Seed |
|---------|------|------|
| Entry (handle / paste / QR) | `#public` or `#public-entry` | Resolve demos below |
| Business public page | `#public-business` · `#/p/b/cedar` | `@cedarstone` |
| Personal handle card | `#public-handle` | `@al` (message-only · no address) |
| Event (guest) | `#public-event` | `evt_porch_01` Porch Social |
| Stay listing card | `#public-stay` | Oak & Waller · cohort gate |
| Private stay invite | `#public-stay-invite` | `ecc-7f3a9c` |
| Permitted location card | `#public-place` · `#public-grant` | `grant_maya_4c2e` |
| QR landing | `#public-qr` | `maya_4c2e_opaque` |
| Sign-in continuation | `#public-signin` | Mock → unlock permitted fields |
| Demo gallery | `#public-gallery` | All of the above |

**Resolve chips on `#public`:** `@cedarstone` · `@al` · `domicile.app/grant/grant_maya_4c2e` · `domicile.app/stay/invite/ecc-7f3a9c` · `domicile.app/event/evt_porch_01` · `domicile.app/qr/maya_4c2e_opaque`.

#### 60s guest click path
1. Open `#public` cold → tap `@cedarstone` → public business (coverage blurb · **no street**) → **Inquire** → context alias “Garden Guest” · approx default → Send  
2. Back entry → stay invite chip → `#public-stay-invite` → banner invite-bound · Accept  
3. Entry → grant link → limited location card → **Continue with Domicile** → mock sign-in → permitted fields toast  
4. `#public-event` → RSVP interest with **event alias** · exact venue locked  
5. `#public-qr` → opaque token · recipient-bound honesty → Continue to location card  

#### How signed-in app opens W8
- **You → Public & guest links (demo)** or **Support → Public & guest links** or Permissions → **Public & handle → Open guest link gallery**
- Owner **Business → Public profile → Open public link** → `#public-business`
- Hosting **Invite guest → Open guest link / Copy link** → `#public-stay-invite` (`ecc-7f3a9c`)
- Permissions grant detail → **Open recipient link** / **Open QR landing** (and QR sheet CTA) → `#public-place` / `#public-qr`
- Organizer event detail → **Preview as guest** → `#public-event`

#### Product rules shown in UI
1. Public page ≠ address book  
2. Share/QR recipient-bound (forwarding ≠ grant)  
3. Handle ≠ location  
4. Exact venue/home only after eligibility  
5. Context aliases for inquire / RSVP (not root handle by default)  
6. Private stay invite ≠ public Stays discovery  
7. Sign-in continuation unlocks permitted fields without full account switcher  
8. Personal / business / crew flows unchanged  

Kit engines: E01, E03–E06, E08–E11, E13, **E19**, **E22**, E23 · inventory **W8** · Messages/Assist/Cases on personal shell.


### Messages · Assist · Support cases (~90s · E19 / E22 · P70/P71)

Personal inbox for **contextual** threads (not a free-floating social DM). Owner Inbox stays the business inquiry CRM.

#### Deep links
| Surface | Hash |
|---------|------|
| Inbox hub | `#messages` |
| Thread (Mira stay) | open from hub or `openMessageThread('thr_mira_01')` |
| Compose (context-first) | `#message-compose` |
| Notification prefs | `#notifications` |
| Assist (context-scoped) | `#assist` |
| Support hub | `#support` |
| Cases list / detail | `#support-cases` · `#support-case` |

Also: Today → Messages card · You → Messages (unread badge) · Stay **Message host/guest** → same Mira thread · trip-messaging redirects into shared store.

#### 90s click path (E19 + E22)
1. **You → Messages** — filter chips All / Stays / Services / Events / Sharing / Move / Support · 7 seeded threads  
2. Open **Mira R.** — bubbles + house-guide action card · tap outbound ✓ to cycle Sent→Delivered→Read · **Reminder**  
3. Open **Cedar & Stone** — alias banner **River Guest** · Approve exact + View/Accept quote action cards  
4. Thread ✦ **Assist** — permission banner · citations (HA-*) · Look up status (read) · refuse “issue a refund” · **Escalate to human** → case with handoff packet  
5. **Support → Cases** — open Amazon case · note **Closing chat ≠ closing case** · Close case control separate · simulate human reply  
6. Overflow ⋯ → **Notification preferences** — quiet hours CT · per-context toggles · marketing off  

Seeds: Mira stay · Cedar/River Guest inquiry · Casey job update · Porch Social · Maya grant · Holly Grove move draft · Support case. Biz Owner Inbox unchanged.

Kit: **E19** contextual threads, structured actions, delivery, reminders, notification prefs · **E22** Assist retrieval with citations, bounded tools + confirm, human handoff packet, case management · **P70/P71** permission-filtered knowledge, no general DB/SQL, writes need exact-param confirm, closed chat ≠ issue resolved.

### Move Planning (AI-assisted sketch)
Overview (East Cesar Chavez → South Lamar) → recipient checklist with channel/status chips → Assist draft preview (facts from Move Engine; you send) → USPS official-form handoff (never auto-filed) → Suggest missing recipients (DMV, voter reg demo tips)

## Product constraints honored
- Personal bottom nav: Today · Map · Places · Explore · You  
- Owner bottom nav (after switch): Today · Inbox · Jobs · Business  
- Crew bottom nav (Casey): Today · Jobs · Me  
- Public/guest shell: no bottom nav · cold hash entry · recipient-bound share honesty  
- Account switch required before any Owner or Crew role UI  
- Quote ≠ job until Accept; Accept creates/activates the job  
- Crew sees only assigned jobs; reassign revokes prior exact access  
- Job execution status is shared; Owner sees live stamps/duration; Owner-only reset with audit row  
- Crew cannot reset status (ask Owner); duration uses real in-session `Date` stamps  
- Private-cohort chrome + gated public discovery  
- Exact address / door codes only after unlock for confirmed guests  
- Guest ≠ household / tenant / resident  
- Sponsored clearly **Ad**-labeled before interaction  
- Fictional Austin sample data only (Oak & Waller Loft, East Cesar Chavez Cottage, etc.)  
- CSS gradient photo placeholders — no external image URLs  

## Technical notes
- Pure static; open via `file://` or any static host  
- Hash routing; nav memory per tab  
- No login wall  
- Static html+css+js; open via `file://` or any static host  

## Deliberate omissions
- No real payments, auth, MapLibre tiles, or provider APIs  
- Secondary listings / ads deep-link the primary demo spine  
- Earnings / exports / partner handoffs are toast stubs  
