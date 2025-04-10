# 🎮 Discord Gaming Bot

Bot Discord gaming dengan fitur gambling seru.

## ⚡ Fitur

### 💰 Economy
- `!daily` - Dapatkan 100 💎 setiap hari
- `!work` - Bekerja untuk mendapatkan 10-50 💎
- `!balance` - Cek saldo dan statistik
- `!leaderboard` - Lihat 10 pemain terkaya

### 🎲 Games
- `!coinflip <bet>` - Taruhan dengan koin (min: 10 💎, max: 1000 💎)
- `!slots <bet>` - Main slot machine (min: 20 💎, max: 2000 💎)
  - 3x 7️⃣ = 10x
  - 3x 💎 = 7x
  - 3 simbol sama = 5x
  - 2 simbol sama = 2x
- `!roulette <bet>` - Main roulette (min: 50 💎, max: 5000 💎)
  - Straight up (angka) = 35x
  - Red/Black = 2x
  - Even/Odd = 2x

## 🚀 Setup

1. Clone repository ini
2. Install dependencies:
```bash
npm install
```

3. Buat file `.env` dan isi dengan token bot Discord:
```env
DISCORD_TOKEN=your_discord_token_here
```

4. Jalankan bot:
```bash
npm run dev
```

## ⚙️ Konfigurasi

Semua pengaturan bot ada di `config.json`:
- Nama dan simbol mata uang
- Jumlah reward harian dan work
- Minimal dan maksimal bet untuk setiap game
- Multiplier untuk slot dan roulette

## 📊 Database

Bot menggunakan sistem file JSON sederhana untuk menyimpan data pemain:
- Saldo
- Statistik menang/kalah
- Waktu claim daily terakhir
- Total games dimainkan

## 🔒 Keamanan

- Rate limiting untuk mencegah spam
- Validasi input untuk semua command
- Sistem backup data otomatis