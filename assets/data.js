/* LeakGuard reference data.
   Everything in SOURCES, BENCHMARKS and OUTLETS was collected from the public web on 7 Nov 2026.
   CATALOGUE prices are indicative MRPs used for the demo shop; they are not scraped values. */

const ACCESSED = "7 Nov 2026";

const SOURCES = {
  nrf2023: {
    title: "NRF National Retail Security Survey 2023 (press release)",
    org: "National Retail Federation (USA)",
    url: "https://nrf.com/media-center/press-releases/shrink-accounted-over-112-billion-industry-losses-2022-according-nrf",
  },
  nrf2024: {
    title: "The Impact of Retail Theft & Violence 2024 (press release, 17 Dec 2024)",
    org: "NRF + Loss Prevention Research Council",
    url: "https://nrf.com/media-center/press-releases/shoplifting-incidents-jump-93-since-pre-covid-according-to-new-industry-study",
  },
  grtbIndia2009: {
    title: "India tops retail shrinkage rate (Global Retail Theft Barometer, Jul 2008 - Jun 2009)",
    org: "IFSEC Global / Centre for Retail Research",
    url: "https://www.ifsecglobal.com/india-region/india-tops-retail-shrinkage-rate/",
  },
  grtbIndia2010: {
    title: "Indian retail lost Rs 9,295 cr to shoplifting, theft (GRTB, year to Jun 2010)",
    org: "Business Standard, 24 Nov 2010",
    url: "https://www.business-standard.com/article/companies/indian-retail-lost-rs-9-295-to-shoplifting-theft-110112400049_1.html",
  },
  grtbGlobal2007: {
    title: "Shrink costs the world's retailers $98.6 billion (GRTB 2007)",
    org: "Security Magazine, 30 Nov 2007",
    url: "https://securitymagazine.com/articles/78786-shrink-costs-the-worlds-retailers-98-6-billion-2",
  },
  appriss2024: {
    title: "Losses from return fraud and abuse exceed $100 billion (Appriss Retail / Deloitte 2024)",
    org: "Chain Store Age",
    url: "https://chainstoreage.com/losses-return-fraud-and-abuse-exceed-100-billion",
  },
  aishe: {
    title: "AISHE 2021-22: 4.33 crore enrolments in higher education",
    org: "Free Press Journal, 26 Jan 2024 (Ministry of Education data)",
    url: "https://www.freepressjournal.in/education/aishe-report-survey-records-433-crore-enrolments-in-higher-education-in-india",
  },
  nirf: {
    title: "IIT Madras NIRF 2025 data (student strength)",
    org: "National Institutional Ranking Framework",
    url: "https://www.nirfindia.org/nirfpdfcdn/2025/pdf/Overall/IR-O-U-0456.pdf",
  },
  dost: {
    title: "Shops on campus",
    org: "Dean of Students, IIT Madras",
    url: "https://dost.iitm.ac.in/shops",
  },
  ccw: {
    title: "Eateries and shops",
    org: "Office of Hostel Management (CCW), IIT Madras",
    url: "https://ccw.iitm.ac.in/pages/eateries-and-shops",
  },
  upi: {
    title: "UPI ends 2025 with record 21.63 bn transactions worth Rs 27.97 trn",
    org: "Business Standard, 1 Jan 2026 (NPCI data)",
    url: "https://www.business-standard.com/amp/industry/news/upi-ends-2025-strong-note-record-transactions-december-126010100687_1.html",
  },
  veesion: {
    title: "Veesion raises EUR 38m for AI shoplifting detection",
    org: "The Next Web, 21 May 2025",
    url: "https://thenextweb.com/news/us-shoplifting-epidemic-veesion-french-ai-cameras-startup-funding",
  },
  patVerint: {
    title: "US9137500B1 - Point of sale integration with video analytics for fraud detection",
    org: "Google Patents (Verint Systems)",
    url: "https://patents.google.com/patent/US9137500",
  },
  patJfm: {
    title: "US11928942B2 - Systems and methods for theft prevention and detection",
    org: "Google Patents (JFM International)",
    url: "https://patents.google.com/patent/US11928942",
  },
  patEverseen: {
    title: "US12406503B2 - Detection of behaviours in a retail environment",
    org: "Google Patents (Everseen)",
    url: "https://patents.google.com/patent/US12406503",
  },
  cocoSsd: {
    title: "COCO-SSD object detection model for TensorFlow.js",
    org: "TensorFlow.js models (open source, Apache 2.0)",
    url: "https://www.npmjs.com/package/@tensorflow-models/coco-ssd",
  },
};

const BENCHMARKS = [
  { key: "usShrink", label: "US retail shrink rate, FY2022", value: "1.6% of sales", num: 1.6, src: "nrf2023" },
  { key: "usShrinkLoss", label: "US retail shrink, total loss 2022", value: "$112.1 billion", src: "nrf2023" },
  { key: "theftShare", label: "Share of shrink from theft (internal + external)", value: "65%", num: 65, src: "nrf2023" },
  { key: "shoplift93", label: "Rise in shoplifting incidents, 2023 vs 2019", value: "+93%", num: 93, src: "nrf2024" },
  { key: "indiaShrink09", label: "India retail shrinkage, Jul 2008 - Jun 2009 (highest of 41 countries)", value: "3.2% of sales", num: 3.2, src: "grtbIndia2009" },
  { key: "indiaShrink10", label: "India retail shrinkage, year to Jun 2010", value: "2.7% of sales (Rs 9,295.9 cr)", num: 2.7, src: "grtbIndia2010" },
  { key: "indiaCauses", label: "India shrink causes (2009): shoplifting / employee theft / admin errors", value: "45.2% / 23.3% / 22.6%", src: "grtbIndia2009" },
  { key: "globalCauses", label: "Global shrink causes (2007): customer / employee / admin / vendor", value: "42.0% / 35.2% / 16.5% / 6.3%", src: "grtbGlobal2007" },
  { key: "returnRate", label: "US return rate 2024 (in-store)", value: "13.21% overall (8.72% in-store)", num: 13.21, src: "appriss2024" },
  { key: "returnFraud", label: "Share of returns that were fraudulent, 2024", value: "15.14% ($103 billion)", num: 15.14, src: "appriss2024" },
  { key: "receiptPolicy", label: "Retailers that require receipts / proof of purchase", value: "67%", num: 67, src: "appriss2024" },
  { key: "realtimeReturns", label: "Retailers using real-time return-validation technology", value: "35%", num: 35, src: "appriss2024" },
  { key: "aishe", label: "Students enrolled in Indian higher education, 2021-22", value: "4.33 crore across 1,168 universities and 45,473 colleges", src: "aishe" },
  { key: "iitmStudents", label: "IIT Madras student strength (UG + PG + full-time PhD)", value: "9,981", num: 9981, src: "nirf" },
  { key: "iitmOutlets", label: "Shops and food outlets listed by the IIT Madras Dean of Students", value: "53", num: 53, src: "dost" },
  { key: "upi", label: "UPI transactions in December 2025", value: "21.63 bn worth Rs 27.97 trn", src: "upi" },
];

/* 53 outlets listed on https://dost.iitm.ac.in/shops (accessed 7 Nov 2026).
   inScope = sells physical stock or food, so it can leak revenue through theft, stock errors or refunds. */
const OUTLETS = [
  ["Fresh Market", "Grocery", "Shopping Complex", 1],
  ["Andavar Traders", "General store", "Shopping Complex", 1],
  ["Kamala Enterprises", "General store", "Shopping Complex", 1],
  ["TUCS (Ration)", "Grocery", "Shopping Complex", 1],
  ["Raja Stores", "General store", "Shopping Complex", 1],
  ["Varshini Fancy Wear", "Clothing", "Shopping Complex", 1],
  ["Sri Lakshmi Enterprises", "General store", "Shopping Complex", 1],
  ["Kumar Tailors", "Tailoring", "Shopping Complex", 0],
  ["Sarathy Footwear", "Footwear", "Shopping Complex", 1],
  ["Flour Mill", "Milling service", "Shopping Complex", 0],
  ["Raja Tea Stall", "Food & beverage", "Shopping Complex", 1],
  ["Photo Shot", "Photo studio", "Shopping Complex", 0],
  ["Malabar Hair Dressers", "Salon", "Shopping Complex", 0],
  ["7 Star Spa Parlour", "Spa", "Shopping Complex", 0],
  ["Automobile Workshop", "Vehicle repair", "Shopping Complex", 0],
  ["Adyar Coolbiz", "Food & beverage", "New SFC (near Sharavathi)", 1],
  ["Srinivasa Departmental Stores", "General store", "New SFC (near Sharavathi)", 1],
  ["Ironing Shop", "Laundry", "New SFC (near Sharavathi)", 0],
  ["Premass Srivari Browsing Centre", "Printing / browsing", "New SFC (near Sharavathi)", 1],
  ["TI Cycles of India", "Cycle repair", "New SFC (near Sharavathi)", 0],
  ["Sri Vari Browsing Centre", "Printing / photocopy", "Narmada Hostel basement", 1],
  ["7 Star Beauty Salon", "Salon", "Narmada Hostel basement", 0],
  ["Laundry Bus", "Laundry", "Narmada Hostel basement", 0],
  ["Sunshine Communications", "Communications", "Narmada Hostel basement", 0],
  ["Prime Mart", "Stationery", "Near CCW Office", 1],
  ["Speed Buy Cycle", "Cycle repair", "Near Sangam Ground", 0],
  ["Sri Krishna Service Centre", "Cycle repair", "Bonn Avenue", 0],
  ["Cycle World", "Cycle repair", "Near Tapti Hostel", 0],
  ["Cafe Coffee Day", "Cafe", "Near DoMS", 1],
  ["Staff Canteen (Vajram Catering)", "Canteen", "FFT ground floor", 1],
  ["Usha Cafe", "Cafe / snacks", "NSFC Shop 1", 1],
  ["Juice World littlebites", "Juice / snacks", "NSFC Shop 2", 1],
  ["Grubhub Food Truck", "Food truck", "Near NSFC, Sabarmati", 1],
  ["Rotormans", "Food truck", "Behind TGH", 1],
  ["Golden Spoon", "Food truck", "Behind TGH", 1],
  ["Zaitoon Restaurant & Grill", "Restaurant", "Quark", 1],
  ["Ramu Alias Trivetti", "Tea & snacks", "Shopping Complex", 1],
  ["Maaran Snacks", "Snacks", "ICICI Bank Hangout", 1],
  ["Cream Stone", "Desserts", "ICICI Bank Hangout", 1],
  ["Dollar Cafe", "Cafe", "HDFC Bank Hangout", 1],
  ["Magglicious Foods", "Food outlet", "HDFC Bank Hangout", 1],
  ["KR Bakers & Tender Coconut", "Bakery / beverages", "Opp. OAT student gate", 1],
  ["Sri Bhakya Fast Food", "Fast food", "FFT first floor", 1],
  ["Wow Momos", "Fast food", "FFT first floor", 1],
  ["RK Foods", "Food outlet", "FFT first floor", 1],
  ["Bachelor Restaurant", "Restaurant", "FFT first floor", 1],
  ["Sri Bhakya Juice Stall", "Juice", "FFT first floor", 1],
  ["Indian Coffee House", "Cafe", "FFT first floor", 1],
  ["Waah Hyderabadi", "Restaurant", "Himalaya Food Court", 1],
  ["Vineyard", "Restaurant", "Himalaya Food Court", 1],
  ["Hotel Ananda", "Restaurant", "Himalaya Food Court", 1],
  ["Chaai Waale", "Tea", "Himalaya Food Court", 1],
  ["Deli Pizzeria", "Pizza", "Himalaya Food Court", 1],
].map(([name, type, location, inScope]) => ({ name, type, location, inScope: !!inScope }));

/* Demo shop catalogue: a typical campus general + stationery store.
   Prices are indicative MRPs for the demo, not scraped. perishable = no returns after 24 h. */
const CATALOGUE = [
  { sku: "SN001", name: "Parle-G biscuits 250 g", cat: "Snacks", price: 25, perishable: true, stock: 80, reorder: 20 },
  { sku: "SN002", name: "Lay's chips 52 g", cat: "Snacks", price: 20, perishable: true, stock: 120, reorder: 30 },
  { sku: "SN003", name: "Kurkure 75 g", cat: "Snacks", price: 20, perishable: true, stock: 90, reorder: 25 },
  { sku: "SN004", name: "Dairy Milk 50 g", cat: "Snacks", price: 50, perishable: true, stock: 60, reorder: 15 },
  { sku: "SN005", name: "Maggi noodles 70 g", cat: "Snacks", price: 15, perishable: true, stock: 150, reorder: 40 },
  { sku: "SN006", name: "Instant cup noodles", cat: "Snacks", price: 50, perishable: true, stock: 40, reorder: 10 },
  { sku: "BV001", name: "Mineral water 1 L", cat: "Beverages", price: 20, perishable: true, stock: 200, reorder: 50 },
  { sku: "BV002", name: "Soft drink 600 ml", cat: "Beverages", price: 40, perishable: true, stock: 90, reorder: 24 },
  { sku: "BV003", name: "Energy drink 250 ml", cat: "Beverages", price: 125, perishable: true, stock: 36, reorder: 12 },
  { sku: "BV004", name: "Cold coffee 180 ml", cat: "Beverages", price: 40, perishable: true, stock: 48, reorder: 12 },
  { sku: "ST001", name: "A4 notebook 200 pages", cat: "Stationery", price: 90, perishable: false, stock: 70, reorder: 20 },
  { sku: "ST002", name: "Ball pen (pack of 5)", cat: "Stationery", price: 50, perishable: false, stock: 100, reorder: 25 },
  { sku: "ST003", name: "Gel pen", cat: "Stationery", price: 20, perishable: false, stock: 150, reorder: 40 },
  { sku: "ST004", name: "Scientific calculator", cat: "Stationery", price: 1150, perishable: false, stock: 12, reorder: 4 },
  { sku: "ST005", name: "Lab record book", cat: "Stationery", price: 120, perishable: false, stock: 40, reorder: 10 },
  { sku: "ST006", name: "Engineering drawing kit", cat: "Stationery", price: 350, perishable: false, stock: 15, reorder: 5 },
  { sku: "ST007", name: "Sticky notes pad", cat: "Stationery", price: 60, perishable: false, stock: 50, reorder: 15 },
  { sku: "EL001", name: "USB-C charging cable", cat: "Electronics", price: 299, perishable: false, stock: 25, reorder: 8 },
  { sku: "EL002", name: "Earphones (wired)", cat: "Electronics", price: 399, perishable: false, stock: 20, reorder: 6 },
  { sku: "EL003", name: "32 GB pen drive", cat: "Electronics", price: 450, perishable: false, stock: 18, reorder: 6 },
  { sku: "EL004", name: "AA batteries (pack of 4)", cat: "Electronics", price: 120, perishable: false, stock: 30, reorder: 10 },
  { sku: "PC001", name: "Toothpaste 150 g", cat: "Personal care", price: 110, perishable: false, stock: 35, reorder: 10 },
  { sku: "PC002", name: "Bathing soap", cat: "Personal care", price: 45, perishable: false, stock: 60, reorder: 15 },
  { sku: "PC003", name: "Shampoo 180 ml", cat: "Personal care", price: 180, perishable: false, stock: 25, reorder: 8 },
  { sku: "PC004", name: "Hand sanitiser 100 ml", cat: "Personal care", price: 55, perishable: false, stock: 40, reorder: 10 },
  { sku: "PR001", name: "Printout B/W (per page)", cat: "Print", price: 2, perishable: false, stock: 5000, reorder: 1000 },
  { sku: "PR002", name: "Printout colour (per page)", cat: "Print", price: 10, perishable: false, stock: 1500, reorder: 300 },
  { sku: "PR003", name: "Spiral binding", cat: "Print", price: 40, perishable: false, stock: 100, reorder: 25 },
];

/* Refund validation rules (each adds to a 0-100 risk score). */
const RULES = {
  returnWindowHours: 72,
  perishableWindowHours: 24,
  maxRefundsPerCustomer7d: 2,
  highValueThreshold: 500,
  staffSelfRefundBlocked: true,
};
