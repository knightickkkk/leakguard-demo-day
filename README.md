# LeakGuard: campus retail leak monitor

Prototype for the *Innovation & Entrepreneurship for Engineers* Demo Day, IIT Madras, 15 Nov 2026 (Batch B, Group 41).

**Problem.** Campus canteens, stationery shops and general stores have no affordable, integrated way to catch revenue leakage from shoplifting, inventory mismanagement and refund/return fraud.

**Solution.** One web app that ties the three leak points to a single source of truth, the bill:

| Module | What it does |
|---|---|
| Billing | Every sale gets a bill ID, decrements stock and records the cashier and payment mode. |
| Inventory | Physical counts are compared with billed stock; missing items are valued and flagged. Deliveries are checked against supplier invoices. |
| Returns | Every refund must match a real bill and is scored against 7 rules (window, frequency, self-refund, cash-for-UPI, value…). |
| Camera watch | In-browser person detection (TensorFlow.js COCO-SSD) with shelf and exit zones; flags walk-outs with no bill in the last 60 s. |
| Loss estimator | Campus-wide annual leakage and payback, using IIT Madras outlet data and published shrinkage benchmarks. |
| Campus data / Sources | The scraped datasets and every citation. |

Shop transactions are simulated demo data kept in the browser's localStorage (use "Reset demo data" in the footer). Benchmarks and campus data are real and cited; see `data/` and the in-app Sources page.

## Run locally

No build step. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

The camera needs `https` or `localhost`.

## Publish on GitHub Pages

1. Create a new public repository on GitHub (e.g. `leakguard`) and upload the contents of this folder (keep `index.html` at the root).
2. Repository **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`, Save.
3. After a minute the site is live at `https://<your-username>.github.io/leakguard/`.

Vercel or Netlify also work: import the repo, no framework, no build command, output directory `.`.

## Data sources

All accessed 7 Nov 2026. Full list in `data/sources.json`.

- IIT Madras Dean of Students, shops on campus: https://dost.iitm.ac.in/shops
- IIT Madras Hostel Management, eateries and shops: https://ccw.iitm.ac.in/pages/eateries-and-shops
- IIT Madras NIRF 2025 data: https://www.nirfindia.org/nirfpdfcdn/2025/pdf/Overall/IR-O-U-0456.pdf
- NRF National Retail Security Survey 2023: https://nrf.com/media-center/press-releases/shrink-accounted-over-112-billion-industry-losses-2022-according-nrf
- NRF Impact of Retail Theft & Violence 2024: https://nrf.com/media-center/press-releases/shoplifting-incidents-jump-93-since-pre-covid-according-to-new-industry-study
- Global Retail Theft Barometer, India: https://www.ifsecglobal.com/india-region/india-tops-retail-shrinkage-rate/ and https://www.business-standard.com/article/companies/indian-retail-lost-rs-9-295-to-shoplifting-theft-110112400049_1.html
- Appriss Retail / Deloitte returns report 2024: https://chainstoreage.com/losses-return-fraud-and-abuse-exceed-100-billion
- AISHE 2021-22: https://www.freepressjournal.in/education/aishe-report-survey-records-433-crore-enrolments-in-higher-education-in-india
- UPI December 2025: https://www.business-standard.com/amp/industry/news/upi-ends-2025-strong-note-record-transactions-december-126010100687_1.html

## Note on IP

The course IP checklist advises seeking IP advice before a public repository upload or public demo. If the team may want to file a patent on any part of this work, talk to the IITM TTO before making the repository public.
