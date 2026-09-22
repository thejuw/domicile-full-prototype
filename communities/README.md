# Domicile Communities — interactive prototype

**Prototype · planning only · not production**

Founder click-through of Domicile **Communities / HOA / property operations** (kit ed. 3.2 COMMUNITIES): linked **Resident** (phone) and **Manager** (desktop ops) workspaces with a role switcher.

Warm parchment / terracotta / olive system. Zero build step, system fonts, CSS gradient photo placeholders — no external image URLs.

## Open

```bash
open /workspace/domicile-communities-prototype/index.html
# or
python3 -m http.server 8766 --directory /workspace/domicile-communities-prototype
```

Then visit `http://localhost:8766/`. Hash routes: `#r-bills`, `#r-amenities`, `#mgr/m-exceptions`, etc.

**Files:** `index.html` · `app.css` · `app.js` · this README.

## Screen inventory

### A) Resident / owner (phone)
| Area | Screens |
|------|---------|
| **Shell** | Today · Places · Community · You (+ Places→Home framing) |
| **Accounts** | Community home with switcher: **Cedar Grove Condos · Unit 204** (HOA) ↔ **South Lamar Flats · Apt 3B** (rent) |
| **Bills** | Due soon / Scheduled / History · itemized statement · pay honesty modes |
| **Pay** | Checkout sheet only for **Pay in app**; provider + track-and-remind explain truthfully |
| **Payment states** | Initiated ≠ processing ≠ settled ≠ ledger posted (mid-reconcile special assessment) |
| **Maintenance** | Submit (photos, PTE + appointment window) · status timeline |
| **Amenities** | Clubhouse + guest parking · rules, capacity, cancel |
| **Notices** | Targeted copy · no mailing-list leak |
| **Architectural** | Submit → decision history |
| **Move** | Checklist that blocks on unsettled balances |
| **Home costs** | Dues overview + escrow-aware note |

### B) Manager (desktop shell)
| Nav | Screen |
|-----|--------|
| Portfolio | KPIs · properties · attention |
| Residents & owners | Cedar Grove · roles not collapsed (resident / owner / payer) |
| Accounts | Source HOA ledger · freshness · no competing bank ledger |
| Exceptions **(3)** | Unmatched payment · sync failure · unassigned request |
| Maintenance | Triage → assign → status (+ WO detail modal) |
| Community | Notice composer (authorized audience) · amenity calendar |
| Move-in/out | Turnover + access change · no silent debt redirect |
| Administration | Mandate · co-brand · modules · privacy chrome |

## 60-second demo path

1. **Resident** (default) → Community → **Bills & payments** → **Pay $312** (Pay in app sheet) → Confirm → payment states  
2. Switch account chip → **South Lamar** → Bills → see **Pay through provider** / **Track and remind** (no fake checkout)  
3. Community → **Maintenance** (photos + PTE) → status · **Amenities** → reserve / cancel  
4. Role switcher → **Manager** → Portfolio → **Exceptions** (badge 3) → **Maintenance** → open WO  

Under 3 minutes for the full resident bill→pay→maint→amenity and manager portfolio→exceptions→maintenance spine.

## Product constraints honored

- Pay honesty labels: Pay in app / Pay through provider / Track and remind  
- Payment state distinctions; source ledger freshness; Domicile does not invent a competing bank ledger  
- PTE separate from permanent address access  
- Notices: authorized recipients only; no mailing-list leak copy  
- Move checklist does not silently close unsettled balances  
- Escrow-aware home-cost note  
- Manager sees property relationships only — stated in sidebar + admin chrome  
- Fictional Austin data only · Prototype · planning only badges  

## Technical notes

- Pure static; `file://` or any static host  
- Role switch + hash routing (`#r-*` / `#mgr/m-*`)  
- ~98 KB uncompressed (html+css+js)  

## Deliberate omissions

- No real payments, auth, or provider APIs  
- Secondary manager filters / exports are toast stubs  
- Not deployed; local prototype only  
