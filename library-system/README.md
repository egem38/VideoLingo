# Kutuphane Otomasyonu (Node.js + SQLite)

Bu klasor, SQLite kullanarak gelistirilmis gelismis bir kutuphane otomasyonu icermektedir. Kitaplar, uyeler ve islem kayitlari icin detayli alanlar bulunur.

## Calistirma

```bash
npm install
npm start
```

Sunucu calistiktan sonra kitap, kullanici ve odunc islemleri icin `/api/books`, `/api/users` ve `/api/borrow` adreslerini kullanabilirsiniz.

`POST /api/borrow` uzerinden okul numarasi ve ISBN gondererek kitap odunc alabilirsiniz. `PUT /api/borrow/:id/return` ile kitap iade edilir ve kitap adedi otomatik guncellenir.

### Excel Aktarim
- `/api/books/export` ve `/api/users/export` tum kayitlari Excel dosyasi olarak indirir.
- `/api/books/import` ve `/api/users/import` yollarina Excel dosyasi gondererek toplu veri ekleyebilirsiniz. Dosya gonderiminde `file` alanini kullanin.

### ISBN'den Bilgi Cekme
- `/api/books/fetch/:isbn` adresi verilen ISBN icin Google Books veya Open Library servislerinden kitap bilgilerini ceker.

### Kitap Alanlari
- `isbn`
- `baslik`
- `yazar`
- `yayinevi`
- `baski_yili`
- `sayfa_sayisi`
- `resim` (URL)
- `raf`
- `kategori`
- `mevcut`

### Uye Alanlari
- `ad`
- `soyad`
- `sinif`
- `sube`
- `okul_no`
- `email`
- `tel`
- `rol` (ogrenci/ogretmen)

### Islem Alanlari
- `okul_no`
- `isbn`
- `borrowDate`
- `dueDate`
- `returnDate`
  - `returnDate` (iade tarihi)
