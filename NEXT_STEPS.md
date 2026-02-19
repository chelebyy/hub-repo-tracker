# Sonraki Adımlar: Yayınlama Süreci

1.0.9 Sürümü için gerekli değişiklikler yapıldı ve etiket (`v1.0.9`) oluşturuldu.

Ancak, NPM paketinin otomatik yayınlanabilmesi için GitHub tarafında bir ayar yapılması gerekmektedir:

## ⚠️ ÖNEMLİ: NPM Token Ekleme

GitHub Actions'ın NPM'e paket yükleyebilmesi için **NPM_TOKEN** gizli anahtarına ihtiyacı vardır.

Lütfen şu adımları takip edin:

1. **NPM Token Oluşturun:**
    * npmjs.com adresine giriş yapın.
    * Profil > Access Tokens > Generate New Token (Classic) seçeneğine gidin.
    * Type olarak "Automation" seçin.
    * Oluşan tokenı kopyalayın.

2. **GitHub'a Ekleyin:**
    * Projenizin GitHub sayfasına gidin.
    * `Settings` > `Secrets and variables` > `Actions` menüsüne tıklayın.
    * `New repository secret` butonuna basın.
    * **Name:** `NPM_TOKEN`
    * **Value:** (Kopyaladığınız tokenı yapıştırın)
    * `Add secret` diyerek kaydedin.

3. **Yeniden Deneyin:**
    * Token eklendikten sonra, GitHub Actions'daki `Build & Quality Check` (veya `CI`) sekmesine gidin.
    * Başarısız olan son iş akışını (run) bulun ve `Re-run jobs` diyerek tekrar çalıştırın.
    * Veya yeni bir commit atıp tekrar deneyin.

**Not:** GitHub Release (v1.0.9) otomatik olarak oluşacaktır. Sadece NPM paketi için bu token gereklidir.
