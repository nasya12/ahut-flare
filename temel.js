"use strict";
/* AHUT FLARE — paylaşım sitesi: ortak yardımcılar.
   grafik.js uygulamadan olduğu gibi kopyalanır; onun ihtiyaç duyduğu
   DIL / nf / pct burada tanımlanır ki iki yerde iki kopya tutmayalım. */

let DIL = (function () {
  try {
    const k = localStorage.getItem("flare.dil");
    if (k) return k;
  } catch (e) {}
  return (navigator.language || "tr").slice(0, 2) === "tr" ? "tr" : "en";
})();

const yerel = () => (DIL === "tr" ? "tr-TR" : "en-US");
const nf = (x, d = 1) =>
  x == null || x === "" || Number.isNaN(Number(x)) ? "–" : Number(x).toLocaleString(yerel(), { maximumFractionDigits: d });
const pct = (x, d = 0) => (x == null ? "–" : nf(x * 100, d));

const METIN = {
  tr: {
    "bas.baslik": "Paylaşılan vakalar",
    "bas.alt": "Mikro yerçekiminde yangın güvenliği analizleri. Her kart, AHUT FLARE ile çözülmüş gerçek bir vakadır; dosyasını indirip kendi programında açabilirsin.",
    "sirala.yeni": "En yeni", "sirala.risk": "Riski en yüksek", "sirala.guven": "Güveni en yüksek",
    "ayak.uyari": "Sonuçlar model tahminidir; güvenlik payı eklenmemiştir ve resmî bir malzeme kabul belgesi yerine geçmez.",
    "yukleniyor": "Vakalar yükleniyor…",
    "bos": "Henüz paylaşılmış vaka yok.",
    "bosAlt": "AHUT FLARE uygulamasında bir vaka çözüp Paylaş düğmesine bastığında burada görünür.",
    "hata": "Vakalar yüklenemedi",
    "eslesmeYok": "Aramaya uyan vaka yok.",
    "geri": "← Bütün vakalar",
    "indir": "Vaka dosyasını indir (.ahut)",
    "githubAc": "GitHub'da aç",
    "girdiler": "Girdiler", "sonuclar": "Sonuçlar", "uyarilar": "Uyarılar",
    "oksijenEgrisi": "Oksijen eğrisi", "harita": "Yanabilirlik haritası", "supurme": "Parametre süpürmesi",
    "yorumlar": "Yorumlar", "yorumYok": "Henüz yorum yok.",
    "yazar": "Paylaşan", "tarih": "Tarih", "yorum": "yorum",
    "risk": "Risk seviyesi", "ihtimal": "Yanma ihtimali", "sonme": "Sönme sınırı",
    "guvenlik": "Güvenlik katsayısı", "guven": "Güven skoru", "motor": "Fizik motoru",
    "malzeme": "Malzeme", "yercekimi": "Yerçekimi", "oksijen": "Oksijen", "basinc": "Basınç",
    "akis": "Hava akışı", "kalinlik": "Kalınlık", "numune": "Numune tipi", "yakit": "Yakıt türü",
    "seyreltici": "Ortam gazı", "bilinmiyor": "bilinmiyor", "yok": "yok",
    "hesaplanamadi": "hesaplanamadı", "bulunamadi": "bulunamadı",
    "llm": "Yapay zeka yorumu", "nasil": "Bu vakayı kendi bilgisayarında aç",
    "nasilAlt": "Dosyayı indir, AHUT FLARE'de Dosya → İçe Aktar de. Bütün grafikler ve ham sonuçlar dosyanın içinde.",
  },
  en: {
    "bas.baslik": "Shared cases",
    "bas.alt": "Fire safety analyses in microgravity. Each card is a real case solved with AHUT FLARE; download the file and open it in your own copy.",
    "sirala.yeni": "Newest", "sirala.risk": "Highest risk", "sirala.guven": "Highest confidence",
    "ayak.uyari": "Results are model estimates; no safety margin is applied and they do not replace a formal material acceptance certificate.",
    "yukleniyor": "Loading cases…",
    "bos": "No cases shared yet.",
    "bosAlt": "Solve a case in AHUT FLARE and press Share — it will appear here.",
    "hata": "Could not load the cases",
    "eslesmeYok": "No case matches the search.",
    "geri": "← All cases",
    "indir": "Download case file (.ahut)",
    "githubAc": "Open on GitHub",
    "girdiler": "Inputs", "sonuclar": "Results", "uyarilar": "Warnings",
    "oksijenEgrisi": "Oxygen curve", "harita": "Flammability map", "supurme": "Parameter sweep",
    "yorumlar": "Comments", "yorumYok": "No comments yet.",
    "yazar": "Shared by", "tarih": "Date", "yorum": "comments",
    "risk": "Risk level", "ihtimal": "Burning probability", "sonme": "Extinction limit",
    "guvenlik": "Safety factor", "guven": "Confidence score", "motor": "Physics engine",
    "malzeme": "Material", "yercekimi": "Gravity", "oksijen": "Oxygen", "basinc": "Pressure",
    "akis": "Air flow", "kalinlik": "Thickness", "numune": "Sample type", "yakit": "Fuel type",
    "seyreltici": "Diluent gas", "bilinmiyor": "unknown", "yok": "none",
    "hesaplanamadi": "not computable", "bulunamadi": "not found",
    "llm": "AI commentary", "nasil": "Open this case on your own computer",
    "nasilAlt": "Download the file and choose File → Import in AHUT FLARE. Every chart and the raw result travel inside the file.",
  },
};

const T = (a) => (METIN[DIL] && METIN[DIL][a]) || METIN.tr[a] || a;

function dilUygula() {
  document.documentElement.lang = DIL;
  document.querySelectorAll("[data-d]").forEach((e) => (e.textContent = T(e.dataset.d)));
  const d = document.getElementById("dilDugme");
  if (d) d.textContent = DIL === "tr" ? "EN" : "TR";
}
