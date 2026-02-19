# Hub Repo Tracker - Product Requirements Document

> **Version:** 1.7.0 | **Last Updated:** 2026-02-15

GitHub repolarini tek bir dashboard uzerinden takip etmeyi saglayan modern web uygulaması.

---

## İçindekiler

1. [Özellikler](#özellikler)
2. [Hızlı Başlangıç](#hızlı-başlangıç)
3. [Proje Yapısı](#proje-yapısı)
4. [API Endpoints](#api-endpoints)
5. [Database Şeması](#database-şeması)
6. [Environment Variables](#environment-variables)
7. [Özellik Planları](#özellik-planları)
   - [Versiyon Takibi](#1-versiyon-takibi--güncelleme-bildirimi)
   - [Browser-Native Tarama](#2-browser-native-proje-tarama)
   - [Local Path Özelliği](#3-local-folder-path-bağlama)
   - [Non-Git Proje Tarama](#4-non-git-proje-tarama-manifest-parsing)
   - [Cross-Platform Desteği](#5-cross-platform-desteği)
8. [Teknoloji Stack](#teknoloji-stack)

---

## Özellikler

| Özellik | Açıklama |
|---------|----------|
| **Repo Takibi** | Birden fazla GitHub reposunu merkezi olarak izleme |
| **Otomatik Sync** | Periyodik olarak commit ve release bilgilerini güncelleme |
| **Kategori Sistemi** | Custom kategoriler + Owner bazlı otomatik gruplama |
| **Not Alanı** | Her repo için kişisel notlar |
| **URL Preview** | GitHub URL yapıştırınca otomatik metadata çekme |
| **Versiyon Takibi** | Yeni release/tag bildirimleri ve "Güncelledim" sistemi |
| **Import from Folder** | Lokal klasörlerden toplu repo import |
| **Dark Theme** | Modern ve göz yormayan arayüz |
| **Cross-Platform** | Windows, Linux ve macOS native desteği |

---

## Hızlı Başlangıç

### Docker ile (Önerilen)

```bash
# 1. .env dosyası oluştur
cp .env.example .env

# 2. GitHub token ekle (.env dosyasına)
GITHUB_TOKEN=ghp_your_token_here

# 3. Container'ları başlat
docker-compose up -d --build

# Durdur
docker-compose down

# Yeniden başlat
docker-compose restart

# 4. Tarayıcıda aç
# http://localhost:3750
```

### Development (Yerel)

Artık projenin kök dizininden tüm sistemi tek komutla yönetebilirsiniz:

```bash
# 1. Tüm bağımlılıkları tek seferde kurun
npm run install:all

# 2. Hem backend hem frontend'i aynı anda başlatın
npm run dev

# Uygulama: http://localhost:3750
# Backend API: http://localhost:3001
```

*Not: İsterseniz hala `cd backend` veya `cd frontend` yaparak manuel olarak da çalıştırabilirsiniz.*

---

## Proje Yapısı

```
├── docker-compose.yml      # Docker orchestration
├── .env                    # Environment değişkenleri
├── data/                   # SQLite veritabanı (volume)
│
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── app.ts          # Fastify entry point
│   │   ├── features/
│   │   │   ├── repos/      # Repo CRUD + Preview API
│   │   │   ├── categories/ # Kategori CRUD API
│   │   │   ├── sync/       # GitHub sync servisi
│   │   │   ├── import/     # Folder import servisi
│   │   │   └── dashboard/  # Dashboard API
│   │   └── shared/
│   │       ├── db/         # SQLite + Schema
│   │       ├── config/     # Konfigürasyon
│   │       └── utils/      # Semver, vb.
│   └── package.json
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   │   ├── Sidebar/    # Sol panel (kategori + owner)
    │   │   ├── RepoCard/    # Repo kartı + not alanı
    │   │   ├── AddRepoModal/# URL preview + kategori seçimi
    │   │   ├── ImportFromFolderModal/ # Klasör tarama
    │   │   ├── VersionDiffBadge/ # Versiyon karşılaştırma
    │   │   └── ...
    │   ├── hooks/
    │   │   ├── useRepos.ts
    │   │   ├── useCategories.ts
    │   │   └── useDirectoryScanner.ts
    │   ├── utils/
    │   │   ├── git-config-parser.ts
    │   │   └── manifest-parser.ts
    │   └── services/
    │       └── api.ts
    └── package.json
```

---

## API Endpoints

### Repos

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/repos` | Tüm repoları listele |
| GET | `/api/repos?category=:id` | Kategoriye göre filtrele |
| POST | `/api/repos` | Yeni repo ekle |
| POST | `/api/repos/preview` | GitHub URL'den önizleme |
| POST | `/api/repos/:id/acknowledge` | Versiyon güncellemesini onayla |
| PATCH | `/api/repos/:id` | Not/kategori/local_path güncelle |
| DELETE | `/api/repos/:id` | Repo sil |
| PATCH | `/api/repos/:id/favorite` | Favori toggle |

### Categories

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/categories` | Tüm kategorileri listele |
| POST | `/api/categories` | Yeni kategori oluştur |
| PUT | `/api/categories/:id` | Kategori güncelle |
| DELETE | `/api/categories/:id` | Kategori sil |

### Import & Sync

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/sync` | Tüm repoları sync et |
| GET | `/api/owners` | Owner listesi (gruplama için) |
| GET | `/api/dashboard` | Dashboard istatistikleri |
| GET | `/health` | Health check |

---

## Database Şeması

```sql
-- Kategoriler
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'custom',  -- 'custom' veya 'owner'
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  owner_name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Repolar
CREATE TABLE repos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id TEXT UNIQUE,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  description TEXT,
  notes TEXT,                    -- Kişisel notlar
  category_id INTEGER,           -- Kategori referansı
  local_path TEXT,               -- Lokal klasör yolu (v1.5+)
  installed_version TEXT,        -- Kurulu versiyon (v1.5+)
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Sync durumu
CREATE TABLE sync_state (
  repo_id INTEGER PRIMARY KEY,
  last_commit_sha TEXT,
  last_commit_date TEXT,
  last_commit_message TEXT,
  last_commit_author TEXT,
  last_release_tag TEXT,
  last_release_date TEXT,
  last_release_notes TEXT,
  last_tag TEXT,                      -- Git tag (Tier 2)
  last_tag_date TEXT,
  acknowledged_release TEXT,          -- Kullanıcının onayladığı versiyon
  release_notification_active INTEGER DEFAULT 0,
  last_sync_at TEXT,
  has_updates INTEGER DEFAULT 0,
  FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE
);

-- Versiyon geçmişi
CREATE TABLE version_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id INTEGER NOT NULL,
  version_type TEXT NOT NULL,        -- 'release' | 'tag' | 'commit'
  version_value TEXT NOT NULL,       -- 'v3.0.0' veya commit SHA
  release_notes TEXT,
  detected_at TEXT DEFAULT (datetime('now')),
  acknowledged_at TEXT,              -- Kullanıcının gördüğü tarih
  FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE
);

CREATE INDEX idx_version_history_repo ON version_history(repo_id);
```

---

## Environment Variables

| Değişken | Zorunlu | Varsayılan | Açıklama |
|----------|---------|------------|----------|
| `GITHUB_TOKEN` | ✅ | - | GitHub Personal Access Token |
| `SYNC_INTERVAL_MINUTES` | ❌ | 30 | Otomatik sync aralığı |
| `PORT` | ❌ | 3750 | Uygulama port (Docker & Frontend) |
| `BACKEND_PORT` | ❌ | 3001 | Backend port (dev mode) |
| `NODE_ENV` | ❌ | development | Environment |
| `DATABASE_PATH` | ❌ | ./data/repos.db | SQLite dosya yolu |

### GitHub Token Alma

1. GitHub.com → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. "Generate new token"
4. `public_repo` yetkisi yeterli (private repo için `repo`)
5. Token'ı `.env` dosyasına ekle

---

## Özellik Planları

### 1. Versiyon Takibi & Güncelleme Bildirimi

#### Context

Hub Repo Tracker şu anda GitHub'daki "son aktiviteyi" takip ediyor (`has_updates`), ancak kullanıcıya **"yeni versiyon çıktı!"** şeklinde anlamlı bir güncelleme bildirimi sunmuyor.

**Hedef:** Kullanıcı bir repoyu takibe aldığında, o reponun yeni release/tag çıkıp çıkmadığını otomatik takip et. Bildirim kullanıcı "Güncelledim" diyene kadar kaybolmasın.

**Prensip:** Açık kaynak proje → Sıfır konfigürasyon, sıfır friction.

#### Architecture: "Acknowledged Release" System

```
Repo eklenir → Sistem şu anki son release'i "baseline" olarak kaydeder
     │
Sync çalışır → GitHub'dan yeni release/tag bilgisi gelir
     │
Yeni release ≠ baseline → 🎉 "Yeni Release: v3.1.0!" badge göster
     │
Kullanıcı "Güncelledim" butonu → baseline güncellenir, badge kapanır
Aksi halde → Badge KALICI, asla otomatik kapanmaz
```

#### 3-Tier Versiyon Tespiti

| Tier | Kaynak | Kullanım | Güvenilirlik |
|------|--------|----------|--------------|
| 1 | **GitHub Releases** | `octokit.repos.getLatestRelease()` | ⭐⭐⭐ En güvenilir |
| 2 | **Git Tags** | `octokit.repos.listTags()` (ilk tag) | ⭐⭐ İyi |
| 3 | **Son Commit** | Mevcut `last_commit_sha` | ⭐ Aktivite göstergesi |

**Öncelik:** Release varsa onu göster, yoksa tag'e bak, o da yoksa commit aktivitesi göster.

#### Bildirim Kalıcılığı (Kritik Kural)

> **Güncelleme bildirimi asla otomatik kapanmaz.** Yeni bir sync geldiğinde bile mevcut bildirim kalır. Sadece kullanıcının bilinçli "Güncelledim" aksiyonu ile kapanır.

**Senaryo:**

1. Baseline: `v2.0.0` → Yeni release: `v3.0.0` → Badge: "🎉 v3.0.0!"
2. Bir sonraki sync → `v3.1.0` çıkmış → Badge güncellenir: "🎉 v3.1.0!"
3. Kullanıcı hiçbir şey yapmazsa → Badge **kalır**
4. Kullanıcı "Güncelledim" → baseline = `v3.1.0`, badge kapanır

#### Status

| Phase | Açıklama | Durum |
|-------|----------|-------|
| MVP | Acknowledged Release sistemi | ✅ TAMAMLANDI |
| MVP | Release + Tag takibi (3-tier) | ✅ TAMAMLANDI |
| MVP | Kalıcı badge + "Updated" butonu | ✅ TAMAMLANDI |
| MVP | Release notes tooltip | ✅ TAMAMLANDI |
| MVP | version_history tablosu | ✅ TAMAMLANDI |
| v1.5 | `installed_version` alanı | ✅ TAMAMLANDI |
| v1.5 | Import from Folder | ✅ TAMAMLANDI |
| v1.5 | Semver karşılaştırma | ✅ TAMAMLANDI |
| v2 | CLI scanner | ⏳ İLERIDE |
| v2 | Dependency file import | ⏳ İLERIDE |
| v2 | Email/webhook bildirimleri | ⏳ İLERIDE |

#### Implementation Files

| File | Durum |
|------|-------|
| `backend/src/shared/db/index.ts` | ✅ Migration + version_history |
| `backend/src/features/sync/github-client.ts` | ✅ `getLatestTag()` |
| `backend/src/features/sync/service.ts` | ✅ `detectVersionUpdate()` |
| `backend/src/features/repos/types.ts` | ✅ TagInfo, VersionInfo types |
| `backend/src/features/repos/repository.ts` | ✅ `acknowledgeUpdates()` |
| `backend/src/features/repos/routes.ts` | ✅ `POST /acknowledge` |
| `backend/src/shared/utils/semver.ts` | ✅ Semver comparison |
| `frontend/src/types/index.ts` | ✅ VersionInfo type |
| `frontend/src/services/api.ts` | ✅ `acknowledgeUpdate()` |
| `frontend/src/components/RepoCard/RepoCard.tsx` | ✅ Version badge |
| `frontend/src/components/VersionDiffBadge/` | ✅ Version diff display |

---

### 2. Browser-Native Proje Tarama

#### Context

Uygulama Docker container içinde çalışıyor. Bu durum backend ile host makinenin filesystem'i arasında izolasyon yaratıyor.

**Problem:**

- **Sınırlı Erişim:** Backend sadece Docker volume olarak mount edilen dizinlere erişebilir
- **User Friction:** Kullanıcılar projelerini farklı lokasyonlarda tutuyor (C:\, D:\, Belgeler vb.)
- **Silent Failures:** Taranamayan klasörler için hata yerine boş sonuç dönüyor

#### Solution: Frontend-First Scanning

Browser'ın **File System Access API**'sini kullanarak taramayı frontend'de yapıyoruz.

**Nasıl Çalışır:**

1. **User Trigger:** Kullanıcı "Select Folder" butonuna tıklar
2. **Native API:** Browser `window.showDirectoryPicker()` ile klasör seçimi gösterir
3. **Client-Side Parsing:**
   - Frontend seçilen dizini recursive olarak tarar
   - `.git/config` ve manifest dosyalarını (`package.json`, vb.) arar
   - Dosyaları browser'da okuyarak metadata çıkarır
4. **Import:** Sadece çıkarılan metadata (GitHub URL) backend'e gönderilir

**Benefits:**

| Özellik | Açıklama |
|---------|----------|
| **Zero Config** | Docker compose değişikliği gerektirmez |
| **Unlimited Access** | Herhangi bir sürücü veya network share taranabilir |
| **Privacy** | Dosya içerikleri browser'da işlenir, sadece URL backend'e gider |

**Technical Implementation:**

- **API:** `FileSystemDirectoryHandle` ve `FileSystemFileHandle`
- **Parsing:** Git config parsing `frontend/src/utils/git-config-parser.ts`
- **Fallback:** Eski browserlar için graceful degradation

**Status:** ✅ TAMAMLANDI

---

### 3. Local Folder Path Bağlama

#### Goal

Her repository için spesifik bir lokal klasör yolu ilişkilendirmek. Böylece kullanıcının proje nerede duruyor görebilir.

#### Notes

> ⚠️ Klasör seçimi her seferinde browser permission prompt gerektirir (güvenlik nedeniyle). Path string kaydetmek için tek seferlik seçim yeterlidir.
>
> ⚠️ "System Folder" uyarısı browser güvenlik özelliğidir. Kullanıcılar spesifik alt klasörler seçmelidir (ör: `Users/Name` yerine `Documents`).

#### Implementation

**Database:**

- `repos` tablosuna `local_path` kolonu eklendi (TEXT, nullable)

**Backend:**

| File | Değişiklik |
|------|------------|
| `schema.ts` | `createRepo` ve `updateRepo` schema'larına `local_path` |
| `types.ts` | `Repo` interface'ine `local_path` |
| `repository.ts` | `create` ve `update` methodlarına `local_path` |

**Frontend:**

| File | Değişiklik |
|------|------------|
| `types/index.ts` | `Repo` interface'ine `local_path` |
| `AddRepoModal.tsx` | "Select Local Folder" butonu |
| `RepoCard.tsx` | `local_path` görüntüleme ve düzenleme |
| `ImportFromFolderModal.tsx` | Taranan path'i `local_path` olarak kaydet |

**Status:** ✅ TAMAMLANDI

---

### 4. Non-Git Proje Tarama (Manifest Parsing)

#### Overview

Hub Repo Tracker varsayılan olarak `.git` dizini ve `config` dosyası arar. Bu sınırlama şu projeleri dışlar:

1. ZIP olarak indirilip extract edilen projeler
2. `npx create-next-app` gibi araçlarla oluşturulan projeler
3. Git history olmadan lokal kopyalar

**Çözüm:** Manifest Parsing - Konfigürasyon dosyalarından proje kimliğini ve GitHub URL'sini çıkarma.

#### Supported Manifest Files

| Dil/Platform | Dosya | Parsing Stratejisi | Öncelik |
|--------------|-------|-------------------|---------|
| **Node.js** | `package.json` | `repository` field (string veya object) | 1 |
| **Go** | `go.mod` | `module` directive (github.com/ ön eki) | 2 |
| **Rust** | `Cargo.toml` | `[package] repository` field | 3 |
| **Python** | `pyproject.toml` | `[tool.poetry] repository` veya `[project.urls]` | 4 |

#### Parsing Examples

**Node.js (`package.json`):**

```json
// Case A: Full URL
"repository": "https://github.com/owner/repo.git"

// Case B: Shorthand
"repository": "owner/repo"

// Case C: Object
"repository": {
  "type": "git",
  "url": "git+https://github.com/owner/repo.git"
}
```

**Go (`go.mod`):**

```go
module github.com/owner/repo/v2
```

#### Integration Flow

```
1. Try Git: .git/config var mı?
   ├─ Success → Git URL kullan
   └─ Fail → Adım 2

2. Try Manifests:
   ├─ package.json var mı? → Parse et
   ├─ go.mod var mı? → Parse et
   ├─ Cargo.toml var mı? → Parse et
   └─ pyproject.toml var mı? → Parse et

3. Fail → "Unknown Project" olarak işaretle
```

#### User Experience

- `.git` ile tespit edilen projeler → Git ikonu
- `package.json` ile tespit edilen → Node ikonu + "Manifest" badge
- Bulunan URL kullanıcıya onay için gösterilir

#### Future Expansion

| Dil | Dosya | Zorluk |
|-----|-------|--------|
| PHP | `composer.json` | Kolay |
| Java | `pom.xml` / `build.gradle` | Zor (XML/DSL) |
| C# | `.csproj` | Zor (XML) |

**Status:** ✅ TAMAMLANDI

---

### 5. Cross-Platform Desteği

#### Overview

Hub Repo Tracker Windows, Linux ve macOS'ta native olarak çalışır. Docker ise tüm platformlarda tutarlı bir deneyim sunar.

#### Platform Matrix

| Platform | Native Support | Docker Support | Requirements |
|----------|----------------|----------------|--------------|
| **Windows** | ✅ Out of box | ✅ | - |
| **Linux** | ✅ | ✅ | `build-essential`, `python3` |
| **macOS Intel** | ✅ | ✅ | Xcode CLI Tools |
| **macOS ARM (M1/M2/M3)** | ✅ | ✅ | Xcode CLI Tools |

#### Native Module Handling

`better-sqlite3` native modülü için otomatik hata yakalama ve rebuild mekanizması:

```json
// package.json
"scripts": {
  "postinstall": "native module kontrolü",
  "rebuild:native": "npm rebuild better-sqlite3"
}
```

**Akış:**

1. `npm install` çalışır
2. `postinstall` hook native modülü kontrol eder
3. Eğer yüklenemezse kullanıcıyı bilgilendirir
4. Kullanıcı `npm run rebuild:native` ile düzeltebilir

#### Linux Prerequisites

```bash
# Debian/Ubuntu
sudo apt-get install build-essential python3

# Fedora/RHEL
sudo dnf install gcc-c++ make python3

# Arch Linux
sudo pacman -S base-devel python
```

#### macOS Prerequisites

```bash
# Xcode Command Line Tools
xcode-select --install
```

#### Implementation Files

| File | Değişiklik |
|------|------------|
| `backend/package.json` | `postinstall` ve `rebuild:native` scriptleri |
| `backend/.env.example` | Platform-agnostic yorumlar |
| `docs/INSTALLATION.md` | Platform-specific kurulum rehberi |

#### Status

| Görev | Durum |
|-------|-------|
| Linux native module handling | ✅ TAMAMLANDI |
| macOS native module handling | ✅ TAMAMLANDI |
| Platform-specific docs | ✅ TAMAMLANDI |
| Docker (all platforms) | ✅ Zaten çalışıyor |

---

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Backend | Fastify 5 + TypeScript |
| Frontend | React 18 + Vite + TailwindCSS + shadcn/ui |
| Database | SQLite (better-sqlite3) |
| GitHub API | Octokit |
| Container | Docker + Nginx |
| Scheduled Jobs | node-cron |

---

## Ekran Görünümü

```
┌─────────────────────────────────────────────────────────┐
│ Header (Logo + Sync + Add Repo)                         │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│   Sidebar    │         Main Content                     │
│   (240px)    │                                          │
│              │   ┌────────────┐ ┌────────────┐          │
│  Categories  │   │ RepoCard   │ │ RepoCard   │          │
│  ├ All       │   │ ┌────────┐ │ │            │          │
│  ├ Docker    │   │ │Badge   │ │ │ [Category] │          │
│  ├ AI/ML     │   │ ├────────┤ │ ├────────────┤          │
│  └ DevOps    │   │ │Info    │ │ │ Notes...   │          │
│              │   │ ├────────┤ │ └────────────┘          │
│  By Owner    │   │ │Notes   │ │                          │
│  ├ facebook  │   │ └────────┘ │                          │
│  └ vercel    │   └────────────┘                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

---

## Versiyon Geçmişi

| Versiyon | Tarih | Değişiklikler |
|----------|-------|---------------|
| 1.7.0 | 2026-02-15 | Tek port (3750), yapılandırılabilir PORT değişkeni |
| 1.6.0 | 2026-02-15 | Linux & macOS native desteği, platform-specific docs |
| 1.5.0 | 2026-02-15 | Local path, manifest parsing, semver comparison |
| 1.2.0 | 2026-02-14 | Version tracking, acknowledged release sistemi |
| 1.1.0 | 2026-02-13 | Kategori sistemi, not alanı, URL preview, sidebar |
| 1.0.0 | 2026-02-13 | İlk release |

---

*Hub Repo Tracker - GitHub repolarinizi tek yerden yönetin.*
