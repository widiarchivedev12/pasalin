# PRD: Pasalin

*Tanya aturan, dapat pasalnya.* | Versi 1.0 | Oktober 2026 | Status: Draft MVP

## 1. Brand

**Nama:** Pasalin

**Arti nama:** Gabungan kata "pasal" dan akhiran "-in" yang akrab dalam bahasa sehari-hari (seperti "cariin", "bantuin"). Kesannya: "tolong carikan pasalnya". Mudah diingat, mudah diucapkan, dan tidak terkesan kaku seperti produk hukum pada umumnya.

**Tagline:** Tanya aturan, dapat pasalnya.

**Alternatif nama jika ingin pilihan lain:** TanyaPasal, Rujuk, Lexa.

**Karakter brand:** Tepercaya, jelas, ramah, tidak menggurui. Bahasa Indonesia yang santai tapi tetap sopan dan akurat.

**Arah visual:** Warna utama biru tua (kepercayaan) dengan aksen kuning hangat (keramahan). Tipografi sans-serif yang bersih. Ikon utama berupa gelembung chat dengan simbol "§".

## 2. Ringkasan Produk

Pasalin adalah aplikasi web berbasis AI yang menjawab pertanyaan tentang peraturan Indonesia (UU, Perda, peraturan kampus) berdasarkan dokumen resmi yang telah diunggah, lengkap dengan sitasi pasal dan kutipan teks aslinya. Pasalin memakai teknik Retrieval-Augmented Generation (RAG) agar jawaban selalu berpijak pada sumber, bukan pada ingatan model.

## 3. Latar Belakang dan Masalah

- Peraturan perundang-undangan panjang, berbahasa formal, dan tersebar di banyak sumber, sehingga sulit dipahami orang awam.
- Mahasiswa sering bingung dengan isi buku pedoman akademik kampus yang puluhan hingga ratusan halaman.
- Chatbot AI umum rentan mengarang nomor pasal (halusinasi), yang berbahaya di domain hukum.
- Mencari pasal spesifik lewat pencarian kata kunci di PDF lambat dan tidak memahami maksud pertanyaan.

## 4. Tujuan dan Non-Tujuan

**Tujuan**

1. Menjawab pertanyaan peraturan dalam bahasa sederhana dengan sitasi pasal yang bisa diverifikasi.
2. Meminimalkan halusinasi: jika tidak ada di sumber, sistem menyatakan tidak ditemukan.
3. Respons terasa cepat berkat streaming.
4. Menjadi project portfolio yang menunjukkan kemampuan RAG, evaluasi kualitas, dan desain produk.

**Non-tujuan (di luar cakupan MVP)**

- Memberikan nasihat hukum resmi atau menggantikan advokat.
- Menganalisis kasus hukum atau memprediksi putusan pengadilan.
- Mendukung putusan pengadilan, yurisprudensi, atau kontrak pribadi.
- Aplikasi mobile native.

## 5. Target Pengguna

| Persona | Kebutuhan | Contoh pertanyaan |
| --- | --- | --- |
| Mahasiswa | Memahami aturan akademik kampus | "Berapa batas maksimal cuti akademik?" |
| Pelaku UMKM / freelancer | Memahami aturan dasar usaha dan data pribadi | "Apa kewajiban pelaku usaha menurut UU Perlindungan Konsumen?" |
| Warga umum | Mengetahui hak dan kewajiban dasar | "Apa sanksi pencemaran nama baik di UU ITE?" |
| Admin / kontributor | Mengelola dokumen sumber | Mengunggah dan memperbarui peraturan |

**Persona utama MVP:** Mahasiswa dan warga umum.

## 6. Cakupan Dokumen (MVP)

- 2 sampai 3 peraturan awal, misalnya UU ITE dan satu peraturan akademik kampus.
- Hanya PDF dengan teks yang bisa diseleksi (bukan hasil scan).
- Sumber disarankan dari JDIH, peraturan.go.id, atau situs resmi kampus.

## 7. Fitur

### 7.1 Must Have (MVP)

| ID | Fitur | Deskripsi |
| --- | --- | --- |
| F1 | Chat tanya-jawab | Antarmuka chat dengan respons streaming dalam Bahasa Indonesia. |
| F2 | Retrieval per pasal | Dokumen dipecah per pasal, dicari berdasarkan kemiripan makna (vector search). |
| F3 | Sitasi | Setiap jawaban menampilkan kartu sumber: nama peraturan, bab, pasal, dan kutipan teks asli. |
| F4 | Penolakan aman | Jika konteks tidak relevan, bot menjawab bahwa informasi tidak ditemukan dan tidak mengarang. |
| F5 | Disclaimer | Pernyataan bahwa jawaban bukan nasihat hukum resmi, tampil permanen di UI. |
| F6 | Pipeline ingest | Script untuk mengubah PDF menjadi chunk pasal, embedding, dan menyimpannya ke database. |

### 7.2 Should Have

| ID | Fitur | Deskripsi |
| --- | --- | --- |
| F7 | Hybrid search | Gabungan vector search dan full-text search Postgres agar kata kunci seperti "Pasal 27" tertangkap. |
| F8 | Filter dokumen | User memilih peraturan tertentu sebelum bertanya. |
| F9 | Riwayat chat | Percakapan tersimpan per user (butuh login). |
| F10 | Umpan balik | Tombol jempol atas/bawah pada tiap jawaban untuk data evaluasi. |
| F11 | Rate limiting | Pembatasan request per pengguna/IP untuk mengendalikan biaya dan penyalahgunaan. |

### 7.3 Nice to Have

- Halaman admin untuk upload dokumen.
- Mode "bandingkan dua peraturan".
- Mode penjelasan sederhana ("jelaskan seperti ke anak SMA").
- Ekspor jawaban beserta sitasi ke PDF.
- Dukungan OCR untuk PDF hasil scan.

## 8. User Flow Utama

1. User membuka Pasalin dan membaca disclaimer singkat.
2. User memilih contoh pertanyaan atau mengetik pertanyaan sendiri.
3. Sistem mencari pasal paling relevan.
4. Jawaban muncul bertahap (streaming) dengan penanda sumber \[1\], \[2\].
5. Di bawah jawaban, kartu sitasi menampilkan pasal dan teks aslinya.
6. User dapat bertanya lanjutan atau memberi umpan balik.

## 9. Arsitektur Teknis

**Stack**

- Frontend dan backend: Next.js (App Router) + TypeScript
- Streaming dan hook chat: Vercel AI SDK (`ai`, `@ai-sdk/react`)
- LLM generasi: Groq (`@ai-sdk/groq`), model Llama yang tersedia saat pengerjaan (nama model disimpan di environment variable `MODEL_ID`)
- Embedding: Gemini atau OpenAI (Groq tidak menyediakan embedding); dimensi vektor mengikuti model yang dipilih
- Database: PostgreSQL + pgvector (Supabase atau Neon), ORM Drizzle atau Prisma
- Ekstraksi PDF: `unpdf` atau `pdf-parse`
- UI: Tailwind CSS + shadcn/ui
- Auth (fase 2): Auth.js
- Rate limiting: Upstash Redis
- Deploy: Vercel

**Alur data**

*Ingest (offline):* PDF → ekstraksi teks → pemotongan per pasal (regex) → pengayaan metadata → embedding → simpan di tabel `chunks`.

*Query (online):* Pertanyaan → embedding → pencarian top-k di pgvector (opsional digabung full-text) → penyusunan konteks → LLM Groq dengan system prompt ketat → streaming jawaban + sitasi ke UI.

**Skema data**

- `documents`: id, title, type (UU/Perda/Kampus), source\_url, created\_at
- `chunks`: id, document\_id, chapter, article, content, embedding, page
- `conversations` dan `messages` (fase 2): id, user\_id, role, content, citations, created\_at
- `feedback` (fase 2): id, message\_id, rating, comment

**Aturan chunking**

- Satu chunk = satu pasal. Pasal yang sangat panjang dipecah per ayat dengan metadata pasal yang sama.
- Metadata wajib: nama peraturan, bab, nomor pasal, halaman.

## 10. Desain Prompt dan Perilaku AI

- Peran: asisten yang menjelaskan isi peraturan dalam Bahasa Indonesia sederhana.
- Aturan keras: jawab hanya berdasarkan konteks yang diberikan; sebutkan sumber dengan format \[nomor\]; jika tidak ada, nyatakan tidak ditemukan; jangan mengarang pasal atau nomor.
- Nada: jelas, netral, tidak menghakimi, tanpa jargon berlebihan.
- Untuk pertanyaan di luar domain (misalnya kasus pribadi yang sangat spesifik), arahkan pengguna ke LBH atau konsultan hukum.

## 11. Kebutuhan Non-Fungsional

| Aspek | Target |
| --- | --- |
| Latensi token pertama | Di bawah 2 detik pada kondisi normal |
| Ketersediaan | Mengikuti SLA platform hosting (best effort untuk MVP) |
| Keamanan | API key hanya di server, tidak pernah di client; validasi input; rate limiting |
| Privasi | Tidak menyimpan data pribadi sensitif; jelaskan kebijakan penyimpanan riwayat chat |
| Aksesibilitas | Kontras warna memadai, navigasi keyboard, responsif di mobile |
| Biaya | Tetap dalam free tier selama pengembangan; pantau penggunaan token |

## 12. Metrik Keberhasilan

**Kualitas (utama, diukur lewat set uji 20 sampai 30 pertanyaan)**

- Retrieval hit rate: pasal yang benar masuk dalam top-5 hasil, target di atas 80%.
- Faithfulness: jawaban tidak mengandung pasal yang tidak ada di konteks, target 100% pada set uji.
- Penolakan benar: untuk pertanyaan di luar dokumen, bot menolak dengan benar, target di atas 90%.

**Produk**

- Persentase jawaban dengan umpan balik positif, target di atas 70%.
- Jumlah pertanyaan per sesi (indikator keterlibatan).

## 13. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Halusinasi pasal | Tinggi | Prompt ketat, tampilkan teks sumber asli, evaluasi rutin, penolakan aman |
| Peraturan sudah direvisi/dicabut | Tinggi | Simpan tanggal dokumen dan sumber, tampilkan status berlaku, jadwalkan pembaruan |
| PDF hasil scan atau format tidak konsisten | Sedang | Pilih sumber dengan teks bisa diseleksi; OCR di fase lanjut |
| Kualitas embedding Bahasa Indonesia kurang | Sedang | Uji beberapa model embedding, bandingkan hit rate |
| Pengguna menganggap jawaban sebagai nasihat hukum | Tinggi | Disclaimer permanen dan arahan ke profesional hukum |
| Rate limit atau perubahan model Groq | Sedang | Model di env variable, penanganan error ramah, rate limiting sendiri |
| Biaya membengkak setelah publik | Sedang | Batas request per user, caching jawaban umum |

## 14. Rencana Rilis

| Fase | Durasi | Isi |
| --- | --- | --- |
| 0. Persiapan | 2 hari | Pilih dokumen, setup repo, database, API key |
| 1. Ingest | 3 sampai 4 hari | Ekstraksi PDF, chunking per pasal, embedding, simpan ke pgvector |
| 2. Chat MVP | 3 sampai 4 hari | Endpoint chat, retrieval, streaming, kartu sitasi, disclaimer |
| 3. Evaluasi | 2 hari | Set uji 20 pertanyaan, ukur metrik, perbaiki chunking dan prompt |
| 4. Polesan dan rilis | 2 sampai 3 hari | UI, rate limiting, deploy, README dengan arsitektur dan hasil evaluasi |
| 5. Pengembangan lanjut | Berkelanjutan | Login, riwayat chat, hybrid search, halaman admin, filter dokumen |

Estimasi kasar total MVP: 2 sampai 3 minggu untuk pengembang tunggal paruh waktu.

## 15. Struktur Folder yang Disarankan

```
pasalin/
├── app/
│   ├── page.tsx
│   ├── api/chat/route.ts
│   └── components/ (ChatWindow, CitationCard, Disclaimer)
├── lib/
│   ├── db.ts
│   ├── embed.ts
│   ├── retrieve.ts
│   └── prompt.ts
├── scripts/
│   ├── ingest.ts
│   └── eval.ts
├── data/ (PDF sumber dan set uji)
├── drizzle/ atau prisma/
└── README.md
```

## 16. Pertanyaan Terbuka

1. Peraturan mana yang dipakai sebagai dokumen awal (UU ITE, peraturan akademik kampus, atau lainnya)?
2. Model embedding mana yang memberi hasil terbaik untuk Bahasa Indonesia pada set uji?
3. Apakah login diwajibkan sejak awal atau cukup akses anonim dengan rate limit?
4. Apakah proyek ini akan tetap sebagai portfolio atau dikembangkan menjadi produk yang dipakai kampus/komunitas?

## 17. Disclaimer Produk

Pasalin adalah alat bantu informasi dan bukan pengganti nasihat hukum profesional. Selalu rujuk teks peraturan resmi dan konsultasikan dengan advokat atau lembaga bantuan hukum untuk keputusan penting.
