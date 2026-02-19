# Hata Giderme: NPM Granular Access Token

Araştırmalarım gösteriyor ki NPM, Classic Token'ları kullanımdan kaldırıyor. Bu yüzden **Granular Access Token** oluşturmanız gerekiyor, ancak **kritik bir ayar** var.

## ✅ Doğru Granular Token Ayarı

1. **npm** > **Access Tokens** > **Generate New Token**.
2. **Permissions:** "Read and write" seçeneğini seçin.
3. **Packages:** "All packages" (veya ilgili paket) seçin.
4. **Security (ÇOK ÖNEMLİ):** Sayfanın altlarında **"Bypass two-factor authentication (2FA)"** veya **"Automation"** onay kutusu olmalıdır.
    * CI/CD süreçleri için **bu kutuyu mutlaka işaretlemelisiniz**.
    * Aksi takdirde robot, telefonunuza gelen kodu soramaz ve hata verir.

Yeni token'ı oluşturup GitHub'daki `NPM_TOKEN` secret'ını güncelleyin ve işlemi tekrar deneyin.
