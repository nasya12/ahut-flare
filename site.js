"use strict";
/* AHUT FLARE — paylaşım sitesi.
   Sunucu yok: vakalar doğrudan GitHub deposundaki vakalar/ klasöründen okunur.
   Liste için tek bir API çağrısı yapılır (saatlik sınırı olan uç budur);
   dosyaların kendisi raw.githubusercontent.com'dan çekilir ve o çağrılar
   API sınırına girmez. Böylece sayfa yenilense de sınıra takılmaz. */

const DEPO = (function () {
  // nikire55.github.io/ahut-flare/ -> {sahip:"nikire55", repo:"ahut-flare"}
  const h = location.hostname.match(/^([^.]+)\.github\.io$/i);
  const p = location.pathname.split("/").filter(Boolean);
  if (h && p.length) return { sahip: h[1], repo: p[0], dal: "main" };
  return null;    // depo.json'dan okunacak
})();

const S = { vakalar: [], suzulmus: [], depo: DEPO, yukleniyor: false };

const $ = (s) => document.querySelector(s);
const el = (id) => document.getElementById(id);

async function depoBul() {
  if (S.depo) return S.depo;
  try {
    const r = await fetch("depo.json", { cache: "no-cache" });
    if (r.ok) S.depo = await r.json();
  } catch (e) {}
  return S.depo;
}

function durumYaz(metin, sinif) {
  const d = el("durum");
  d.className = "durum " + (sinif || "");
  d.innerHTML = metin || "";
}

/* ---------------------------------------------------------------- veri */
async function vakalariYukle() {
  const d = await depoBul();
  if (!d) {
    durumYaz(esc(T("hata")) + " — depo bilgisi bulunamadı.", "hata");
    return;
  }
  el("depoBag").href = `https://github.com/${d.sahip}/${d.repo}`;
  S.yukleniyor = true;
  durumYaz(`<span class="donen"></span>${esc(T("yukleniyor"))}`);

  let dosyalar;
  try {
    const r = await fetch(
      `https://api.github.com/repos/${d.sahip}/${d.repo}/contents/vakalar?ref=${d.dal || "main"}`,
      { headers: { Accept: "application/vnd.github+json" } }
    );
    if (r.status === 404) { dosyalar = []; }
    else if (!r.ok) throw new Error("HTTP " + r.status);
    else dosyalar = (await r.json()).filter((x) => x.type === "file" && x.name.endsWith(".ahut"));
  } catch (e) {
    durumYaz(esc(T("hata")) + " — " + esc(e.message), "hata");
    S.yukleniyor = false;
    return;
  }

  // dosyaları paralel çek (raw adres: API sınırına girmez)
  const paketler = await Promise.all(
    dosyalar.map(async (f) => {
      try {
        const r = await fetch(f.download_url, { cache: "no-cache" });
        if (!r.ok) return null;
        const p = await r.json();
        p.__dosya = f.name;
        p.__github = `https://github.com/${d.sahip}/${d.repo}/blob/${d.dal || "main"}/vakalar/${encodeURIComponent(f.name)}`;
        p.__ham = f.download_url;
        return p && p.bicim === "ahut-vaka" ? p : null;
      } catch (e) { return null; }
    })
  );

  S.vakalar = paketler.filter(Boolean);
  S.yukleniyor = false;
  durumYaz("");
  ciz();
  yonlendir();
}

/* ---------------------------------------------------------------- akış */
function suz() {
  const a = (el("ara").value || "").trim().toLocaleLowerCase(DIL === "tr" ? "tr-TR" : "en-US");
  let l = S.vakalar.filter((v) => {
    if (!a) return true;
    const g = v.girdi || {};
    return [v.baslik, v.aciklama, g.malzeme, v.onayar, (v.etiketler || []).join(" "),
            (v.yazar || {}).ad, ((v.sonuc || {}).tahmin || {}).risk_seviyesi]
      .join(" ").toLocaleLowerCase(DIL === "tr" ? "tr-TR" : "en-US").indexOf(a) >= 0;
  });
  const t = (v) => (v.sonuc || {}).tahmin || {};
  const sira = el("sirala").value;
  if (sira === "risk") l.sort((x, y) => (t(y).yanma_ihtimali || 0) - (t(x).yanma_ihtimali || 0));
  else if (sira === "guven") l.sort((x, y) => ((t(y).guven || {}).skor || 0) - ((t(x).guven || {}).skor || 0));
  else l.sort((x, y) => String(y.guncelleme || "").localeCompare(String(x.guncelleme || "")));
  S.suzulmus = l;
  return l;
}

function ciz() {
  const l = suz();
  const k = el("kartlar");
  if (!S.vakalar.length) {
    k.innerHTML = `<div class="bos"><b>${esc(T("bos"))}</b><span>${esc(T("bosAlt"))}</span></div>`;
    return;
  }
  if (!l.length) {
    k.innerHTML = `<div class="bos"><b>${esc(T("eslesmeYok"))}</b></div>`;
    return;
  }
  k.innerHTML = l.map((v) => {
    const t = (v.sonuc || {}).tahmin || {}, g = v.girdi || {};
    return `<a class="kart" href="#${encodeURIComponent(v.__dosya)}">
      <div class="kart-ust"><h2>${esc(v.baslik || v.__dosya)}</h2>
        <span class="rozet ${ROZET_SINIF(t.risk_seviyesi)}">${esc(t.risk_seviyesi || "—")}</span></div>
      ${v.aciklama ? `<p class="aciklama">${esc(v.aciklama)}</p>` : ""}
      <div class="olcumler">
        <span>g <b>${esc(gMetni(g.g))}</b></span>
        <span>O₂ <b>%${esc(nf(g.oksijen, 1))}</b></span>
        <span>${esc(nf(g.basinc, 1))} <b>kPa</b></span>
        <span>${esc(T("guven"))} <b>${esc(nf((t.guven || {}).skor, 0))}</b></span>
      </div>
      ${(v.etiketler || []).length ? `<div class="etiketler">${v.etiketler.slice(0, 5).map((e) => `<span class="etiket">${esc(e)}</span>`).join("")}</div>` : ""}
      <div class="kart-ayak"><span>${esc((v.yazar || {}).ad || "—")}</span>
        <span>${esc(String(v.guncelleme || "").replace("T", " ").slice(0, 16))}</span>
        ${(v.yorumlar || []).length ? `<span>${v.yorumlar.length} ${esc(T("yorum"))}</span>` : ""}</div>
    </a>`;
  }).join("");
}

const gMetni = (g) => (g == null ? "–" : g < 0.001 ? Number(g).toExponential(0).replace("e-", "e−") : nf(g, 4));

/* ---------------------------------------------------------------- ayrıntı */
function vakaCiz(v) {
  const t = (v.sonuc || {}).tahmin || {}, gv = t.guven || {};
  // Modelin GERÇEKTEN kullandığı girdiler: boş bırakılan alanları tahmin() malzeme
  // varsayılanıyla doldurur. Ham girdiyi göstermek "bilinmiyor" yazıp yanıltır.
  const g = t.girdi || v.girdi || {};
  const vars = t.kullanilan_varsayilanlar || {};
  const satir = (a, b) => `<tr><th>${esc(a)}</th><td>${b}</td></tr>`;
  const bos = (x) => (x == null ? `<i class="sonuk">${esc(T("bilinmiyor"))}</i>` : esc(x));
  const vrs = (ad) => (Object.prototype.hasOwnProperty.call(vars, ad)
    ? ` <span class="etiket">${esc(DIL === "tr" ? "varsayılan" : "default")}</span>` : "");

  let h = `<a class="geri" href="#">${esc(T("geri"))}</a>
  <div class="vaka-bas">
    <div><h1>${esc(v.baslik || v.__dosya)}</h1>
      ${v.aciklama ? `<p class="aciklama buyuk">${esc(v.aciklama)}</p>` : ""}
      <div class="etiketler">${(v.etiketler || []).map((e) => `<span class="etiket">${esc(e)}</span>`).join("")}</div>
      <div class="kart-ayak"><span>${esc(T("yazar"))}: <b>${esc((v.yazar || {}).ad || "—")}</b>${(v.yazar || {}).kurum ? " · " + esc(v.yazar.kurum) : ""}</span>
        <span>${esc(String(v.guncelleme || "").replace("T", " ").slice(0, 16))}</span></div>
    </div>
    <div class="buyuk-rozet ${ROZET_SINIF(t.risk_seviyesi)}">${esc(t.risk_seviyesi || "—")}</div>
  </div>

  <div class="olcu-serit">
    <div><span>${esc(T("ihtimal"))}</span><b>%${esc(pct(t.yanma_ihtimali, 0))}</b><i>± ${esc(pct(t.belirsizlik, 0))}</i></div>
    <div><span>${esc(T("sonme"))}</span><b>${t.sonme_siniri == null ? esc(T("bulunamadi")) : "%" + esc(nf(t.sonme_siniri, 1))}</b></div>
    <div><span>${esc(T("guvenlik"))}</span><b class="${t.guvenlik_katsayisi != null && t.guvenlik_katsayisi < 1 ? "kotu" : "iyi"}">${t.guvenlik_katsayisi == null ? esc(T("hesaplanamadi")) : esc(nf(t.guvenlik_katsayisi, 2))}</b></div>
    <div><span>${esc(T("guven"))}</span><b>${esc(nf(gv.skor, 0))}<small>/100</small></b></div>
  </div>

  <div class="ikili">
    <div class="kutu"><h3>${esc(T("girdiler"))}</h3><table class="veri">
      ${satir(T("malzeme"), `<b>${bos(g.malzeme)}</b>`)}
      ${satir(T("yercekimi"), esc(gMetni(g.g)))}
      ${satir(T("oksijen"), g.oksijen == null ? bos(null) : "%" + esc(nf(g.oksijen, 2)))}
      ${satir(T("basinc"), g.basinc == null ? bos(null) : esc(nf(g.basinc, 1)) + " kPa")}
      ${satir(T("akis"), g.akis == null
        ? `<i class="sonuk">${esc(T("bilinmiyor"))}</i> <span class="etiket">${esc(DIL === "tr" ? "en kötü durum" : "worst case")}</span>`
        : esc(nf(g.akis, 1)) + " cm/s")}
      ${satir(T("kalinlik"), (g.kalinlik == null ? bos(null) : esc(nf(g.kalinlik, 2)) + " mm") + vrs("kalinlik"))}
      ${satir(T("numune"), bos(g.numune_tipi) + vrs("numune_tipi"))}
      ${satir(T("yakit"), bos(g.yakit_turu) + vrs("yakit_turu"))}
      ${satir(T("seyreltici"), bos(g.seyreltici))}
    </table></div>
    <div class="kutu"><h3>${esc(T("uyarilar"))}</h3>
      ${(t.uyarilar || []).length ? t.uyarilar.map((u) => `<div class="uyari">${esc(u)}</div>`).join("")
        : `<p class="sonuk">${esc(DIL === "tr" ? "Uyarı yok." : "No warnings.")}</p>`}
      <h3 style="margin-top:18px">${esc(T("motor"))}</h3>
      <table class="veri">
        ${satir(DIL === "tr" ? "Motor türü" : "Engine type", bos(t.motor_turu))}
        ${satir(T("ihtimal"), t.motor && t.motor.yanma != null ? "%" + esc(pct(t.motor.yanma, 0)) : esc(T("yok")))}
        ${satir(T("sonme"), t.motor && t.motor.min_oksijen != null ? "%" + esc(nf(t.motor.min_oksijen, 2)) : esc(T("yok")))}
      </table>
    </div>
  </div>`;

  const s = v.sonuc || {};
  if (s.oksijen_egrisi) {
    h += `<div class="kutu"><h3>${esc(T("oksijenEgrisi"))}</h3>${oksijenCiz(s.oksijen_egrisi, { yakin: s.yakin, ortam: [g.oksijen] })}</div>`;
  }
  if (s.harita) {
    h += `<div class="kutu"><h3>${esc(T("harita"))}</h3>${haritaCiz(s.harita, g)}</div>`;
  }
  if (v.supurme && (v.supurme.noktalar || []).length) {
    const birim = { oksijen: "%", basinc: "kPa", g: "g", akis: "cm/s", kalinlik: "mm" }[v.supurme.parametre] || "";
    h += `<div class="kutu"><h3>${esc(T("supurme"))}</h3>${supurmeCiz(v.supurme, { etiket: v.supurme.parametre, birim, mevcut: g[v.supurme.parametre] })}</div>`;
  }
  if (v.llm_yorum) {
    h += `<div class="kutu"><h3>${esc(T("llm"))}</h3><pre class="llm">${esc(v.llm_yorum)}</pre></div>`;
  }

  h += `<div class="kutu"><h3>${esc(T("yorumlar"))}</h3>
    ${(v.yorumlar || []).length ? v.yorumlar.map((y) =>
      `<div class="yorum"><div class="yorum-ust"><b>${esc(y.yazar || "—")}</b><span>${esc(String(y.zaman || "").replace("T", " ").slice(0, 16))}</span></div>
       <div class="yorum-metin">${esc(y.metin)}</div></div>`).join("")
      : `<p class="sonuk">${esc(T("yorumYok"))}</p>`}</div>

  <div class="kutu vurgulu"><h3>${esc(T("nasil"))}</h3>
    <p>${esc(T("nasilAlt"))}</p>
    <div class="dugmeler">
      <a class="dugme birincil" href="${esc(v.__ham)}" download="${esc(v.__dosya)}">${esc(T("indir"))}</a>
      <a class="dugme" href="${esc(v.__github)}" target="_blank" rel="noopener">${esc(T("githubAc"))}</a>
    </div></div>`;

  el("vaka").innerHTML = h;
}

/* ---------------------------------------------------------------- yönlendirme */
function yonlendir() {
  const dosya = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  const v = dosya && S.vakalar.find((x) => x.__dosya === dosya);
  if (v) {
    el("akis").hidden = true;
    el("vaka").hidden = false;
    vakaCiz(v);
    window.scrollTo(0, 0);
    document.title = (v.baslik || dosya) + " — AHUT FLARE";
  } else {
    el("vaka").hidden = true;
    el("akis").hidden = false;
    document.title = "AHUT FLARE — " + T("bas.baslik");
    if (S.vakalar.length) ciz();
  }
}

/* ---------------------------------------------------------------- açılış */
window.addEventListener("hashchange", yonlendir);
el("ara").addEventListener("input", ciz);
el("sirala").addEventListener("change", ciz);
el("dilDugme").addEventListener("click", () => {
  DIL = DIL === "tr" ? "en" : "tr";
  try { localStorage.setItem("flare.dil", DIL); } catch (e) {}
  dilUygula();
  yonlendir();
  if (!el("vaka").hidden) { const d = decodeURIComponent((location.hash || "").replace(/^#/, "")); const v = S.vakalar.find((x) => x.__dosya === d); if (v) vakaCiz(v); }
});

dilUygula();
vakalariYukle();
