# Domicile — full personal app prototype

**Prototype · planning only · not production**

Founder click-through of the **entire Domicile personal app** (kit ed. 3.2): Today · Map · Places · Explore · You, plus complete **Stays** guest & host paths, Ledger, move planning, arrivals, communities, and Explore mini-flows.

Phone frame (~390×844) on desktop with ambient glow; full-bleed on real phones. Warm parchment / terracotta / olive system. Zero build step, no CDN, system fonts.

## Open

```bash
open /workspace/domicile-full-prototype/index.html
# or
python3 -m http.server 8765 --directory /workspace/domicile-full-prototype
```

Then visit `http://localhost:8765/`. Hash routes work (e.g. `#stays-search`, `#host-dashboard`, `#ledger`, `#move-planning`, `#move-checklist`, `#connected-services`, `#permissions`, `#permission-detail`). Bottom nav remembers the last screen per tab.

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
**You → Permissions & sharing** (or Today Quiet card / Map → Manage sharing) → pause **Sharing with people** (merchant grants unchanged → Connected Services) → **I've shared** → Maya / Devon / Jordan / Cedar Creek task / Priya expired → grant detail (precision, Follow vs Fixed, CT window, preview / extend / revoke / recipient-bound link+QR, access history) → **Shared with me** → **Public & handle** (@al message-only; public map off by default) → **Share destination** wizard. Pairwise IDs (`grant_maya_4c2e`) · prototype only — not live OAuth.

Kit notes honored: authenticated recipient + purpose + fields/precision + time window + selection policy; grants bind to stable accounts not handles; peer expiry (CT); approximate never leaks exact geometry; Follow home vs Fixed version; future/historical default-denied; personal-sharing pause ≠ merchant revoke ≠ public off; recipient-bound links/QR (forwarding ≠ grant); public handle ≠ address; audit history without raw address dump; revoke honesty on screenshots; demo labeling throughout.

### Move Planning (AI-assisted sketch)
Overview (East Cesar Chavez → South Lamar) → recipient checklist with channel/status chips → Assist draft preview (facts from Move Engine; you send) → USPS official-form handoff (never auto-filed) → Suggest missing recipients (DMV, voter reg demo tips)

## Product constraints honored
- Bottom nav fixed: Today · Map · Places · Explore · You  
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
