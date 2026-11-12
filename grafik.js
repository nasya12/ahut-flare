"use strict";
/* AHUT FLARE — SVG grafikler.
   Dış kütüphane yoktur; her şey elle çizilir, çevrimdışı çalışır ve tema
   değişkenlerini (var(--…)) kullandığı için açık/koyu temaya kendiliğinden uyar.
   Eski dashboard'dan taşındı; ölçüler büyütüldü, etiketler iki dilli yapıldı. */

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{2B50}]/gu;
const esc = (s) =>
  String(s == null ? "" : s).replace(EMOJI, "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const SEVIYE_RENK = (p) =>
  p < 0.2 ? "var(--yesil)" : p < 0.5 ? "var(--sari)" : p < 0.8 ? "var(--turuncu)" : "var(--kirmizi)";

/* Risk seviyesi metni -> CSS sınıfı (Türkçe karakterler sınıf adında kullanılmaz) */
const ROZET_SINIF = (s) => {
  const h = { "DÜŞÜK": "r-DUSUK", "ORTA": "r-ORTA", "YÜKSEK": "r-YUKSEK", "ÇOK YÜKSEK": "r-COK-YUKSEK" };
  return h[String(s || "").trim()] || "r-yok";
};

function olcek(a0, a1, b0, b1, log) {
  if (log) {
    const l0 = Math.log10(a0), l1 = Math.log10(a1);
    return (v) => b0 + ((Math.log10(Math.max(v, 1e-30)) - l0) / (l1 - l0)) * (b1 - b0);
  }
  return (v) => b0 + ((v - a0) / (a1 - a0)) * (b1 - b0);
}

function cizgiYolu(xs, ys, fx, fy) {
  let d = "", acik = false;
  xs.forEach((x, i) => {
    if (ys[i] == null) { acik = false; return; }
    d += (acik ? "L" : "M") + fx(x).toFixed(1) + " " + fy(ys[i]).toFixed(1);
    acik = true;
  });
  return d;
}

function eksenler(W, H, M, fx, fy, xt, yt, xe, ye, xlog) {
  let s = "";
  yt.forEach((v) => {
    const y = fy(v);
    s += `<line class="izgara-c" x1="${M.l}" x2="${W - M.r}" y1="${y}" y2="${y}"/>` +
         `<text x="${M.l - 7}" y="${y + 4}" text-anchor="end">${esc(nf(v, 2))}</text>`;
  });
  xt.forEach((v) => {
    const x = fx(v);
    const etiket = xlog ? (v >= 1 ? nf(v, 0) : v.toExponential(0).replace("e-", "e−")) : nf(v, 0);
    s += `<line class="izgara-c" x1="${x}" x2="${x}" y1="${M.t}" y2="${H - M.b}"/>` +
         `<text x="${x}" y="${H - M.b + 16}" text-anchor="middle">${esc(etiket)}</text>`;
  });
  s += `<rect x="${M.l}" y="${M.t}" width="${W - M.l - M.r}" height="${H - M.t - M.b}" fill="none" class="ek"/>`;
  s += `<text x="${(M.l + W - M.r) / 2}" y="${H - 3}" text-anchor="middle">${esc(xe)}</text>`;
  s += `<text transform="translate(13 ${(M.t + H - M.b) / 2}) rotate(-90)" text-anchor="middle">${esc(ye)}</text>`;
  return s;
}

/* ------------------------------------------------- (a) oksijen eğrisi */
function oksijenCiz(e, o) {
  o = o || {};
  const W = 900, H = 430, M = { l: 56, r: 18, t: 18, b: 42 };
  const fx = olcek(5, 60, M.l, W - M.r), fy = olcek(0, 1, H - M.b, M.t);
  const xEks = DIL === "tr" ? "Oksijen (%)" : "Oxygen (%)";
  const yEks = DIL === "tr" ? "Yanma ihtimali" : "Burning probability";
  let s = `<svg class="grafik" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">`;
  s += eksenler(W, H, M, fx, fy, [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
                [0, 0.25, 0.5, 0.75, 1], xEks, yEks);

  const band = (ee, renk, op) => {
    const ust = ee.oksijen.map((x, i) => `${fx(x).toFixed(1)} ${fy(ee.ust[i]).toFixed(1)}`);
    const alt = ee.oksijen.map((x, i) => `${fx(x).toFixed(1)} ${fy(ee.alt[i]).toFixed(1)}`).reverse();
    return `<path d="M${ust.join("L")}L${alt.join("L")}Z" fill="${renk}" opacity="${op}"/>`;
  };
  s += band(e, "var(--vurgu)", 0.2);
  (o.ekler || []).forEach((x) => (s += band(x.e, x.renk, 0.14)));

  s += `<line x1="${M.l}" x2="${W - M.r}" y1="${fy(0.5)}" y2="${fy(0.5)}" stroke="var(--sonuk)" stroke-dasharray="2 4"/>` +
       `<text x="${W - M.r - 5}" y="${fy(0.5) - 5}" text-anchor="end">${esc(DIL === "tr" ? "yanar / söner eşiği" : "burn / extinguish threshold")}</text>`;
  s += `<path d="${cizgiYolu(e.oksijen, e.ihtimal, fx, fy)}" fill="none" stroke="var(--vurgu)" stroke-width="2.4"/>`;
  (o.ekler || []).forEach((x) => {
    s += `<path d="${cizgiYolu(x.e.oksijen, x.e.ihtimal, fx, fy)}" fill="none" stroke="${x.renk}" stroke-width="2.4"/>`;
  });

  if (e.sonme_siniri != null) {
    const x = fx(Math.max(5, Math.min(60, e.sonme_siniri)));
    s += `<line x1="${x}" x2="${x}" y1="${M.t}" y2="${H - M.b}" stroke="var(--yesil)" stroke-width="1.6" stroke-dasharray="5 4"/>` +
         `<text x="${x - 5}" y="${H - M.b - 7}" text-anchor="end" style="fill:var(--yesil)">${esc((DIL === "tr" ? "sönme sınırı %" : "extinction limit ") + nf(e.sonme_siniri, 1))}</text>`;
  }

  (o.yakin || []).forEach((d, i) => {
    if (d.yanar == null || d.oksijen == null) return;
    const y = (d.yanar ? 1 : 0) + ((i % 7) - 3) * 0.012 * (d.yanar ? -1 : 1);
    const otomatik = d.kaynak && d.kaynak.indexOf("Gemma") >= 0;
    s += `<circle cx="${fx(d.oksijen)}" cy="${fy(y)}" r="3.8" fill="${d.yanar ? "var(--kirmizi)" : "var(--yesil)"}" opacity="${otomatik ? 0.34 : 0.85}">` +
         `<title>${esc(d.makale_id)}: O₂ %${esc(nf(d.oksijen, 1))} → ${d.yanar ? (DIL === "tr" ? "yandı" : "burned") : (DIL === "tr" ? "söndü" : "extinguished")}</title></circle>`;
  });

  (o.ortam || []).filter((v) => v != null).forEach((v, i) => {
    const x = fx(Math.max(5, Math.min(60, v)));
    const renk = i === 0 ? "var(--yazi)" : "var(--turuncu)";
    s += `<line x1="${x}" x2="${x}" y1="${M.t}" y2="${H - M.b}" stroke="${renk}" stroke-width="1.8"/>` +
         `<text x="${x + 5}" y="${M.t + 13}" style="fill:${renk}">${esc(DIL === "tr" ? "ortam O₂" : "ambient O₂")}</text>`;
  });
  return s + "</svg>";
}

/* ------------------------------------------------- (b) yanabilirlik haritası */
function haritaCiz(h, k) {
  const W = 900, H = 450, M = { l: 56, r: 18, t: 18, b: 42 };
  const fx = olcek(1e-5, 1, M.l, W - M.r, true), fy = olcek(5, 60, H - M.b, M.t);
  const n = h.g.length, m = h.oksijen.length;
  const lg = h.g.map((v) => Math.log10(v)), orta = [];
  for (let i = 0; i < n; i++) {
    const a = i === 0 ? lg[0] - (lg[1] - lg[0]) / 2 : (lg[i - 1] + lg[i]) / 2;
    const b = i === n - 1 ? lg[n - 1] + (lg[n - 1] - lg[n - 2]) / 2 : (lg[i] + lg[i + 1]) / 2;
    orta.push([a, b]);
  }
  const ho = (j) => {
    const a = j === 0 ? h.oksijen[0] : (h.oksijen[j - 1] + h.oksijen[j]) / 2;
    const b = j === m - 1 ? h.oksijen[m - 1] : (h.oksijen[j] + h.oksijen[j + 1]) / 2;
    return [a, b];
  };
  const px = (l) => fx(Math.pow(10, Math.min(0, Math.max(-5, l))));

  let s = `<svg class="grafik" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">`;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const x0 = px(orta[i][0]), x1 = px(orta[i][1]), oo = ho(j), y0 = fy(oo[1]), y1 = fy(oo[0]);
      s += `<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${(x1 - x0 + 0.6).toFixed(1)}" height="${(y1 - y0 + 0.6).toFixed(1)}" fill="${SEVIYE_RENK(h.ihtimal[i][j])}">` +
           `<title>g=${esc(nf(h.g[i], 5))}, O₂=%${esc(nf(h.oksijen[j], 1))}: %${esc(pct(h.ihtimal[i][j]))}</title></rect>`;
    }
  }
  const xEks = DIL === "tr" ? "Yerçekimi g (log ölçek)" : "Gravity g (log scale)";
  const yEks = DIL === "tr" ? "Oksijen (%)" : "Oxygen (%)";
  s += eksenler(W, H, M, fx, fy, [1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1], [10, 20, 30, 40, 50, 60], xEks, yEks, true);

  [["ISS", 1e-4, 0], [DIL === "tr" ? "Ay" : "Moon", 0.165, 0], ["Mars", 0.38, 1],
   [DIL === "tr" ? "Dünya" : "Earth", 1, 0]].forEach((p) => {
    const ad = p[0], v = p[1], sira = p[2];
    const son = v === 1, anc = son ? "end" : "start", dx = son ? -4 : 4;
    s += `<line x1="${fx(v)}" x2="${fx(v)}" y1="${M.t}" y2="${H - M.b}" stroke="#fff" stroke-opacity=".65" stroke-dasharray="3 4"/>` +
         `<text text-anchor="${anc}" x="${fx(v) + dx}" y="${M.t + 13 + sira * 14}" style="fill:#fff;paint-order:stroke;stroke:#000;stroke-width:2.5px">${esc(ad)}</text>`;
  });

  const cx = fx(Math.max(1e-5, Math.min(1, k.g))), cy = fy(Math.max(5, Math.min(60, k.oksijen)));
  s += `<circle cx="${cx}" cy="${cy}" r="9" fill="none" stroke="#000" stroke-width="4.5"/>` +
       `<circle cx="${cx}" cy="${cy}" r="9" fill="none" stroke="#fff" stroke-width="2"/>`;
  s += "</svg>";

  const g = [["< %20", "var(--yesil)"], ["%20–50", "var(--sari)"], ["%50–80", "var(--turuncu)"], ["≥ %80", "var(--kirmizi)"]];
  s += `<div class="gosterge">` +
    g.map((p) => `<span><i style="background:${p[1]}"></i>${esc(p[0])}</span>`).join("") +
    `<span>◯ ${esc(DIL === "tr" ? "mevcut vaka" : "current case")}</span></div>`;
  return s;
}

/* ------------------------------------------------- (c) akış eğrisi */
function akisCiz(a, t) {
  const W = 900, H = 380, M = { l: 56, r: 18, t: 18, b: 42 };
  if (!a || !a.motor_yanma || !a.motor_yanma.some((v) => v != null)) {
    return `<div class="bos"><b>${esc(DIL === "tr" ? "Fizik motoru bu koşulu bilmiyor" : "The physics engine does not cover this condition")}</b></div>`;
  }
  const fx = olcek(0.1, 100, M.l, W - M.r, true), fy = olcek(0, 1, H - M.b, M.t);
  const xEks = DIL === "tr" ? "Hava akışı (cm/s, log ölçek)" : "Air flow (cm/s, log scale)";
  const yEks = DIL === "tr" ? "Motor yanma ihtimali" : "Engine burning probability";
  let s = `<svg class="grafik" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">`;
  s += eksenler(W, H, M, fx, fy, [0.1, 1, 10, 100], [0, 0.25, 0.5, 0.75, 1], xEks, yEks, true);
  s += `<line x1="${M.l}" x2="${W - M.r}" y1="${fy(0.5)}" y2="${fy(0.5)}" stroke="var(--sonuk)" stroke-dasharray="2 4"/>`;
  s += `<path d="${cizgiYolu(a.akis, a.motor_yanma, fx, fy)}" fill="none" stroke="var(--vurgu)" stroke-width="2.4"/>`;

  const gi = t && t.girdi ? t.girdi.akis : null, ma = t ? t.motor_akis : null;
  if (gi != null && gi > 0) {
    s += `<line x1="${fx(gi)}" x2="${fx(gi)}" y1="${M.t}" y2="${H - M.b}" stroke="var(--yazi)" stroke-width="1.8"/>` +
         `<text x="${fx(gi) + 5}" y="${M.t + 13}" style="fill:var(--yazi)">${esc(DIL === "tr" ? "mevcut akış" : "current flow")}</text>`;
  } else if (gi == null && ma != null && ma > 0) {
    s += `<line x1="${fx(ma)}" x2="${fx(ma)}" y1="${M.t}" y2="${H - M.b}" stroke="var(--turuncu)" stroke-dasharray="6 4" stroke-width="1.8"/>` +
         `<text x="${fx(ma) + 5}" y="${M.t + 13}" style="fill:var(--turuncu)">${esc(DIL === "tr" ? "varsayılan en kötü akış" : "assumed worst-case flow")}</text>`;
  }
  if (gi === 0 || (gi == null && ma === 0)) {
    s += `<text x="${M.l + 7}" y="${M.t + 13}" style="fill:var(--yazi)">${esc(DIL === "tr" ? "0 (durgun) ← sol kenar" : "0 (quiescent) ← left edge")}</text>`;
  }
  return s + "</svg>";
}

/* ------------------------------------------------- güven skoru yarım dairesi */
function yariDaire(skor, renk) {
  const r = 70, c = Math.PI * r, d = (Math.max(0, Math.min(100, skor)) / 100) * c;
  return `<svg viewBox="0 0 180 108" class="grafik" style="max-width:230px" role="img" aria-label="${esc(nf(skor, 0))}/100">` +
    `<path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="var(--girdi)" stroke-width="15" stroke-linecap="round"/>` +
    `<path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="${renk}" stroke-width="15" stroke-linecap="round" stroke-dasharray="${d} ${c}"/>` +
    `<text x="90" y="82" text-anchor="middle" style="fill:var(--yazi);font-size:30px;font-weight:800">${esc(nf(skor, 0))}</text>` +
    `<text x="90" y="101" text-anchor="middle">/ 100</text></svg>`;
}

/* ------------------------------------------------- küçük yatay çubuk */
function cubukCiz(ad, deger, bilinmiyor, bilinmiyorMetin) {
  const yuzde = bilinmiyor ? 0 : Math.max(0, Math.min(1, deger)) * 100;
  return `<div class="cubuk-bas"><span>${esc(ad)}</span><span>${bilinmiyor ? esc(bilinmiyorMetin || "–") : "%" + esc(pct(deger, 0))}</span></div>` +
    `<div class="cubuk" ${bilinmiyor ? 'style="opacity:.4"' : ""}>` +
    (bilinmiyor ? "" : `<i style="width:${yuzde}%;background:${SEVIYE_RENK(deger)}"></i>`) +
    `<u style="left:50%"></u></div>`;
}

/* ------------------------------------------------- parametre süpürmesi eğrisi */
/* s: {parametre, noktalar:[{deger, yanma_ihtimali, belirsizlik, guvenlik_katsayisi, ...}]}
   o: {etiket, birim, log, mevcut}  — eksen adı, birim, log ölçek, mevcut vakanın değeri */
function supurmeCiz(s, o) {
  o = o || {};
  const nk = (s.noktalar || []).filter((n) => n.yanma_ihtimali != null);
  if (nk.length < 2) {
    return `<div class="bos"><b>${esc(DIL === "tr" ? "Çizilecek nokta yok" : "No points to plot")}</b></div>`;
  }
  const W = 900, H = 420, M = { l: 56, r: 18, t: 18, b: 44 };
  const xs = nk.map((n) => n.deger);
  let x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
  const log = !!o.log && x0 > 0;
  if (x0 === x1) { x0 -= 1; x1 += 1; }
  const fx = olcek(x0, x1, M.l, W - M.r, log), fy = olcek(0, 1, H - M.b, M.t);

  /* x ekseni işaretleri */
  const xt = [];
  if (log) {
    for (let e = Math.floor(Math.log10(x0)); e <= Math.ceil(Math.log10(x1)); e++) {
      const v = Math.pow(10, e);
      if (v >= x0 * 0.999 && v <= x1 * 1.001) xt.push(v);
    }
  } else {
    for (let i = 0; i <= 6; i++) xt.push(x0 + ((x1 - x0) * i) / 6);
  }

  const xEks = (o.etiket || s.parametre) + (o.birim ? " (" + o.birim + ")" : "") +
    (log ? (DIL === "tr" ? ", log ölçek" : ", log scale") : "");
  const yEks = DIL === "tr" ? "Yanma ihtimali" : "Burning probability";

  let h = `<svg class="grafik" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">`;
  h += eksenler(W, H, M, fx, fy, xt, [0, 0.25, 0.5, 0.75, 1], xEks, yEks, log);

  /* belirsizlik bandı */
  const ust = nk.map((n) => `${fx(n.deger).toFixed(1)} ${fy(Math.min(1, n.yanma_ihtimali + (n.belirsizlik || 0))).toFixed(1)}`);
  const alt = nk.map((n) => `${fx(n.deger).toFixed(1)} ${fy(Math.max(0, n.yanma_ihtimali - (n.belirsizlik || 0))).toFixed(1)}`).reverse();
  h += `<path d="M${ust.join("L")}L${alt.join("L")}Z" fill="var(--vurgu)" opacity="0.18"/>`;

  h += `<line x1="${M.l}" x2="${W - M.r}" y1="${fy(0.5)}" y2="${fy(0.5)}" stroke="var(--sonuk)" stroke-dasharray="2 4"/>`;
  h += `<path d="${cizgiYolu(xs, nk.map((n) => n.yanma_ihtimali), fx, fy)}" fill="none" stroke="var(--vurgu)" stroke-width="2.4"/>`;

  /* her nokta, risk rengiyle */
  nk.forEach((n) => {
    h += `<circle cx="${fx(n.deger).toFixed(1)}" cy="${fy(n.yanma_ihtimali).toFixed(1)}" r="3.2" fill="${SEVIYE_RENK(n.yanma_ihtimali)}">` +
         `<title>${esc(nf(n.deger, 4))} → %${esc(pct(n.yanma_ihtimali, 1))}` +
         (n.guvenlik_katsayisi != null ? ` · ${esc(DIL === "tr" ? "güv. kats." : "safety f.")} ${esc(nf(n.guvenlik_katsayisi, 2))}` : "") +
         `</title></circle>`;
  });

  /* güvenlik eşiği: katsayının 1'in altına ilk düştüğü yer */
  const esik = esikBul(nk);
  if (esik != null) {
    const x = fx(esik);
    h += `<line x1="${x}" x2="${x}" y1="${M.t}" y2="${H - M.b}" stroke="var(--yesil)" stroke-width="2" stroke-dasharray="6 4"/>` +
         `<text x="${x - 6}" y="${M.t + 14}" text-anchor="end" style="fill:var(--yesil)">` +
         `${esc(DIL === "tr" ? "güvenlik eşiği " : "safety threshold ")}${esc(nf(esik, 2))}</text>`;
  }

  /* mevcut vakanın değeri */
  if (o.mevcut != null && o.mevcut >= x0 && o.mevcut <= x1) {
    const x = fx(o.mevcut);
    h += `<line x1="${x}" x2="${x}" y1="${M.t}" y2="${H - M.b}" stroke="var(--yazi)" stroke-width="1.8"/>` +
         `<text x="${x + 5}" y="${H - M.b - 8}" style="fill:var(--yazi)">${esc(DIL === "tr" ? "mevcut vaka" : "current case")}</text>`;
  }
  return h + "</svg>";
}

/* Güvenlik katsayısının 1'in altına ilk düştüğü değer (doğrusal ara değer) */
function esikBul(nk) {
  for (let i = 1; i < nk.length; i++) {
    const a = nk[i - 1], b = nk[i];
    if (a.guvenlik_katsayisi == null || b.guvenlik_katsayisi == null) continue;
    if (a.guvenlik_katsayisi >= 1 && b.guvenlik_katsayisi < 1) {
      const t = (1 - a.guvenlik_katsayisi) / (b.guvenlik_katsayisi - a.guvenlik_katsayisi);
      return a.deger + t * (b.deger - a.deger);
    }
  }
  return null;
}
