# NPM Yayınlama Rehberi

Bu rehber, bir NPM hesabı oluşturmanıza ve `hub-repo-tracker` projesini NPM kütüphanesine yüklemenize yardımcı olacaktır.

## 1. NPM Hesabı Oluşturun

Eğer henüz bir NPM hesabınız yoksa:

1. [https://www.npmjs.com/signup](https://www.npmjs.com/signup) adresine gidin.
2. **Kullanıcı Adı (Username)**, **E-posta** ve **Şifre** alanlarını doldurun.
3. E-posta adresinize gelen doğrulama linkine tıklayın (Paket yayınlamak için bu şarttır).

## 2. Terminalden Giriş Yapın

Hesabınız oluşturulduktan ve doğrulandıktan sonra:

1. Proje ana dizininde bir terminal açın.
2. Giriş komutunu çalıştırın:

    ```bash
    npm login
    ```

3. Bu komut tarayıcınızı açarak giriş yapmanızı isteyecektir. Talimatları izleyin.
4. Giriş işleminin başarılı olduğunu doğrulamak için:

    ```bash
    npm whoami
    # Çıktı olarak kullanıcı adınızı görmelisiniz
    ```

## 3. Paketi Hazırlayın

Yayınlamadan önce `backend/package.json` dosyasının doğru olduğundan emin olun (Bunu sizin için zaten ayarladım!):

- `name`: "hub-repo-tracker" (Eğer bu isim alınmışsa değiştirmeniz gerekebilir)
- `version`: "1.0.0"
- `bin`: `./dist/app.js` dosyasını işaret etmeli
- `files`: `dist`, `README.md` ve `LICENSE` dosyalarını içermeli

**Önemli:** `package.json` dosyasının bulunduğu backend klasörüne geçiş yapın:

```bash
cd backend
```

*(Eğer daha önce `build` almadıysanız `npm run build:all` komutunu çalıştırın)*

## 4. NPM'e Yayınlayın

Yayınlama komutunu çalıştırın:

```bash
npm publish --access public
```

- `--access public`: Paketiniz "scoped" (örneğin `@kullaniciadi/proje`) olsa bile herkese açık olması için gereklidir.

## 5. Doğrulama

Yayınlandıktan sonra, dünyadaki herhangi bir geliştirici aracınızı şu komutla çalıştırabilir:

```bash
npx hub-repo-tracker
```

## Olası Sorunlar ve Çözümleri

- **403 Forbidden Hatası**:
  - E-posta adresinizi doğrulamamış olabilirsiniz.
  - `hub-repo-tracker` ismi NPM'de başkası tarafından alınmış olabilir.
  - *Çözüm*: `backend/package.json` dosyasındaki `name` alanını benzersiz bir isimle değiştirin (Örn: `@kullaniciadiniz/hub-repo-tracker` veya `my-hub-tracker`).
- **EOTP (One-Time Password)**:
  - Eğer hesabınızda İki Aşamalı Doğrulama (2FA) açıksaa, terminal sizden telefona gelen kodu girmenizi isteyecektir.
