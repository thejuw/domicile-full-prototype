# Domicile — full personal app prototype

**Prototype · planning only · not production**

Founder click-through of the **Domicile personal app** (kit ed. 3.2) plus gated **business** and **crew** workspaces for Cedar & Stone. Three accounts via Switch account: **Al · Personal** · **Cedar & Stone · Owner** · **Casey Nguyen · Crew**. Personal: Today · Map · Places · Explore · You. Owner: Today · Inbox · Jobs · Business. Crew: Today · Jobs · Me. Also Stays, Ledger, move planning, Permissions MAP, private inquiry disclosure.

Phone frame (~390×844) on desktop with ambient glow; full-bleed on real phones. Warm parchment / terracotta / olive system. Zero build step, no CDN, system fonts.

## Open

```bash
open /workspace/domicile-full-prototype/index.html
# or
python3 -m http.server 8765 --directory /workspace/domicile-full-prototype
```

Then visit `http://localhost:8765/` or https://thejuw.github.io/domicile-full-prototype/. Hash routes work (e.g. `#stays-search`, `#permissions`, `#service-inquiry`, `#biz-today`, `#biz-inbox`, `#biz-jobs`, `#biz-profile`, `#crew-today`, `#crew-jobs`, `#crew-job-detail`, `#crew-me`). Bottom nav remembers the last screen per tab; **Owner / Crew / Personal navs replace each other** after Switch account (or cross-mode hash).

**Files:** `index.html` · `app.css` · `app.js` · this README.

## Screen inventory (50+)

### Shell tabs
| Tab | Screens |
|-----|---------|
| **Today** | Dashboard (arrivals, stay, appointment, hosting turnover, HOA) → Arrival detail · Appointment detail |
| **Map** | Permissioned faux MapLibre UI · layer toggles (destinations / businesses / events) · SVG city blobs |
| **Places** | Homes list → **East Cesar Chavez Cottage** Home Profile → Household · Facts/assets · Spending · Bills · Community (HOA balance) · Maintenance · **Hosting** |
| **Explore** | Hub → **Stays** · Services · Events · Packages · Sponsored (Ad-labeled) |
| **You** | Identity · Trips · Hosting · Ledger · **Permissions & sharing** · **Connected services** · Move planning · Support |

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

### Business + Crew workspace (account switch required)
**You → Switch account…** shows three rows:
1. **Al · Personal** → personal Today  
2. **Cedar & Stone Clean Co. · Owner** (Al) → `#biz-today` · nav **Today · Inbox · Jobs · Business**  
3. **Casey Nguyen · Crew @ Cedar & Stone** → `#crew-today` · nav **Today · Jobs · Me** (platform crew account tied to the org — not an Owner overlay)

Owner “View as Crew” lens on Business tab remains optional; **real account switch is the primary story**.

**Cross-mode rule:** Opening `#crew-*` while on Personal/Owner auto-switches to Casey (toast) and vice versa for `#biz-*` / personal hashes. Personal Explore never shows Owner inbox chrome.

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
7. Switch account → **Casey Nguyen · Crew** → Today / Jobs shows Deep clean River Guest (+ seeded Turnover)  
8. Open job → scoped address (exact if grant approved / job unlocked) → **Start** → **On the way** → **Complete**  
9. Switch back to Owner → Jobs shows Completed · inquiry history “Job completed by Casey”

Owner Today shortcut: **Continue E2E: assign River Guest job** when that job exists unassigned.

**Shared state (`bizJobs[]` in `app.js`):** id, inquiryId, service, whenLabel, customerAlias, status (`needs_assign|scheduled|in_progress|completed`), assigneeId (`casey|riley|null`), addressExact / addressApprox, accessNotes, crewPhase. Owner assign updates assigneeId; Crew lists filter `assigneeId === 'casey'`.

**Shared grant sync (`outgoingGrants`):**
- Provider Request exact ↔ `exactRequested` · resident Approve exact ↔ `precision: exact`  
- Provider Send quote ↔ `inquiryStatus: quoted` · Accept quote ↔ `accepted` + job row  
- Personal Pause sharing with people does **not** create/cancel inquiry, merchant rights, or jobs  

Kit: W2 · P38 team roles · P39 coverage · P43 inquiries/quotes · P45 ops. Crew is org-linked with role Crew — sees only assigned jobs (and schedule), not full inquiry inbox / all customers / finance. Exact address / access notes are job-scoped for the assignee during the job window; reassign revokes prior access. Opaque refs in toasts. Prototype labels throughout.


### Move Planning (AI-assisted sketch)
Overview (East Cesar Chavez → South Lamar) → recipient checklist with channel/status chips → Assist draft preview (facts from Move Engine; you send) → USPS official-form handoff (never auto-filed) → Suggest missing recipients (DMV, voter reg demo tips)

## Product constraints honored
- Personal bottom nav: Today · Map · Places · Explore · You  
- Owner bottom nav (after switch): Today · Inbox · Jobs · Business  
- Crew bottom nav (Casey): Today · Jobs · Me  
- Account switch required before any Owner or Crew role UI  
- Quote ≠ job until Accept; Accept creates/activates the job  
- Crew sees only assigned jobs; reassign revokes prior exact access  
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
