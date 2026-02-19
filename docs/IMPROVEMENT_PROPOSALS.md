# Proje Geliştirme ve Bakım Önerileri (Maintenance & Improvement Proposals)

Bu döküman, Hub Repo Tracker projesinin güncelliğini, güvenliğini ve kod kalitesini artırmak için atılabilecek adımları ve uygulama rehberini içermektedir.

## 1. Bağımlılık Güncellemeleri (Dependency Updates)

Proje modern kütüphaneler kullansa da, bazı paketlerin güncellenmesi performans ve güvenlik açısından kritiktir.

### Backend Önerileri
- **Better-SQLite3:** Mevcut `v11.x` sürümü stabil ancak performans iyileştirmeleri için düzenli güncellenmeli.
- **TSX & Typescript:** Geliştirme ortamı hızı için en son sürümlere yükseltilmeli.

### Frontend Önerileri
- **React 19 Hazırlığı:** React 18'den 19'a geçiş için `ref` kullanımı ve "compiler" hazırlıkları gözden geçirilmeli.
- **Tailwind CSS v4:** Yakın zamanda çıkan v4 sürümüne geçiş, CSS dosya boyutunu azaltacaktır.

**Nasıl Yapılır?**
1. `npm outdated` ile durum tespiti.
2. `npm update` ile güvenli güncellemeler.
3. Breaking change riskine karşı her güncelleme sonrası manuel test.

---

## 2. Güvenlik Taraması (Security & Vulnerability)

Uygulama dış dünyaya açık bir dashboard olduğu için güvenlik en öncelikli konudur.

### Eylemler:
- **Audit Scan:** `npm audit` komutu ile bilinen güvenlik açıklarının taranması ve `npm audit fix` ile otomatik onarımı.
- **Secret Detection:** `.env` dosyasının yanlışlıkla commitlemesini önlemek için `git-secrets` veya `husky` ile commit öncesi kontrol eklenmesi.
- **GitHub Token Sınırlandırması:** Kullanılan token'ın sadece `public_repo` yetkisine sahip olduğundan emin olunması.

---

## 3. Test Altyapısı (Testing Infrastructure)

Projenin en büyük eksikliği otomatize testlerdir.

### Önerilen Kurulum:
- **Backend:** Node.js 22+ ile gelen yerleşik `node:test` veya `Vitest` kullanımı.
  - *Öncelik:* Sync servisinin ve veritabanı migrasyonlarının test edilmesi.
- **Frontend:** `Vitest` + `React Testing Library`.
  - *Öncelik:* `RepoCard` ve `useDirectoryScanner` hook'unun test edilmesi.
- **E2E:** `Playwright` ile "Repo Ekle -> Sync Et -> Onayla" akışının test edilmesi.

---

## 4. Kod Kalitesi ve Linting (Linting & Standards)

### Mevcut Lint Komutları

Proje hem backend hem frontend tarafında ESLint ile yapılandırılmıştır. Kod kalitesini korumak için aşağıdaki komutlar kullanılmalıdır:

#### Backend
```bash
cd backend

# Tüm dosyaları lint et
npm run lint

# Sadece belirli bir dosyayı kontrol et
npx eslint src/features/repos/routes.ts

# Otomatik düzeltilebilir hataları onar
npm run lint -- --fix
```

#### Frontend
```bash
cd frontend

# Tüm dosyaları lint et
npm run lint

# Sadece belirli bir dosyayı kontrol et
npx eslint src/components/RepoCard/RepoCard.tsx

# Otomatik düzeltilebilir hataları onar
npm run lint -- --fix
```

### Tip Kontrolü (TypeScript)

Lint'e ek olarak, TypeScript tip hatalarını yakalamak için typecheck komutları da çalıştırılmalıdır:

```bash
# Backend
cd backend && npm run typecheck

# Frontend
cd frontend && npx tsc --noEmit
```

### ESLint 9+ Flat Config Geçişi
- Mevcut ESLint yapılandırmasını modern "Flat Config" (`eslint.config.mjs`) formatına taşımak.
- Backend ve frontend için ayrı `eslint.config.mjs` dosyaları mevcuttur.
- **Prettier Entegrasyonu:** Kod stilini otomatize etmek için Prettier eklemek.

### CI/CD'de Lint Kullanımı

GitHub Actions workflow'larında lint kontrolü örneği:

```yaml
- name: Lint Backend
  run: cd backend && npm run lint

- name: Lint Frontend
  run: cd frontend && npm run lint

- name: TypeCheck Backend
  run: cd backend && npm run typecheck
```

### Yaygın Lint Hataları ve Çözümleri

| Hata | Açıklama | Çözüm |
|------|----------|-------|
| `@typescript-eslint/no-unused-vars` | Kullanılmayan değişken | Değişkeni kaldır veya `_` prefix'i ekle |
| `@typescript-eslint/no-explicit-any` | `any` tip kullanımı | Proper tip tanımla |
| `react-hooks/exhaustive-deps` | Eksik dependency | Dependency array'i güncelle |
| `no-console` | Console statement | Kaldır veya `// eslint-disable-next-line` ekle |

---

## 5. CI/CD Entegrasyonu (GitHub Actions)

Kodun her gönderildiğinde (push) otomatik olarak denetlenmesi gerekir.

### Önerilen `.github/workflows/main.yml`:
1. **Lint & Typecheck:** Kod hatalarını yakala.
2. **Security Scan:** Bağımlılıkları tara.
3. **Build:** Docker imajlarını build et.
4. **Auto-Deploy:** (Opsiyonel) Testler geçerse staging ortamına deploy et.

---

## 6. Gelecek Özellikler (Roadmap Extensions)

### NPX Desteği:
Kullanıcıların projeyi indirmeden `npx hub-repo-tracker` komutuyla çalıştırmasını sağlamak.
- *Gereksinim:* Backend'in frontend statik dosyalarını servis etmesi.

### Masaüstü Uygulaması (Electron):
Dashboard'u bir sistem tepsisi (tray) uygulaması olarak çalıştırmak, güncellemeleri anlık bildirimle (native notification) almak için harika bir ekleme olur.

---
*Bu döküman Maestro AI Agent tarafından projenin sağlıklı büyümesi için hazırlanmıştır.*
