# Skills CLI Kullanim Kilavuzu

> Claude Code icin skill yonetimi rehberi - Sifirdan uzmanliga

---

## Icerik

1. [Skills CLI Nedir?](#1-skills-cli-nedir)
2. [Kurulum](#2-kurulum)
3. [Temel Komutlar](#3-temel-komutlar)
4. [Parametreler](#4-parametreler)
5. [Skill Arama](#5-skill-arama)
6. [Skill Yukleme Yontemleri](#6-skill-yukleme-yontemleri)
7. [Yuklu Skillleri Yonetme](#7-yuklu-skillleri-yonetme)
8. [Pratik Ornekler](#8-pratik-ornekler)
9. [Sorun Giderme](#9-sorun-giderme)

---

## 1. Skills CLI Nedir?

**Skills CLI**, Claude Code icin ozel beceriler (skill) yuklemeyi saglayan bir paket yoneticisidir.

### Skill Nedir?
- Claude'un belirli gorevleri daha iyi yapmasini saglayan bilgi paketleri
- Kod ornekleri, en iyi uygulamalar, patternler icerir
- Backend, Frontend, DevOps, Testing gibi alanlarda uzmanlasmskillar

### Ne Ise Yarar?
```
Normal Claude    →  Genel bilgilerle calisir
Skill yuklu Claude →  Alaninda uzman gibi davranir
```

### Skill Kaynaklari
- **Registry**: https://skills.sh/ (resmi skill marketi)
- **GitHub**: Herhangi bir GitHub reposu

---

## 2. Kurulum

Skills CLI otomatik olarak `npx` ile calisir, ayri kurulum gerektirmez:

```bash
# Komut calistiginda otomatik indirilir
npx skills --help
```

---

## 3. Temel Komutlar

```bash
# Yardim goster
npx skills --help

# Skill ara
npx skills search <arama-terimi>

# Skill detaylari
npx skills info <skill-adi>

# Skill yukle
npx skills add <kaynak>

# Yuklu skilleri listele
npx skills list

# Skill sil
npx skills uninstall <skill-adi>

# Skill guncelle
npx skills update <skill-adi>
```

---

## 4. Parametreler

### `-g` (Global)

**Anlami:** Skill'i global olarak yukler

| Kullanim | Aciklama |
|----------|----------|
| `-g` yok | Skill sadece mevcut projeye yuklenir |
| `-g` var | Skill tum projelerde kullanilabilir |

**Skill Konumlari:**
```
Local (proje):  ./claude/skills/
Global (tum projeler):  C:\Users\<kullanici>\.claude\skills\
```

**Ornek:**
```bash
# Sadece bu proje icin
npx skills add nodejs-best-practices

# Tum projeler icin
npx skills add nodejs-best-practices -g
```

**Tavsiye:** Genel skiller icin `-g` kullanin (nodejs, react, docker vb.)

---

### `-f` (Force)

**Anlami:** Zaten yuklu olsa bile tekrar yukler

| Kullanim | Aciklama |
|----------|----------|
| `-f` yok | Yuklu skill atlanir |
| `-f` var | Yuklu olsa bile uzerine yazar |

**Ornek:**
```bash
# Normal yukleme (yukluysa hata verir)
npx skills add react-patterns -g

# Zorla yukleme (yuklu olsa da yukler)
npx skills add react-patterns -g -f
```

**Kullanim Senaryolari:**
- Skill guncellemek icin
- Bozuk skilli duzeltmek icin
- Farkli versiyon yuklemek icin

---

### `--skip-setup`

**Anlami:** Skill yuklendikten sonra kurulum scriptlerini calistirmaz

```bash
npx skills add <skill> --skip-setup
```

---

## 5. Skill Arama

### Registry'de Arama

```bash
# Temel arama
npx skills search react

# Coklu kelime
npx skills search "nodejs backend"

# Kategori bazli
npx skills search docker
npx skills search testing
npx skills search typescript
```

### Web'den Arama

https://skills.sh/ sitesinden skilleri goruntuleyebilirsiniz:

```
https://skills.sh/search?q=fastify
https://skills.sh/search?q=docker
```

### Skill Detaylari

```bash
# Skill hakkinda bilgi al
npx skills info nodejs-best-practices
```

Cikti ornegi:
```
nodejs-best-practices

Node.js development principles and decision-making.
Framework selection, async patterns, security, and architecture.

Author:    xxx
Verticals: engineering
Updated:   2026-01-15
Stats:     ★ 50 stars, 100 installs

Links:
  repo:     https://github.com/xxx/skills
  skill_md: https://raw.githubusercontent.com/xxx/skills/main/...

Installation:
  npx skills add nodejs-best-practices -g
```

---

## 6. Skill Yukleme Yontemleri

### Yontem 1: Registry'den Doğrudan

En basit yontem - skill adini yazman yeterli:

```bash
# Basit yukleme
npx skills add docker

# Global ve zorla
npx skills add docker -g -f
```

---

### Yontem 2: GitHub Repo URL'si ile

Tum repoyu yukler:

```bash
npx skills add https://github.com/vercel-labs/agent-skills -g -f
```

**Dikkat:** Bu yontem repodaki TUM skilleri yukler.

---

### Yontem 3: GitHub Alt Klasor (Ozel Skill)

Repodaki belirli bir skilli yuklemek icin:

```bash
# Format
npx skills add github://<owner>/<repo>/tree/<branch>/<skill-yolu>

# Ornek
npx skills add github://vercel-labs/agent-skills/tree/main/skills/react-patterns -g -f
```

---

### Yontem 4: Yanlis Kullanim (HATA)

```bash
# BU CALISMAZ!
npx skills add https://github.com/xxx/skills --skill docker-expert
# HATA: unknown option '--skill'
```

**Neden?** Skills CLI'da `--skill` parametresi yoktur.

**Dogrusu:**
```bash
# Ya tum repo
npx skills add https://github.com/xxx/skills -g -f

# Ya da ozel yol
npx skills add github://xxx/skills/tree/main/skills/docker-expert -g -f
```

---

## 7. Yuklu Skillleri Yonetme

### Listeleme

```bash
# Local skiller (sadece bu proje)
npx skills list

# Global skiller (tum projeler)
npx skills list -g
```

### Silme

```bash
# Local'den sil
npx skills uninstall nodejs-best-practices

# Global'den sil
npx skills uninstall nodejs-best-practices -g

# Kisa yol
npx skills rm docker -g
```

### Guncelleme

```bash
# Tek skill guncelle
npx skills update react-patterns -g

# Tum skilleri guncelle
npx skills update
```

---

## 8. Pratik Ornekler

### Ornek 1: Yeni Proje Baslatirken

```bash
# Backend icin
npx skills add nodejs-best-practices -g -f
npx skills add api-patterns -g -f

# Frontend icin
npx skills add react-patterns -g -f
npx skills add frontend-design -g -f

# Database icin
npx skills add database-design -g -f

# DevOps icin
npx skills add docker -g -f
```

### Ornek 2: Hub Repo Tracker Projesi icin

```bash
# Backend (Fastify + TypeScript)
npx skills add nodejs-backend-patterns -g -f
npx skills add typescript-advanced-types -g -f

# Frontend (React + Vite)
npx skills add frontend-design -g -f
npx skills add vercel-react-best-practices -g -f

# DevOps (Docker)
npx skills add docker -g -f
npx skills add docker-compose-orchestration -g -f

# GitHub repolarindan
npx skills add https://github.com/vercel-labs/agent-skills -g -f
npx skills add https://github.com/anthropics/skills -g -f
```

### Ornek 3: Skill Arama ve Yukleme

```bash
# 1. Once ara
npx skills search fastify

# 2. Detaylara bak
npx skills info nodejs-backend-patterns

# 3. Yukle
npx skills add nodejs-backend-patterns -g -f
```

### Ornek 4: Problemi Cozme

```bash
# Skill yuklu mu kontrol et
npx skills list -g

# Yeniden yukle
npx skills add nodejs-best-practices -g -f

# Hala sorun varsa sil ve tekrar yukle
npx skills rm nodejs-best-practices -g
npx skills add nodejs-best-practices -g -f
```

---

## 9. Sorun Giderme

### Sorun 1: "SKILL.md not found" Uyarisi

```
⚠ No SKILL.md found - skill may not work correctly
```

**Neden:** Skill dosyasi eksik veya bozuk

**Cozum:**
```bash
# Zorla yeniden yukle
npx skills add <skill-adi> -g -f
```

---

### Sorun 2: "Repository not found" Hatasi

```
✖ Installation failed: Repository not found
```

**Neden:** GitHub repo URL'si yanlis veya repo silinmis

**Cozum:**
- URL'yi kontrol et
- Farkli bir skill ara: `npx skills search <kelime>`

---

### Sorun 3: Skill Calismiyor

**Kontrol Listesi:**
```bash
# 1. Yuklu mu?
npx skills list -g

# 2. Skill dosyasi var mi?
# Konum: C:\Users\<kullanici>\.claude\skills\<skill-adi>\

# 3. SKILL.md var mi?
# Skill klasorunu kontrol et
```

---

### Sorun 4: "unknown option" Hatasi

```
error: unknown option '--skill'
```

**Neden:** Yanlis parametre kullanimi

**Cozum:** Bu rehberdeki dogru kullanimlari takip et

---

## Hizli Referans Karti

| Islem | Komut |
|-------|-------|
| Ara | `npx skills search <kelime>` |
| Bilgi | `npx skills info <skill>` |
| Yukle (global) | `npx skills add <skill> -g -f` |
| Liste (global) | `npx skills list -g` |
| Sil (global) | `npx skills rm <skill> -g` |
| Guncelle | `npx skills update <skill> -g` |

---

## Faydali Linkler

- **Skills Registry:** https://skills.sh/
- **Claude Code Docs:** https://docs.anthropic.com/claude-code
- **Anthropic Skills GitHub:** https://github.com/anthropics/skills
- **Vercel Skills:** https://github.com/vercel-labs/agent-skills

---

*Tarih: 2026-02-13*
*Proje: Hub Repo Tracker*
