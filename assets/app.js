/* LeakGuard prototype – single-page app, no build step, data kept in localStorage. */
(function () {
  "use strict";

  const KEY = "leakguard.v1";
  const STAFF = [
    { id: "owner", name: "Owner (Mr. Kumar)", role: "owner" },
    { id: "ravi", name: "Cashier Ravi", role: "cashier" },
    { id: "meena", name: "Cashier Meena", role: "cashier" },
  ];
  const DAY = 86400000;
  const HOUR = 3600000;

  /* ---------- helpers ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
  const inrShort = (n) => {
    if (Math.abs(n) >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " cr";
    if (Math.abs(n) >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " lakh";
    return inr(n);
  };
  const pct = (n, d = 1) => (isFinite(n) ? n.toFixed(d) : "0") + "%";
  const fmtDT = (t) => new Date(t).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const fmtD = (t) => new Date(t).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  const staffName = (id) => (STAFF.find((s) => s.id === id) || { name: id }).name;
  const prodBySku = (sku) => state.products.find((p) => p.sku === sku);
  const srcLink = (k) => {
    const s = SOURCES[k];
    return s ? `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.org)}</a>` : "";
  };

  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  function openModal(html) {
    $("#modalBody").innerHTML = html;
    $("#modal").hidden = false;
  }
  function closeModal() { $("#modal").hidden = true; }

  /* seeded random so the demo history is the same for everyone */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- state ---------- */
  let state;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage off: keep in memory */ } }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return seed();
  }

  function seed() {
    const r = rng(41);
    const now = Date.now();
    const products = CATALOGUE.map((p) => ({ ...p }));
    const s = { products, bills: [], refunds: [], audits: [], receipts: [], alerts: [], seq: { bill: 1000, refund: 100, alert: 1, audit: 1 }, staff: "owner" };
    const phones = ["98400", "98410", "99620", "90030", "73580", "88070", "95000", "97890"].flatMap((a) =>
      Array.from({ length: 6 }, (_, i) => a + String(10000 + Math.floor(r() * 89999)).slice(0, 5)));
    const weights = products.map((p) => (p.cat === "Snacks" || p.cat === "Beverages" ? 6 : p.cat === "Print" ? 4 : p.price > 300 ? 0.4 : 2));
    const wsum = weights.reduce((a, b) => a + b, 0);
    const pick = () => { let x = r() * wsum; for (let i = 0; i < products.length; i++) { x -= weights[i]; if (x <= 0) return products[i]; } return products[0]; };

    for (let d = 29; d >= 0; d--) {
      const dayStart = new Date(now - d * DAY); dayStart.setHours(8, 0, 0, 0);
      const n = 34 + Math.floor(r() * 22);
      for (let k = 0; k < n; k++) {
        const t = dayStart.getTime() + Math.floor(r() * 14 * HOUR);
        if (t > now - 5 * 60000) continue;
        const lines = [];
        const cnt = 1 + Math.floor(r() * 3);
        for (let j = 0; j < cnt; j++) {
          const p = pick();
          const qty = p.sku === "PR001" ? 5 + Math.floor(r() * 40) : 1 + Math.floor(r() * 2);
          const ex = lines.find((l) => l.sku === p.sku);
          if (ex) ex.qty += qty; else lines.push({ sku: p.sku, name: p.name, price: p.price, qty });
        }
        const total = lines.reduce((a, l) => a + l.price * l.qty, 0);
        s.bills.push({ id: "B" + ++s.seq.bill, t, lines, total, mode: r() < 0.72 ? "UPI" : "Cash", phone: r() < 0.6 ? phones[Math.floor(r() * phones.length)] : "", staff: r() < 0.5 ? "ravi" : "meena" });
      }
    }
    s.bills.sort((a, b) => a.t - b.t);

    // past refunds, a few of them suspicious
    const refundable = s.bills.filter((b) => b.phone);
    for (let i = 0; i < 14; i++) {
      const b = refundable[Math.floor(r() * refundable.length)];
      const l = b.lines[0];
      const late = i % 3 === 1;
      const t = b.t + (late ? 5 * DAY : Math.floor(r() * 3 * HOUR));
      if (t > now) continue;
      const risk = late ? 55 + Math.floor(r() * 30) : Math.floor(r() * 25);
      const decision = risk >= 60 ? "Rejected" : risk >= 30 ? "Manager approved" : "Approved";
      s.refunds.push({ id: "R" + ++s.seq.refund, t, billId: b.id, sku: l.sku, name: l.name, qty: 1, amount: l.price, reason: late ? "Changed mind" : "Damaged / defective", staff: r() < 0.5 ? "ravi" : "meena", phone: b.phone, risk, decision });
    }
    s.refunds.sort((a, b) => a.t - b.t);

    // past stock audits with realistic shrink on snack / small items
    for (const back of [21, 14, 7]) {
      const t = now - back * DAY;
      const lines = products.filter((p) => p.cat !== "Print").map((p) => {
        const sys = Math.max(5, Math.round(p.stock * (0.8 + r() * 0.4)));
        const small = ["Snacks", "Beverages", "Stationery", "Personal care"].includes(p.cat) && p.price <= 120;
        const loss = small && r() < 0.45 ? 1 + Math.floor(r() * 4) : p.cat === "Electronics" && r() < 0.25 ? 1 : 0;
        return { sku: p.sku, name: p.name, price: p.price, system: sys, counted: sys - loss };
      });
      addAudit(s, t, lines, "owner", true);
    }

    // purchase receipts (goods inward) with one short delivery
    s.receipts.push({ t: now - 10 * DAY, sku: "BV001", name: "Mineral water 1 L", invoiced: 120, received: 120, supplier: "Aqua Distributors", staff: "owner" });
    s.receipts.push({ t: now - 6 * DAY, sku: "SN002", name: "Lay's chips 52 g", invoiced: 96, received: 84, supplier: "City FMCG Agencies", staff: "ravi" });
    alertPush(s, "stock", "Short delivery: Lay's chips 52 g", "Invoice says 96 units but only 84 were received from City FMCG Agencies. Shortfall worth " + inr(12 * 20) + ".", now - 6 * DAY, 240);

    // past camera alerts
    const camMsgs = [
      ["Possible walk-out without billing", "Person left through the exit zone with no bill in the last 60 s.", 3],
      ["Shelf dwell near electronics", "Person stayed 2 min 10 s at the electronics shelf, no item billed.", 2],
      ["Possible walk-out without billing", "Person left through the exit zone with no bill in the last 60 s.", 1],
    ];
    camMsgs.forEach(([title, msg, back]) => alertPush(s, "theft", title, msg, now - back * DAY - 3 * HOUR, 0));
    s.alerts.forEach((a, i) => { if (i < 2) a.resolved = true; });
    return s;
  }

  function addAudit(s, t, lines, staff, silent) {
    const flagged = [];
    let lossValue = 0, gainValue = 0;
    lines.forEach((l) => {
      l.diff = l.counted - l.system;
      l.value = l.diff * l.price;
      if (l.diff < 0) lossValue += -l.value; else gainValue += l.value;
      l.flag = l.diff < 0 && (-l.diff >= 3 || -l.diff / Math.max(1, l.system) >= 0.03 || -l.value >= 300);
      if (l.flag) flagged.push(l);
    });
    const audit = { id: "A" + s.seq.audit++, t, staff, lines, lossValue, gainValue, flagged: flagged.length };
    s.audits.push(audit);
    if (flagged.length) {
      const names = flagged.slice(0, 3).map((l) => `${l.name} (${l.diff})`).join(", ");
      alertPush(s, "stock", `Stock audit ${audit.id}: ${flagged.length} item(s) missing`, `Biggest gaps: ${names}${flagged.length > 3 ? " and others" : ""}. Missing stock worth ${inr(lossValue)}.`, t, lossValue);
    }
    if (!silent) save();
    return audit;
  }

  function alertPush(s, kind, title, msg, t, value, img) {
    s.alerts.push({ id: s.seq.alert++, kind, title, msg, t: t || Date.now(), value: value || 0, img: img || "", resolved: false });
  }

  /* ---------- router ---------- */
  const views = { overview, billing, inventory, returns, camera, estimator, campus, sources };
  function route() {
    const name = (location.hash || "#overview").slice(1);
    const fn = views[name] || overview;
    $$("#tabs a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + (views[name] ? name : "overview")));
    if (name !== "camera") stopCamera();
    $("#view").innerHTML = "";
    fn($("#view"));
    window.scrollTo(0, 0);
  }

  /* ---------- metrics ---------- */
  function metrics(days = 30) {
    const since = Date.now() - days * DAY;
    const bills = state.bills.filter((b) => b.t >= since);
    const sales = bills.reduce((a, b) => a + b.total, 0);
    const audits = state.audits.filter((a) => a.t >= since);
    const stockLoss = audits.reduce((a, x) => a + x.lossValue, 0);
    const refunds = state.refunds.filter((x) => x.t >= since);
    const blocked = refunds.filter((x) => x.decision === "Rejected").reduce((a, x) => a + x.amount, 0);
    const refunded = refunds.filter((x) => x.decision !== "Rejected").reduce((a, x) => a + x.amount, 0);
    const shortDel = state.receipts.filter((x) => x.t >= since).reduce((a, x) => a + Math.max(0, x.invoiced - x.received) * (prodBySku(x.sku) || { price: 0 }).price, 0);
    const theftAlerts = state.alerts.filter((a) => a.kind === "theft" && a.t >= since);
    const open = state.alerts.filter((a) => !a.resolved);
    return { bills, sales, stockLoss, blocked, refunded, refunds, shortDel, theftAlerts, open, audits };
  }

  /* ---------- views ---------- */
  function overview(el) {
    const m = metrics(30);
    const leakPct = m.sales ? (m.stockLoss / m.sales) * 100 : 0;
    const days = [];
    for (let d = 13; d >= 0; d--) {
      const start = new Date(Date.now() - d * DAY); start.setHours(0, 0, 0, 0);
      const end = start.getTime() + DAY;
      const v = state.bills.filter((b) => b.t >= start.getTime() && b.t < end).reduce((a, b) => a + b.total, 0);
      days.push({ label: start.getDate(), v, date: start });
    }
    const maxDay = Math.max(1, ...days.map((d) => d.v));
    const leaks = [
      { label: "Stock missing in audits", v: m.stockLoss, cls: "bad" },
      { label: "Short deliveries from suppliers", v: m.shortDel, cls: "warn" },
      { label: "Refunds paid out", v: m.refunded, cls: "" },
      { label: "Suspicious refunds blocked (saved)", v: m.blocked, cls: "" },
    ];
    const maxLeak = Math.max(1, ...leaks.map((l) => l.v));
    const low = state.products.filter((p) => p.stock <= p.reorder);

    el.innerHTML = `
      <div class="pagehead">
        <div><h1>Overview</h1><p>Last 30 days for this shop. Every rupee that leaves the shop without a bill, through a refund or through a stock gap shows up here.</p></div>
      </div>
      <div class="grid kpis">
        <div class="card kpi"><div class="label">Sales (30 days)</div><div class="value">${inrShort(m.sales)}</div><div class="sub">${m.bills.length} bills</div></div>
        <div class="card kpi bad"><div class="label">Stock found missing</div><div class="value">${inr(m.stockLoss)}</div><div class="sub">${pct(leakPct, 2)} of sales · ${m.audits.length} audits</div></div>
        <div class="card kpi ok"><div class="label">Refund fraud blocked</div><div class="value">${inr(m.blocked)}</div><div class="sub">${m.refunds.filter((r) => r.decision === "Rejected").length} of ${m.refunds.length} refund requests</div></div>
        <div class="card kpi warn"><div class="label">Camera alerts</div><div class="value">${m.theftAlerts.length}</div><div class="sub">walk-outs and long shelf dwell</div></div>
        <div class="card kpi ${m.open.length ? "bad" : "ok"}"><div class="label">Open alerts</div><div class="value">${m.open.length}</div><div class="sub">need the owner's review</div></div>
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card">
          <h2>Daily sales, last 14 days</h2>
          <div class="bars">${days.map((d) => `<div class="b" style="height:${(d.v / maxDay) * 100}%" title="${fmtD(d.date)}: ${inr(d.v)}"></div>`).join("")}</div>
          <div class="barlabels">${days.map((d) => `<span>${d.label}</span>`).join("")}</div>
        </div>
        <div class="card">
          <h2>Where money is leaking</h2>
          ${leaks.map((l) => `<div class="hbar"><div class="t"><span>${l.label}</span><b>${inr(l.v)}</b></div><div class="track"><div class="fill ${l.cls}" style="width:${(l.v / maxLeak) * 100}%"></div></div></div>`).join("")}
          <p class="src" style="margin-top:10px">For comparison, Indian retailers lost 2.7% to 3.2% of sales to shrinkage in the last Global Retail Theft Barometer surveys (${srcLink("grtbIndia2009")}).</p>
        </div>
        <div class="card">
          <div class="row" style="justify-content:space-between"><h2>Alerts</h2><span class="muted" style="font-size:.8rem">${m.open.length} open</span></div>
          <div id="alertList">${alertListHTML(12)}</div>
        </div>
        <div class="card">
          <h2>Low stock (at or below reorder level)</h2>
          ${low.length ? `<table><tr><th>Item</th><th class="num">Stock</th><th class="num">Reorder at</th></tr>${low.map((p) => `<tr><td>${esc(p.name)}</td><td class="num">${p.stock}</td><td class="num">${p.reorder}</td></tr>`).join("")}</table>` : `<p class="muted">Nothing is low right now.</p>`}
          <h2 style="margin-top:18px">How LeakGuard covers the three leak points</h2>
          <table>
            <tr><td><span class="pill bad">Shoplifting</span></td><td>Camera watch flags walk-outs with no matching bill.</td></tr>
            <tr><td><span class="pill warn">Stock errors</span></td><td>Weekly count vs billing records, and invoice vs delivery checks.</td></tr>
            <tr><td><span class="pill neutral">Refund fraud</span></td><td>Every refund must match a real bill and pass 7 rules.</td></tr>
          </table>
        </div>
      </div>`;
    bindAlertButtons(el);
  }

  function alertListHTML(limit) {
    const list = state.alerts.slice().sort((a, b) => (a.resolved - b.resolved) || b.t - a.t).slice(0, limit);
    if (!list.length) return `<p class="muted">No alerts yet.</p>`;
    const icon = { theft: "!", stock: "#", refund: "₹" };
    return list.map((a) => `
      <div class="alert" style="${a.resolved ? "opacity:.55" : ""}">
        <div class="ic ${a.kind}">${icon[a.kind] || "!"}</div>
        <div class="body"><b>${esc(a.title)}</b>${esc(a.msg)}<br><small>${fmtDT(a.t)}${a.resolved ? " · resolved" : ""}</small></div>
        ${a.img ? `<img src="${a.img}" alt="Camera snapshot">` : ""}
        ${a.resolved ? "" : `<div><button class="small secondary" data-resolve="${a.id}">Resolve</button></div>`}
      </div>`).join("");
  }
  function bindAlertButtons(el) {
    $$("[data-resolve]", el).forEach((b) => b.addEventListener("click", () => {
      const a = state.alerts.find((x) => x.id === +b.dataset.resolve);
      if (a) { a.resolved = true; save(); route(); }
    }));
  }

  /* Billing */
  let cart = [];
  function billing(el) {
    const cats = ["All", ...new Set(state.products.map((p) => p.cat))];
    el.innerHTML = `
      <div class="pagehead"><div><h1>Billing</h1><p>Every sale gets a bill ID. Refunds and camera alerts are checked against these bills, so billing is the backbone of the system.</p></div></div>
      <div class="grid g2">
        <div class="card">
          <div class="row" style="margin-bottom:10px">
            <input id="psearch" placeholder="Search item or SKU" style="flex:1 1 180px">
            <select id="pcat">${cats.map((c) => `<option>${c}</option>`).join("")}</select>
          </div>
          <div class="products" id="plist"></div>
        </div>
        <div class="card">
          <h2>Current bill</h2>
          <div id="cart"></div>
          <div class="total" id="ctotal"></div>
          <div class="grid g2" style="gap:10px">
            <label class="field">Customer phone (optional, for refunds)<input id="cphone" inputmode="numeric" maxlength="10" placeholder="10-digit mobile"></label>
            <label class="field">Payment<select id="cmode"><option>UPI</option><option>Cash</option><option>Card</option></select></label>
          </div>
          <div class="row"><button id="cpay">Generate bill</button><button class="secondary" id="cclear">Clear</button></div>
        </div>
        <div class="card span2">
          <h2>Recent bills</h2>
          <div class="tablewrap"><table id="recent"></table></div>
        </div>
      </div>`;
    const drawProducts = () => {
      const q = $("#psearch").value.toLowerCase();
      const c = $("#pcat").value;
      $("#plist").innerHTML = state.products
        .filter((p) => (c === "All" || p.cat === c) && (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)))
        .map((p) => `<button class="prod" data-sku="${p.sku}" ${p.stock <= 0 ? "disabled" : ""}><b>${esc(p.name)}</b><span>${inr(p.price)} · ${p.stock} in stock</span></button>`).join("");
      $$("#plist .prod").forEach((b) => b.addEventListener("click", () => addToCart(b.dataset.sku)));
    };
    const drawCart = () => {
      if (!cart.length) { $("#cart").innerHTML = `<p class="muted">Tap items on the left to add them.</p>`; }
      else {
        $("#cart").innerHTML = cart.map((l, i) => `
          <div class="cartline"><span>${esc(l.name)}</span><input type="number" min="1" value="${l.qty}" data-q="${i}" aria-label="Quantity"><span class="lt">${inr(l.price * l.qty)}</span><button class="small secondary" data-rm="${i}" aria-label="Remove">✕</button></div>`).join("");
        $$("[data-q]").forEach((inp) => inp.addEventListener("change", () => {
          const l = cart[+inp.dataset.q];
          const p = prodBySku(l.sku);
          l.qty = Math.max(1, Math.min(p.stock, parseInt(inp.value, 10) || 1));
          drawCart();
        }));
        $$("[data-rm]").forEach((b) => b.addEventListener("click", () => { cart.splice(+b.dataset.rm, 1); drawCart(); }));
      }
      $("#ctotal").textContent = "Total " + inr(cart.reduce((a, l) => a + l.price * l.qty, 0));
      $("#cpay").disabled = !cart.length;
    };
    const addToCart = (sku) => {
      const p = prodBySku(sku);
      const ex = cart.find((l) => l.sku === sku);
      if (ex) { if (ex.qty < p.stock) ex.qty++; } else cart.push({ sku, name: p.name, price: p.price, qty: 1 });
      drawCart();
    };
    const drawRecent = () => {
      const list = state.bills.slice(-12).reverse();
      $("#recent").innerHTML = `<tr><th>Bill</th><th>Time</th><th>Items</th><th>Staff</th><th>Mode</th><th class="num">Total</th></tr>` +
        list.map((b) => `<tr><td><a href="#" data-bill="${b.id}">${b.id}</a></td><td>${fmtDT(b.t)}</td><td>${esc(b.lines.map((l) => l.qty + "× " + l.name).join(", "))}</td><td>${esc(staffName(b.staff))}</td><td>${b.mode}</td><td class="num">${inr(b.total)}</td></tr>`).join("");
      $$("[data-bill]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); showReceipt(state.bills.find((b) => b.id === a.dataset.bill)); }));
    };
    $("#psearch").addEventListener("input", drawProducts);
    $("#pcat").addEventListener("change", drawProducts);
    $("#cclear").addEventListener("click", () => { cart = []; drawCart(); });
    $("#cpay").addEventListener("click", () => {
      const phone = $("#cphone").value.trim();
      if (phone && !/^\d{10}$/.test(phone)) { toast("Phone number must be 10 digits, or leave it empty."); return; }
      const bill = { id: "B" + ++state.seq.bill, t: Date.now(), lines: cart.map((l) => ({ ...l })), total: cart.reduce((a, l) => a + l.price * l.qty, 0), mode: $("#cmode").value, phone, staff: state.staff };
      bill.lines.forEach((l) => { prodBySku(l.sku).stock -= l.qty; });
      state.bills.push(bill);
      lastBillAt = bill.t;
      save();
      cart = [];
      $("#cphone").value = "";
      drawProducts(); drawCart(); drawRecent();
      showReceipt(bill);
    });
    drawProducts(); drawCart(); drawRecent();
  }
  function showReceipt(b) {
    openModal(`<div class="receipt">
      <div style="text-align:center"><b>Campus General &amp; Stationery Store</b><br>Bill ${b.id}<br>${fmtDT(b.t)}</div><hr>
      ${b.lines.map((l) => `<div class="line"><span>${l.qty} × ${esc(l.name)}</span><span>${inr(l.qty * l.price)}</span></div>`).join("")}
      <hr><div class="line"><b>TOTAL</b><b>${inr(b.total)}</b></div>
      <div class="line"><span>Paid by</span><span>${b.mode}</span></div>
      <div class="line"><span>Cashier</span><span>${esc(staffName(b.staff))}</span></div>
      ${b.phone ? `<div class="line"><span>Customer</span><span>xxxxxx${b.phone.slice(-4)}</span></div>` : ""}
      <hr><div style="text-align:center;font-size:.75rem">Returns need this bill ID. Non-food items within ${RULES.returnWindowHours} h, food within ${RULES.perishableWindowHours} h.</div>
    </div><div class="row" style="margin-top:12px"><button onclick="window.print()">Print</button></div>`);
  }

  /* Inventory */
  function inventory(el) {
    const value = state.products.reduce((a, p) => a + p.stock * p.price, 0);
    el.innerHTML = `
      <div class="pagehead"><div><h1>Inventory and stock audits</h1><p>Stock goes down automatically with each bill. A quick physical count then shows exactly which items are going missing and how much they are worth.</p></div>
        <div class="row"><button id="startAudit">Start stock count</button><button class="secondary" id="receive">Receive delivery</button></div></div>
      <div class="grid kpis">
        <div class="card kpi"><div class="label">Items tracked</div><div class="value">${state.products.length}</div></div>
        <div class="card kpi"><div class="label">Stock value</div><div class="value">${inrShort(value)}</div></div>
        <div class="card kpi warn"><div class="label">Below reorder level</div><div class="value">${state.products.filter((p) => p.stock <= p.reorder).length}</div></div>
        <div class="card kpi bad"><div class="label">Missing in last audit</div><div class="value">${state.audits.length ? inr(state.audits[state.audits.length - 1].lossValue) : "–"}</div></div>
      </div>
      <div id="auditPanel"></div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card span2">
          <h2>Stock on hand</h2>
          <div class="tablewrap"><table>
            <tr><th>SKU</th><th>Item</th><th>Category</th><th class="num">Price</th><th class="num">In stock</th><th class="num">Reorder at</th><th>Status</th></tr>
            ${state.products.map((p) => `<tr><td>${p.sku}</td><td>${esc(p.name)}</td><td>${p.cat}</td><td class="num">${inr(p.price)}</td><td class="num">${p.stock}</td><td class="num">${p.reorder}</td><td>${p.stock <= p.reorder ? '<span class="pill warn">Reorder</span>' : '<span class="pill ok">OK</span>'}</td></tr>`).join("")}
          </table></div>
        </div>
        <div class="card">
          <h2>Audit history</h2>
          <table><tr><th>Audit</th><th>Date</th><th class="num">Items flagged</th><th class="num">Missing value</th></tr>
          ${state.audits.slice().reverse().map((a) => `<tr><td><a href="#" data-audit="${a.id}">${a.id}</a></td><td>${fmtD(a.t)}</td><td class="num">${a.flagged}</td><td class="num">${inr(a.lossValue)}</td></tr>`).join("")}</table>
        </div>
        <div class="card">
          <h2>Deliveries received</h2>
          <table><tr><th>Date</th><th>Item</th><th class="num">Invoiced</th><th class="num">Received</th></tr>
          ${state.receipts.slice().reverse().map((x) => `<tr class="${x.received < x.invoiced ? "flag" : ""}"><td>${fmtD(x.t)}</td><td>${esc(x.name)}<br><small>${esc(x.supplier)}</small></td><td class="num">${x.invoiced}</td><td class="num">${x.received}</td></tr>`).join("")}</table>
        </div>
      </div>`;
    $$("[data-audit]", el).forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); showAudit(state.audits.find((x) => x.id === a.dataset.audit)); }));
    $("#startAudit").addEventListener("click", () => {
      const panel = $("#auditPanel");
      panel.innerHTML = `<div class="card" style="margin-top:16px">
        <h2>Stock count</h2>
        <p class="muted">Count what is physically on the shelf and type it in. The system count comes from billing. For the demo, use "Simulate a count" to fill in realistic numbers with a few items missing.</p>
        <div class="row" style="margin-bottom:10px"><button class="secondary" id="simCount">Simulate a count</button></div>
        <div class="tablewrap"><table><tr><th>Item</th><th class="num">System</th><th class="num">Counted</th></tr>
        ${state.products.filter((p) => p.cat !== "Print").map((p) => `<tr><td>${esc(p.name)}</td><td class="num">${p.stock}</td><td class="num"><input type="number" min="0" value="${p.stock}" data-count="${p.sku}" style="width:80px;text-align:right"></td></tr>`).join("")}
        </table></div>
        <div class="row" style="margin-top:12px"><button id="submitAudit">Submit count</button><button class="secondary" id="cancelAudit">Cancel</button></div></div>`;
      $("#simCount").addEventListener("click", () => {
        const r = rng(Date.now() & 0xffff);
        $$("[data-count]").forEach((inp) => {
          const p = prodBySku(inp.dataset.count);
          const small = p.price <= 120 && p.cat !== "Electronics";
          inp.value = Math.max(0, p.stock - (small && r() < 0.35 ? 1 + Math.floor(r() * 4) : 0));
        });
      });
      $("#cancelAudit").addEventListener("click", () => { panel.innerHTML = ""; });
      $("#submitAudit").addEventListener("click", () => {
        const lines = $$("[data-count]").map((inp) => {
          const p = prodBySku(inp.dataset.count);
          return { sku: p.sku, name: p.name, price: p.price, system: p.stock, counted: Math.max(0, parseInt(inp.value, 10) || 0) };
        });
        const audit = addAudit(state, Date.now(), lines, state.staff, false);
        lines.forEach((l) => { prodBySku(l.sku).stock = l.counted; });
        save();
        route();
        showAudit(audit);
      });
      panel.scrollIntoView({ behavior: "smooth" });
    });
    $("#receive").addEventListener("click", () => {
      openModal(`<h2>Receive delivery</h2>
        <p class="muted">Check what actually arrived against the supplier's invoice before it goes on the shelf.</p>
        <label class="field">Item<select id="rsku">${state.products.map((p) => `<option value="${p.sku}">${esc(p.name)}</option>`).join("")}</select></label>
        <label class="field">Supplier<input id="rsup" value="City FMCG Agencies"></label>
        <div class="grid g2" style="gap:10px;grid-template-columns:1fr 1fr">
          <label class="field">Qty on invoice<input id="rinv" type="number" min="1" value="48"></label>
          <label class="field">Qty received<input id="rrec" type="number" min="0" value="48"></label>
        </div>
        <button id="rsave">Add to stock</button>`);
      $("#rsave").addEventListener("click", () => {
        const p = prodBySku($("#rsku").value);
        const inv = parseInt($("#rinv").value, 10) || 0, rec = parseInt($("#rrec").value, 10) || 0;
        state.receipts.push({ t: Date.now(), sku: p.sku, name: p.name, invoiced: inv, received: rec, supplier: $("#rsup").value, staff: state.staff });
        p.stock += rec;
        if (rec < inv) alertPush(state, "stock", "Short delivery: " + p.name, `Invoice says ${inv} units but only ${rec} were received from ${$("#rsup").value}. Shortfall worth ${inr((inv - rec) * p.price)}.`, Date.now(), (inv - rec) * p.price);
        save(); closeModal(); route();
        toast(rec < inv ? "Short delivery recorded and flagged." : "Stock added.");
      });
    });
  }
  function showAudit(a) {
    const rows = a.lines.filter((l) => l.diff !== 0).sort((x, y) => x.value - y.value);
    openModal(`<h2>Audit ${a.id} · ${fmtD(a.t)}</h2>
      <p>Missing stock worth <b>${inr(a.lossValue)}</b>${a.gainValue ? `, extra stock worth ${inr(a.gainValue)} (usually a billing mistake)` : ""}. ${a.flagged} item(s) crossed the alert threshold.</p>
      ${rows.length ? `<table><tr><th>Item</th><th class="num">Diff</th><th class="num">Value</th></tr>${rows.map((l) => `<tr class="${l.flag ? "flag" : ""}"><td>${esc(l.name)}</td><td class="num">${l.diff > 0 ? "+" : ""}${l.diff}</td><td class="num">${inr(l.value)}</td></tr>`).join("")}</table>` : "<p>No differences. Shelf matches the books.</p>"}
      <p class="src" style="margin-top:10px">An item is flagged when 3 or more units, 3% of its stock or ₹300 or more is missing.</p>`);
  }

  /* Returns */
  function returns(el) {
    el.innerHTML = `
      <div class="pagehead"><div><h1>Returns and refunds</h1><p>No refund without a real bill. Each request is scored against ${7} rules before money goes back. Appriss Retail found 15.14% of US returns in 2024 were fraudulent (${srcLink("appriss2024")}).</p></div></div>
      <div class="grid g2">
        <div class="card">
          <h2>New refund request</h2>
          <label class="field">Bill ID<input id="rbill" placeholder="e.g. ${state.bills[state.bills.length - 1].id}"></label>
          <div class="row" style="margin:-4px 0 10px"><button class="small secondary" id="rlatest">Use latest bill</button><button class="small secondary" id="rold">Use an old bill</button></div>
          <label class="field">Item<select id="ritem"><option value="">Enter a bill ID first</option></select></label>
          <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">
            <label class="field">Quantity<input id="rqty" type="number" min="1" value="1"></label>
            <label class="field">Refund as<select id="rmode"><option>Same as payment</option><option>Cash</option><option>Store credit</option></select></label>
          </div>
          <label class="field">Reason<select id="rreason"><option>Damaged / defective</option><option>Wrong item</option><option>Changed mind</option><option>Expired</option></select></label>
          <button id="rcheck">Check request</button>
          <div id="rresult"></div>
        </div>
        <div class="card">
          <h2>The 7 checks</h2>
          <div class="check"><span class="m">1</span><span><b>Bill exists.</b> No bill, no refund. Stops refunds for stolen goods.</span></div>
          <div class="check"><span class="m">2</span><span><b>Item and quantity match the bill</b>, minus anything already returned.</span></div>
          <div class="check"><span class="m">3</span><span><b>Inside the return window:</b> ${RULES.perishableWindowHours} h for food, ${RULES.returnWindowHours} h for other items.</span></div>
          <div class="check"><span class="m">4</span><span><b>Customer frequency:</b> more than ${RULES.maxRefundsPerCustomer7d} refunds in 7 days raises the risk.</span></div>
          <div class="check"><span class="m">5</span><span><b>Self-refund:</b> the cashier who made the sale should not approve its refund.</span></div>
          <div class="check"><span class="m">6</span><span><b>Payment route:</b> cash back for a UPI sale is a common way to pocket money.</span></div>
          <div class="check"><span class="m">7</span><span><b>High value:</b> refunds of ${inr(RULES.highValueThreshold)} or more need the owner.</span></div>
          <p class="src" style="margin-top:10px">Score 0–29: approve. 30–59: owner must approve. 60+: reject.</p>
        </div>
        <div class="card span2"><h2>Refund log</h2><div class="tablewrap"><table id="rlog"></table></div></div>
      </div>`;
    const drawLog = () => {
      $("#rlog").innerHTML = `<tr><th>Refund</th><th>Time</th><th>Bill</th><th>Item</th><th>Staff</th><th class="num">Risk</th><th>Decision</th><th class="num">Amount</th></tr>` +
        state.refunds.slice().reverse().slice(0, 20).map((x) => `<tr><td>${x.id}</td><td>${fmtDT(x.t)}</td><td>${x.billId}</td><td>${esc(x.name)}</td><td>${esc(staffName(x.staff))}</td><td class="num">${x.risk}</td><td><span class="pill ${x.decision === "Rejected" ? "bad" : x.decision === "Approved" ? "ok" : "warn"}">${x.decision}</span></td><td class="num">${inr(x.amount)}</td></tr>`).join("");
    };
    const fillItems = () => {
      const b = state.bills.find((x) => x.id.toUpperCase() === $("#rbill").value.trim().toUpperCase());
      $("#ritem").innerHTML = b ? b.lines.map((l) => `<option value="${l.sku}">${esc(l.name)} (${l.qty} × ${inr(l.price)})</option>`).join("") : `<option value="">No bill with that ID</option>`;
    };
    $("#rbill").addEventListener("input", fillItems);
    $("#rlatest").addEventListener("click", () => { $("#rbill").value = state.bills[state.bills.length - 1].id; fillItems(); });
    $("#rold").addEventListener("click", () => {
      const old = state.bills.filter((b) => b.t < Date.now() - 6 * DAY && b.phone);
      $("#rbill").value = old[Math.floor(Math.random() * old.length)].id; fillItems();
    });
    $("#rcheck").addEventListener("click", () => {
      const res = evaluateRefund({ billId: $("#rbill").value.trim().toUpperCase(), sku: $("#ritem").value, qty: parseInt($("#rqty").value, 10) || 1, mode: $("#rmode").value, reason: $("#rreason").value, staff: state.staff });
      const cls = res.decision === "Rejected" ? "bad" : res.decision === "Approved" ? "ok" : "warn";
      const color = cls === "bad" ? "var(--bad)" : cls === "ok" ? "var(--ok)" : "var(--warn)";
      $("#rresult").innerHTML = `<div style="margin-top:14px">
        ${res.checks.map((c) => `<div class="check ${c.status}"><span class="m">${c.status === "pass" ? "✓" : c.status === "fail" ? "✕" : "!"}</span><span>${esc(c.text)}${c.points ? ` <small>(+${c.points})</small>` : ""}</span></div>`).join("")}
        <div class="verdict ${cls}">Risk score ${res.risk}/100 · ${res.decision === "Manager approved" ? "Needs owner approval" : res.decision}${res.amount ? " · " + inr(res.amount) : ""}
          <div class="meter"><div style="width:${res.risk}%;background:${color}"></div></div></div>
        ${res.hardFail ? "" : `<div class="row" style="margin-top:10px">
          ${res.decision === "Rejected" ? `<button class="danger" id="rsave">Log rejection</button>` : res.decision === "Approved" ? `<button id="rsave">Refund ${inr(res.amount)}</button>` : `<button id="rsave" ${state.staff === "owner" ? "" : "disabled"}>Owner approves</button>${state.staff === "owner" ? "" : `<small>Switch "Logged in as" to the owner to approve.</small>`}`}
        </div>`}</div>`;
      const btn = $("#rsave");
      if (btn) btn.addEventListener("click", () => {
        const rec = { id: "R" + ++state.seq.refund, t: Date.now(), billId: res.bill.id, sku: res.line.sku, name: res.line.name, qty: res.qty, amount: res.amount, reason: $("#rreason").value, staff: state.staff, phone: res.bill.phone, risk: res.risk, decision: res.decision };
        state.refunds.push(rec);
        if (rec.decision !== "Rejected" && ["Wrong item", "Changed mind"].includes(rec.reason)) prodBySku(rec.sku).stock += rec.qty;
        if (rec.risk >= 30) alertPush(state, "refund", `Refund ${rec.decision === "Rejected" ? "blocked" : "escalated"}: ${rec.name}`, `Bill ${rec.billId}, risk ${rec.risk}/100. ${res.checks.filter((c) => c.status !== "pass").map((c) => c.text).join(" ")}`, Date.now(), rec.amount);
        save();
        $("#rresult").innerHTML = `<div class="verdict ${cls}">${rec.id} logged: ${rec.decision}.</div>`;
        drawLog();
      });
    });
    drawLog();
  }

  function evaluateRefund(req) {
    const checks = [];
    let risk = 0, hardFail = false;
    const bill = state.bills.find((b) => b.id === req.billId);
    if (!bill) {
      checks.push({ status: "fail", text: "No bill found with this ID. Refund refused." });
      return { checks, risk: 100, decision: "Rejected", hardFail: true };
    }
    checks.push({ status: "pass", text: `Bill ${bill.id} found (${fmtDT(bill.t)}, ${inr(bill.total)}, ${bill.mode}).` });
    const line = bill.lines.find((l) => l.sku === req.sku);
    const already = state.refunds.filter((x) => x.billId === bill.id && x.sku === req.sku && x.decision !== "Rejected").reduce((a, x) => a + x.qty, 0);
    if (!line) {
      checks.push({ status: "fail", text: "This item is not on the bill." });
      return { checks, risk: 100, decision: "Rejected", hardFail: true, bill };
    }
    if (req.qty > line.qty - already) {
      checks.push({ status: "fail", text: `Only ${line.qty - already} unit(s) of this item can still be returned on this bill (${line.qty} bought, ${already} already refunded).` });
      return { checks, risk: 100, decision: "Rejected", hardFail: true, bill };
    }
    checks.push({ status: "pass", text: `Item is on the bill and ${line.qty - already} unit(s) are still returnable.` });
    const amount = line.price * req.qty;
    const p = prodBySku(line.sku) || { perishable: false };
    const win = (p.perishable ? RULES.perishableWindowHours : RULES.returnWindowHours) * HOUR;
    const age = Date.now() - bill.t;
    if (age > win) { risk += 40; checks.push({ status: "fail", text: `Outside the return window (${Math.round(age / HOUR)} h since purchase, limit ${win / HOUR} h).`, points: 40 }); }
    else checks.push({ status: "pass", text: `Inside the return window (${Math.round(age / HOUR)} h of ${win / HOUR} h).` });
    if (bill.phone) {
      const recent = state.refunds.filter((x) => x.phone === bill.phone && x.t > Date.now() - 7 * DAY).length;
      if (recent >= RULES.maxRefundsPerCustomer7d) { risk += 30; checks.push({ status: "fail", text: `This customer already had ${recent} refunds in the last 7 days.`, points: 30 }); }
      else checks.push({ status: "pass", text: `Customer has ${recent} refund(s) in the last 7 days.` });
    } else {
      risk += 10; checks.push({ status: "warnc", text: "No customer phone on the bill, so repeat refunds can't be tracked.", points: 10 });
    }
    if (bill.staff === req.staff && req.staff !== "owner") { risk += 25; checks.push({ status: "fail", text: `${staffName(req.staff)} made this sale and is now processing its refund.`, points: 25 }); }
    else checks.push({ status: "pass", text: "Refund processed by a different person than the sale." });
    const cashOut = req.mode === "Cash" || (req.mode === "Same as payment" && bill.mode === "Cash");
    if (cashOut && bill.mode !== "Cash") { risk += 20; checks.push({ status: "fail", text: `Cash refund for a ${bill.mode} payment.`, points: 20 }); }
    else checks.push({ status: "pass", text: req.mode === "Store credit" ? "Refund as store credit." : "Refund goes back the same way it was paid." });
    if (amount >= RULES.highValueThreshold) { risk += 15; checks.push({ status: "warnc", text: `High-value refund (${inr(amount)}).`, points: 15 }); }
    else checks.push({ status: "pass", text: `Refund value ${inr(amount)} is below the high-value limit.` });
    if (req.reason === "Changed mind" && p.perishable) { risk += 15; checks.push({ status: "warnc", text: "Food items are not normally returned for a change of mind.", points: 15 }); }
    risk = Math.min(100, risk);
    const decision = risk >= 60 ? "Rejected" : risk >= 30 ? "Manager approved" : "Approved";
    return { checks, risk, decision, amount, bill, line, qty: req.qty, hardFail };
  }

  /* Camera watch */
  let camStream = null, camTimer = null, model = null, lastBillAt = 0;
  let track = { seenShelf: 0, lastAlert: 0, dwellStart: 0 };
  function stopCamera() {
    if (camTimer) { cancelAnimationFrame(camTimer); camTimer = null; }
    if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; }
  }
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("Could not load " + src)); document.head.appendChild(s); });
  }
  function camera(el) {
    el.innerHTML = `
      <div class="pagehead"><div><h1>Camera watch</h1><p>Runs an object-detection model in the browser on the shop's existing camera or a phone. It watches two zones and raises an alert when someone leaves through the exit zone with no bill made in the last 60 seconds, or lingers at a shelf for a long time.</p></div></div>
      <div class="grid g2">
        <div class="card">
          <div class="camwrap" id="camwrap">
            <video id="vid" playsinline muted></video><canvas id="cv"></canvas>
            <div class="placeholder" id="ph">Camera is off.<br>Press "Start camera" and allow access. Video never leaves this device.</div>
          </div>
          <div class="row" style="margin-top:10px">
            <button id="camStart">Start camera</button><button class="secondary" id="camStop">Stop</button>
            <button class="secondary" id="camSim">Simulate a walk-out</button>
          </div>
          <p class="src" id="camStatus" style="margin-top:8px">Model: COCO-SSD (TensorFlow.js, open source). Loads on first start.</p>
        </div>
        <div class="card">
          <h2>Zones</h2>
          <p class="muted" style="font-size:.85rem">The frame is split left to right. Move the sliders to match your shop's layout.</p>
          <label class="field">Shelf zone ends at <b id="zsv"></b><input type="range" id="zs" min="20" max="70" value="45"></label>
          <label class="field">Exit zone starts at <b id="zev"></b><input type="range" id="ze" min="50" max="95" value="75"></label>
          <label class="field">Shelf dwell alert after (seconds)<input type="number" id="zd" min="10" value="90"></label>
          <div class="callout">Grace rule: a walk-out is ignored if any bill was made in the last 60 seconds, so paying customers don't trigger alerts. Last bill: <b id="lastBill"></b></div>
          <h2 style="margin-top:16px">Recent camera alerts</h2>
          <div id="camAlerts"></div>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h2>What this proof of concept does and does not do</h2>
        <p>It detects people with a general-purpose model and applies zone rules. It does not recognise faces or identify anyone, and it stores only a small snapshot in this browser when an alert fires. A shop deployment would run the same logic on a low-cost edge box connected to existing CCTV, the way commercial systems such as Veesion work across 6,000+ stores (${srcLink("veesion")}). Detecting specific concealment gestures needs a model trained on shop footage, which is our next step (see the deck's TRL roadmap).</p>
      </div>`;
    const zs = $("#zs"), ze = $("#ze");
    const showZ = () => { $("#zsv").textContent = zs.value + "%"; $("#zev").textContent = ze.value + "%"; };
    zs.addEventListener("input", showZ); ze.addEventListener("input", showZ); showZ();
    const lastBillTime = () => Math.max(lastBillAt, state.bills.length ? state.bills[state.bills.length - 1].t : 0);
    const showLast = () => { const t = lastBillTime(); $("#lastBill").textContent = t ? fmtDT(t) : "none"; };
    showLast();
    const drawCamAlerts = () => {
      const list = state.alerts.filter((a) => a.kind === "theft").slice(-6).reverse();
      $("#camAlerts").innerHTML = list.length ? list.map((a) => `<div class="alert"><div class="ic theft">!</div><div class="body"><b>${esc(a.title)}</b>${esc(a.msg)}<br><small>${fmtDT(a.t)}</small></div>${a.img ? `<img src="${a.img}" alt="Snapshot">` : ""}</div>`).join("") : `<p class="muted">None yet.</p>`;
    };
    drawCamAlerts();
    const raise = (title, msg, img) => {
      alertPush(state, "theft", title, msg, Date.now(), 0, img);
      save(); drawCamAlerts(); toast(title);
    };
    $("#camSim").addEventListener("click", () => {
      if (Date.now() - lastBillTime() < 60000) { toast("A bill was made in the last 60 s, so this walk-out is treated as a paying customer."); return; }
      raise("Possible walk-out without billing", "Simulated: a person moved from the shelf zone to the exit zone with no bill in the last 60 s.", "");
    });
    $("#camStop").addEventListener("click", () => { stopCamera(); $("#ph").style.display = ""; $("#camStatus").textContent = "Camera stopped."; });
    $("#camStart").addEventListener("click", async () => {
      const status = $("#camStatus");
      try {
        status.textContent = "Asking for camera access…";
        camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: 640, height: 480 }, audio: false });
        const v = $("#vid"); v.srcObject = camStream; await v.play();
        $("#ph").style.display = "none";
        if (!model) {
          status.textContent = "Loading detection model (about 5 MB, first time only)…";
          if (!window.tf) await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js");
          if (!window.cocoSsd) await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js");
          model = await window.cocoSsd.load({ base: "lite_mobilenet_v2" });
        }
        status.textContent = "Watching. People are boxed in green; the exit zone is shaded red.";
        const cv = $("#cv"), ctx = cv.getContext("2d");
        let busy = false;
        const loop = async () => {
          if (!camStream) return;
          camTimer = requestAnimationFrame(loop);
          if (busy || v.readyState < 2) return;
          busy = true;
          const preds = await model.detect(v);
          busy = false;
          cv.width = v.videoWidth; cv.height = v.videoHeight;
          const W = cv.width, H = cv.height;
          const sx = (zs.value / 100) * W, ex = (ze.value / 100) * W;
          ctx.clearRect(0, 0, W, H);
          ctx.fillStyle = "rgba(15,94,87,.15)"; ctx.fillRect(0, 0, sx, H);
          ctx.fillStyle = "rgba(180,35,24,.18)"; ctx.fillRect(ex, 0, W - ex, H);
          ctx.font = "14px sans-serif"; ctx.fillStyle = "#fff";
          ctx.fillText("SHELF", 8, 18); ctx.fillText("EXIT", ex + 8, 18);
          const people = preds.filter((p) => p.class === "person" && p.score > 0.5);
          const now = Date.now();
          let inShelf = false, inExit = false;
          people.forEach((p) => {
            const [x, y, w, h] = p.bbox; const cx = x + w / 2;
            ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = "#22c55e"; ctx.fillText("person " + Math.round(p.score * 100) + "%", x + 4, y + 16);
            if (cx < sx) inShelf = true;
            if (cx > ex) inExit = true;
          });
          preds.filter((p) => p.class !== "person" && p.score > 0.5).forEach((p) => {
            const [x, y, w, h] = p.bbox; ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = "#f59e0b"; ctx.fillText(p.class, x + 4, y + 14);
          });
          if (inShelf) { track.seenShelf = now; if (!track.dwellStart) track.dwellStart = now; } else track.dwellStart = 0;
          const dwellLimit = (parseInt($("#zd").value, 10) || 90) * 1000;
          const snap = () => { const c = document.createElement("canvas"); c.width = 160; c.height = 120; c.getContext("2d").drawImage(v, 0, 0, 160, 120); return c.toDataURL("image/jpeg", 0.6); };
          if (now - track.lastAlert > 20000) {
            if (inExit && now - track.seenShelf < 30000 && now - lastBillTime() > 60000) {
              track.lastAlert = now; raise("Possible walk-out without billing", "A person moved from the shelf zone to the exit zone with no bill in the last 60 s.", snap());
            } else if (track.dwellStart && now - track.dwellStart > dwellLimit) {
              track.lastAlert = now; track.dwellStart = now; raise("Long shelf dwell", `A person stayed in the shelf zone for more than ${dwellLimit / 1000} s.`, snap());
            }
          }
          showLast();
        };
        loop();
      } catch (err) {
        stopCamera();
        status.textContent = "Camera could not start: " + err.message + ". You can still use \"Simulate a walk-out\". Camera access needs https (GitHub Pages is fine) or localhost.";
      }
    });
  }

  /* Loss estimator */
  function estimator(el) {
    const inScope = OUTLETS.filter((o) => o.inScope).length;
    el.innerHTML = `
      <div class="pagehead"><div><h1>Campus loss estimator</h1><p>How much money leaks out of campus shops in a year, and what LeakGuard could recover. Defaults use IIT Madras' published outlet list and Indian shrinkage benchmarks. Change any value.</p></div></div>
      <div class="grid g2">
        <div class="card">
          <h2>Inputs</h2>
          <label class="field">Outlets that sell goods or food <input id="eo" type="number" min="1" value="${inScope}"><small>${inScope} of the ${OUTLETS.length} outlets listed by IIT Madras' Dean of Students (${srcLink("dost")}).</small></label>
          <label class="field">Average sales per outlet per day (₹) <input id="er" type="number" min="0" step="500" value="12000"><small>Our assumption. Replace it with figures from shop interviews.</small></label>
          <label class="field">Operating days per year <input id="ed" type="number" min="1" max="365" value="300"></label>
          <label class="field">Shrinkage rate (% of sales): <b id="esv"></b><input id="es" type="range" min="0.5" max="5" step="0.1" value="2.7">
            <span class="row" style="gap:6px;margin-top:4px"><button class="small secondary" data-s="1.6">US 2022: 1.6%</button><button class="small secondary" data-s="2.7">India 2010: 2.7%</button><button class="small secondary" data-s="3.2">India 2009: 3.2%</button></span></label>
          <label class="field">Refunds as % of sales <input id="ef" type="number" min="0" step="0.5" value="2"><small>Small campus shops refund far less than the 8.72% US in-store rate (${srcLink("appriss2024")}).</small></label>
          <label class="field">Share of refunds that are fraudulent (%) <input id="eff" type="number" min="0" max="100" step="0.1" value="15.14"><small>Appriss Retail 2024.</small></label>
          <h2 style="margin-top:14px">LeakGuard assumptions</h2>
          <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">
            <label class="field">Cut in shoplifting (%)<input id="x1" type="number" value="40"></label>
            <label class="field">Cut in staff theft (%)<input id="x2" type="number" value="50"></label>
            <label class="field">Cut in admin / stock errors (%)<input id="x3" type="number" value="60"></label>
            <label class="field">Cut in refund fraud (%)<input id="x4" type="number" value="70"></label>
            <label class="field">Price per outlet per month (₹)<input id="x5" type="number" value="799"></label>
            <label class="field">One-time setup per outlet (₹)<input id="x6" type="number" value="4000"></label>
          </div>
        </div>
        <div class="stack">
          <div class="card"><div id="eout"></div></div>
          <div class="card"><h2>Where the shrink comes from (India)</h2><div id="ecause"></div>
            <p class="src">Split by cause from the Global Retail Theft Barometer for India, Jul 2008 – Jun 2009: shoplifting 45.2%, employee theft 23.3%, administrative errors 22.6%, rest 8.9% (${srcLink("grtbIndia2009")}).</p></div>
        </div>
      </div>`;
    const calc = () => {
      const v = (id) => parseFloat($("#" + id).value) || 0;
      $("#esv").textContent = v("es").toFixed(1) + "%";
      const revenue = v("eo") * v("er") * v("ed");
      const shrink = revenue * v("es") / 100;
      const refundFraud = revenue * v("ef") / 100 * v("eff") / 100;
      const causes = [
        { k: "Shoplifting", share: 45.2, cut: v("x1"), cls: "bad" },
        { k: "Employee theft", share: 23.3, cut: v("x2"), cls: "bad" },
        { k: "Admin / stock errors", share: 22.6, cut: v("x3"), cls: "warn" },
        { k: "Other (vendor etc.)", share: 8.9, cut: v("x3") / 2, cls: "warn" },
      ].map((c) => ({ ...c, loss: shrink * c.share / 100 }));
      const total = shrink + refundFraud;
      const saved = causes.reduce((a, c) => a + c.loss * c.cut / 100, 0) + refundFraud * v("x4") / 100;
      const cost = v("eo") * (v("x5") * 12) + v("eo") * v("x6");
      const perOutletMonth = total / Math.max(1, v("eo")) / 12;
      const paybackMonths = saved > 0 ? (v("eo") * v("x6")) / ((saved - v("eo") * v("x5") * 12) / 12) : Infinity;
      $("#eout").innerHTML = `
        <h2>Result</h2>
        <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
          <div><div class="muted" style="font-size:.8rem">Campus retail sales / year</div><div class="bigstat">${inrShort(revenue)}</div></div>
          <div><div class="muted" style="font-size:.8rem">Lost to leakage / year</div><div class="bigstat" style="color:var(--bad)">${inrShort(total)}</div></div>
          <div><div class="muted" style="font-size:.8rem">Per outlet per month</div><div class="bigstat" style="font-size:1.4rem">${inr(perOutletMonth)}</div></div>
          <div><div class="muted" style="font-size:.8rem">Recovered with LeakGuard / year</div><div class="bigstat" style="font-size:1.4rem;color:var(--ok)">${inrShort(saved)}</div></div>
        </div>
        <table style="margin-top:12px">
          <tr><td>Shrinkage (${v("es").toFixed(1)}% of sales)</td><td class="num">${inrShort(shrink)}</td></tr>
          <tr><td>Refund fraud</td><td class="num">${inrShort(refundFraud)}</td></tr>
          <tr><td>LeakGuard cost, year 1 (all outlets)</td><td class="num">${inrShort(cost)}</td></tr>
          <tr><td><b>Net gain for shop owners, year 1</b></td><td class="num"><b style="color:${saved - cost >= 0 ? "var(--ok)" : "var(--bad)"}">${inrShort(saved - cost)}</b></td></tr>
          <tr><td>Payback on setup cost</td><td class="num">${isFinite(paybackMonths) && paybackMonths > 0 ? paybackMonths.toFixed(1) + " months" : "does not pay back"}</td></tr>
        </table>`;
      const max = Math.max(...causes.map((c) => c.loss), refundFraud, 1);
      $("#ecause").innerHTML = [...causes, { k: "Refund fraud", loss: refundFraud, cls: "" }].map((c) => `<div class="hbar"><div class="t"><span>${c.k}</span><b>${inrShort(c.loss)}</b></div><div class="track"><div class="fill ${c.cls}" style="width:${(c.loss / max) * 100}%"></div></div></div>`).join("");
    };
    $$("input", el).forEach((i) => i.addEventListener("input", calc));
    $$("[data-s]", el).forEach((b) => b.addEventListener("click", () => { $("#es").value = b.dataset.s; calc(); }));
    calc();
  }

  /* Campus data */
  function campus(el) {
    const byType = {};
    OUTLETS.forEach((o) => { byType[o.type] = (byType[o.type] || 0) + 1; });
    const types = Object.entries(byType).sort((a, b) => b[1] - a[1]);
    const inScope = OUTLETS.filter((o) => o.inScope).length;
    el.innerHTML = `
      <div class="pagehead"><div><h1>Campus data: IIT Madras</h1><p>The problem is about campus shop owners. This page shows how many there are and who they serve, from IIT Madras' own published lists.</p></div></div>
      <div class="grid kpis">
        <div class="card kpi"><div class="label">Outlets listed on campus</div><div class="value">${OUTLETS.length}</div><div class="sub">${srcLink("dost")}</div></div>
        <div class="card kpi warn"><div class="label">Sell goods or food (in scope)</div><div class="value">${inScope}</div><div class="sub">services like salons and cycle repair excluded</div></div>
        <div class="card kpi"><div class="label">Students on campus</div><div class="value">9,981</div><div class="sub">UG + PG + full-time PhD, ${srcLink("nirf")}</div></div>
        <div class="card kpi"><div class="label">Students per in-scope outlet</div><div class="value">${Math.round(9981 / inScope)}</div><div class="sub">before counting staff and residents</div></div>
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card"><h2>Outlets by type</h2>
          ${types.map(([t, n]) => `<div class="hbar"><div class="t"><span>${esc(t)}</span><b>${n}</b></div><div class="track"><div class="fill" style="width:${(n / types[0][1]) * 100}%"></div></div></div>`).join("")}
        </div>
        <div class="card"><h2>Scaling beyond one campus</h2>
          <p>India has <b>1,168 universities, 45,473 colleges and 12,002 standalone institutions</b>, with 4.33 crore students enrolled in 2021-22 (${srcLink("aishe")}). Almost every campus runs a canteen, a stationery shop and a print shop.</p>
          <p>Payments are already digital: UPI handled <b>21.63 billion transactions worth ₹27.97 trillion</b> in December 2025 alone (${srcLink("upi")}). Most campus shops already accept UPI, so the bill-first workflow LeakGuard needs fits how they work today.</p>
          <div class="callout">Each outlet's loss is small. Spread over ${inScope} outlets here, and lakhs of campus outlets across India, it adds up to crores a year.</div>
        </div>
        <div class="card span2"><div class="row" style="justify-content:space-between"><h2>All outlets</h2><input id="osearch" placeholder="Filter by name, type or place"></div>
          <div class="tablewrap"><table id="otable"></table></div>
          <p class="src">Source: ${srcLink("dost")} (accessed ${ACCESSED}), cross-checked with ${srcLink("ccw")}.</p>
        </div>
      </div>`;
    const draw = () => {
      const q = $("#osearch").value.toLowerCase();
      $("#otable").innerHTML = `<tr><th>#</th><th>Outlet</th><th>Type</th><th>Location</th><th>In scope</th></tr>` +
        OUTLETS.filter((o) => (o.name + o.type + o.location).toLowerCase().includes(q)).map((o, i) => `<tr><td>${i + 1}</td><td>${esc(o.name)}</td><td>${esc(o.type)}</td><td>${esc(o.location)}</td><td>${o.inScope ? '<span class="pill neutral">Yes</span>' : '<span class="muted">No</span>'}</td></tr>`).join("");
    };
    $("#osearch").addEventListener("input", draw);
    draw();
  }

  /* Sources */
  function sources(el) {
    el.innerHTML = `
      <div class="pagehead"><div><h1>Sources and method</h1><p>All figures were collected from the public web on ${ACCESSED}. Shop transactions in this demo are simulated and stay in your browser.</p></div></div>
      <div class="card"><h2>Benchmarks used</h2><div class="tablewrap"><table>
        <tr><th>Figure</th><th>Value</th><th>Source</th></tr>
        ${BENCHMARKS.map((b) => `<tr><td>${esc(b.label)}</td><td><b>${esc(b.value)}</b></td><td>${srcLink(b.src)}</td></tr>`).join("")}
      </table></div></div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card"><h2>Full reference list</h2><ol style="padding-left:18px;font-size:.88rem">
          ${Object.values(SOURCES).map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)}</a>, ${esc(s.org)}</li>`).join("")}
        </ol></div>
        <div class="card"><h2>How the data was gathered</h2>
          <ol style="padding-left:18px;font-size:.88rem">
            <li>Campus outlets: copied from the Dean of Students' "Shops" page and checked against the Hostel Management "Eateries and shops" page. Each outlet was tagged in scope if it sells physical goods or food.</li>
            <li>Student strength: summed from IIT Madras' NIRF 2025 submission.</li>
            <li>Shrinkage and refund benchmarks: taken from the original survey publishers (NRF, Centre for Retail Research, Appriss Retail) or the news reports that published their figures.</li>
            <li>Prior art: three granted US patents read on Google Patents for the IP slide.</li>
          </ol>
          <div class="callout warn"><b>Caveats.</b> The Indian shrinkage figures are from 2009-2010, the last years the Global Retail Theft Barometer reported India separately. Daily sales per outlet is our assumption until we finish shop-owner interviews. Catalogue prices are indicative MRPs.</div>
          <p style="margin-top:12px"><a href="data/outlets_iitm.json">outlets_iitm.json</a> · <a href="data/benchmarks.json">benchmarks.json</a> · <a href="data/sources.json">sources.json</a></p>
        </div>
      </div>`;
  }

  /* ---------- boot ---------- */
  state = load();
  const staffSel = $("#staffSel");
  staffSel.innerHTML = STAFF.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
  staffSel.value = state.staff || "owner";
  staffSel.addEventListener("change", () => { state.staff = staffSel.value; save(); route(); });
  $("#modalX").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Reset all demo data in this browser?")) return;
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    state = seed(); save(); staffSel.value = "owner"; route(); toast("Demo data reset.");
  });
  window.addEventListener("hashchange", route);
  save();
  route();
})();
