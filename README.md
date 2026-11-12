# AHUT FLARE — paylaşılan vakalar

Bu depo, **AHUT FLARE** ile üretilmiş yangın riski analizlerinin paylaşıldığı yerdir.

- **Site:** yukarıdaki *Environments → github-pages* bağlantısı ya da `https://<kullanici>.github.io/<depo>/`
- **Vakalar:** [`vakalar/`](vakalar) klasöründeki `.ahut` dosyaları
- **Uygulama:** [AHUT FLARE](https://github.com/) — mikro yerçekiminde yangın güvenliği analiz ortamı

## Vaka dosyası nedir

Her `.ahut` dosyası düz JSON'dur ve kendi kendine yeterlidir: girdiler, model sonucu,
grafik verileri, yakın deneyler, yazar bilgisi ve yorumlar hep birlikte durur.
Dosyayı indirip AHUT FLARE'de **Dosya → İçe Aktar** ile açabilirsiniz.

```jsonc
{
  "bicim": "ahut-vaka", "bicim_surumu": 1,
  "baslik": "...", "aciklama": "...", "etiketler": ["..."],
  "yazar": { "ad": "...", "kurum": "..." },
  "girdi":  { "malzeme": "pmma", "oksijen": 21, "basinc": 101.3, "g": 1e-4 },
  "sonuc":  { "tahmin": { "risk_seviyesi": "...", "guvenlik_katsayisi": 0.79 } },
  "supurme": { "parametre": "oksijen", "noktalar": [ ... ] },
  "yorumlar": [ { "yazar": "...", "metin": "..." } ]
}
```

## Katkı

Kendi vakanızı paylaşmak için AHUT FLARE'de **Paylaş** düğmesini kullanın; uygulama
dosyayı doğrudan bu depoya ekler. Elle eklemek isterseniz `vakalar/` klasörüne
bir `.ahut` dosyası koymanız yeterlidir.

> Sonuçlar model tahminidir. Güvenlik payı eklenmemiştir ve resmî bir malzeme
> kabul belgesi (ör. NASA-STD-6001) yerine geçmez.

---

AHUT — Ankara Havacılık ve Uzay Teknolojileri Hackathon Takımı · NASA Space Apps Challenge 2026 · MIT
