# 🚀 راهنمای جامع استقرار و انتشار کلاس‌یار (Deployment Guide)

کلاس‌یار یک سامانه تحت وب مدرن، کلاینت‌محور و **Local-First** است. به این معنا که تمامی پردازش‌ها، محاسبات نمره‌دهی، رسم نمودارها و ذخیره‌سازی داده‌ها درون پایگاه داده مرورگر کاربر (**IndexedDB**) انجام می‌پذیرد.

خروجی دستور ساخت پروژه (`npm run build`) یک پوشه استاتیک حاوی فایل‌های کامپایل‌شده HTML، CSS، JavaScript، فونت‌ها و تصاویر به نام `dist/` است. از آنجا که برنامه برای کارکرد اصلی خود نیازی به سرور بک‌اند فعال یا پایگاه‌داده سمت سرور ندارد، می‌توانید خروجی آن را بر روی **هر هاست یا وب‌سروری در سراسر جهان** بدون هیچ هزینه یا با کمترین منابع ممکن میزبانی و منتشر کنید.

---

## 📑 فهرست مطالب

1. [ساخت نسخه نهایی (Production Build)](#۱-ساخت-نسخه-نهایی-production-build)
2. [گزینه ۱: استقرار روی Vercel (سریع‌ترین و آسان‌ترین)](#گزینه-۱-استقرار-روی-vercel-سریعترین-و-آسانترین)
3. [گزینه ۲: استقرار روی Netlify (هم با گیت، هم Drag & Drop بدون گیت)](#گزینه-۲-استقرار-روی-netlify)
4. [گزینه ۳: استقرار روی GitHub Pages (رایگان روی ریپازیتوری)](#گزینه-۳-استقرار-روی-github-pages)
5. [گزینه ۴: استقرار روی Cloudflare Pages (پهنای باند نامحدود و سرعت بالا)](#گزینه-۴-استقرار-روی-cloudflare-pages)
6. [گزینه ۵: استقرار روی سرور مجازی شخصی VPS (اوبونتو / دبیان با Nginx)](#گزینه-۵-استقرار-روی-سرور-مجازی-شخصی-vps)
7. [گزینه ۶: استقرار کانتینری با داکر (Docker & Docker Compose)](#گزینه-۶-استقرار-کانتینری-با-داکر-docker)
8. [گزینه ۷ (اختیاری): راه‌اندازی PocketBase برای همگام‌سازی ابری](#گزینه-۷-اختیاری-راهاندازی-pocketbase-برای-همگامسازی-ابری)
9. [راهنمای نصب PWA روی موبایل و رایانه](#راهنمای-نصب-pwa-روی-موبایل-و-رایانه)
10. [چک‌لیست پیش از انتشار رسمی (Pre-Release Checklist)](#چکلیست-پیش-از-انتشار-رسمی)
11. [جدول عیب‌یابی و رفع مشکلات متداول (Troubleshooting)](#جدول-عیبیابی-و-رفع-مشکلات-متداول)

---

## ۱. ساخت نسخه نهایی (Production Build)

پیش از استقرار روی هر پلتفرمی، باید پروژه را کامپایل کرده و فایل‌های آماده‌ی انتشار را بسازید.

### پیش‌نیازها:
- نصب **Node.js** نسخه 18 LTS یا 20 LTS به بالا ([دانلود از سایت رسمی](https://nodejs.org))
- ابزار مدیریت بسته‌های **npm** (به همراه Node.js نصب می‌شود)

### دستورات کامپایل:

```bash
# ۱. دریافت آخرین وابستگی‌ها
npm install

# ۲. اجرای آزمون‌های تایپ و کامپایل بیلد نهایی
npm run build
```

پس از اتمام موفقیت‌آمیز، پوشه‌ای با نام `dist/` در ریشه پروژه ایجاد می‌شود:
```
dist/
├── assets/
│   ├── index-[hash].js      # منطق کامپایل‌شده برنامه و ری‌اکت
│   └── index-[hash].css     # استایل‌های بهینه‌سازی‌شده تیلویند
├── fonts/
│   └── Vazirmatn-Variable.woff2 # فونت فارسی اختصاصی
├── favicon.svg              # آیکون برداری برنامه
├── logo.svg                 # نشان رسمی کلاس‌یار
└── index.html               # نقطه ورود اصلی وب‌اپلیکیشن
```

### تست محلی خروجی قبل از استقرار:
برای اطمینان از اینکه نسخه کامپایل‌شده هیچ مشکلی در اجرا ندارد، دستور زیر را اجرا کنید:

```bash
npm run preview
```
آدرس `http://localhost:4173` را در مرورگر باز کنید و کارکرد روان صفحات، فونت‌ها و دکمه‌ها را به صورت محلی بررسی نمایید.

---

## گزینه ۱: استقرار روی Vercel (سریع‌ترین و آسان‌ترین)

سایت **[Vercel](https://vercel.com)** بهترین و روان‌ترین بستر برای پروژه‌های Vite و React است. این سرویس گواهی SSL رایگان، CDN ابری جهانی، و استقرار خودکار با هر Push در گیت‌هاب را ارائه می‌دهد.

### روش اول: از طریق پنل وب (محیط گرافیکی - پیشنهادی)

1. وارد حساب کاربری خود در [Vercel](https://vercel.com) شوید (یا با حساب GitHub خود وارد شوید).
2. در داشبورد، روی دکمه **"Add New..."** در بالا سمت راست کلیک کرده و **"Project"** را برگزینید.
3. در لیست ریپازیتوری‌های گیت‌هاب، مخزن پروژه **KlasYar** را پیدا کرده و روی دکمه **"Import"** کلیک کنید.
4. در بخش **Configure Project**:
   - **Framework Preset:** گزینه `Vite` (معمولاً ورسل به شکل خودکار تشخیص می‌دهد).
   - **Root Directory:** `./` (مقدار پیش‌فرض بدون تغییر).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. روی دکمه **"Deploy"** کلیک کنید.
6. ظرف ۴۰ تا ۶۰ ثانیه، فرآیند ساخت به پایان رسیده و یک نشانی اینترنتی مانند `https://klasyar-yourname.vercel.app` به شما اختصاص می‌یابد!

### روش دوم: از طریق خط فرمان (Vercel CLI)

اگر می‌خواهید مستقیماً از طریق ترمینال پروژه را منتشر کنید:

```bash
# نصب سراسری ابزار ورسل
npm install -g vercel

# ورود به حساب ورسل
vercel login

# استقرار آزمایشی (Preview)
vercel

# استقرار نسخه نهایی و پروداکشن (Production)
vercel --prod
```

### فایل تنظیمات `vercel.json` (الزامی برای جلوگیری از خطای ۴۰۴ در رفرش)

در برنامه‌های تک‌صفحه‌ای (SPA)، اگر کاربر در مسیری مانند `/classes` صفحه را رفرش کند، وب‌سرور نباید دنبال فایل فیزیکی `/classes/index.html` بگردد؛ بلکه باید کاربر را به `index.html` هدایت کند.

برای این منظور، فایلی به نام `vercel.json` در پوشه ریشه پروژه بسازید یا مطمئن شوید محتوای زیر را دارد:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/fonts/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## گزینه ۲: استقرار روی Netlify

سایت **[Netlify](https://netlify.com)** انتخابی فوق‌العاده برای انتشار آسان است؛ به‌ویژه برای کسانی که نمی‌خواهند با گیت یا ترمینال کار کنند.

### روش الف: کشیدن و رها کردن (Drag & Drop) بدون نیاز به Git

اگر به گیت مسلط نیستید یا می‌خواهید ظرف چند ثانیه بدون اتصال به گیت‌هاب سایت را بالا بیاورید:

1. در سیستم خود دستور `npm run build` را بزنید تا پوشه `dist` ساخته شود.
2. وارد حساب کاربری خود در [Netlify](https://app.netlify.com) شوید.
3. در صفحه داشبورد وارد تب **"Sites"** شوید.
4. صفحه را به پایین اسکرول کنید تا کادر خط‌چین زیر را مشاهده نمایید:
   > *"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"*
5. کل پوشه **`dist`** را با موس کشیده و داخل این کادر رها کنید (Drop).
6. سیستم فایل‌ها را آپلود کرده و فوراً آدرسی اختصاصی مانند `https://peaceful-curie-xxxxxx.netlify.app` به شما می‌دهد.
7. از مسیر **Site configuration > Change site name** می‌توانید نام دلخواه خود (مثلاً `my-klasyar.netlify.app`) را ثبت کنید.

### روش ب: اتصال خودکار از طریق GitHub

1. در داشبورد Netlify، دکمه **"Add new site"** و سپس **"Import an existing project"** را بزنید.
2. مخزن گیت‌هاب **KlasYar** را انتخاب کنید.
3. تنظیمات استقرار:
   - **Branch to deploy:** `main`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. روی دکمه **"Deploy KlasYar"** کلیک کنید.

### پیکربندی ریدایرکت‌ها در Netlify:

برای جلوگیری از خطای 404 در رفرش صفحات، یکی از دو روش زیر را اعمال کنید:

#### شیوه ۱: فایل `netlify.toml` در ریشه پروژه (پیشنهادی):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### شیوه ۲: فایل `public/_redirects`:
فایلی بدون پسوند به نام `_redirects` درون پوشه `public/` بسازید:
```text
/*    /index.html   200
```
(این فایل هنگام بیلد خودکار به ریشه `dist/` منتقل می‌شود).

---

## گزینه ۳: استقرار روی GitHub Pages

سرویس **[GitHub Pages](https://pages.github.com)** به شما اجازه می‌دهد پروژه را به صورت کاملاً رایگان روی همان مخزن گیت‌هاب میزبانی کنید.

> [!IMPORTANT]
> **نکته بسیار مهم در مورد آدرس پایه (Base Path):**  
> اگر آدرس سایت شما به شکل `https://<username>.github.io/<repo-name>/` باشد (دارای زیرمسیر ریپازیتوری)، باید مقدار `base` در `vite.config.ts` به درستی تنظیم شود، در غیر این صورت فایل‌های JS و CSS با خطای 404 مواجه می‌شوند.

### مرحله ۱: تنظیم `base` در `vite.config.ts`

فایل `vite.config.ts` را باز کرده و آن را به شکل زیر تنظیم کنید تا در صورت وجود متغیر گیت‌هاب، از ساب‌فولدر استفاده کند:

```typescript
import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// نام ریپازیتوری خود را در صورت میزبانی روی آدرس زیرمسیر وارد کنید
const repoName = "KlasYar"

export default defineConfig({
  // اگر در گیت‌هاب اکشنز اجرا شود از مسیر ریپازیتوری استفاده می‌کند
  base: process.env.GITHUB_PAGES ? `/${repoName}/` : "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
```

### روش الف: استقرار خودکار با GitHub Actions (مدرن و حرفه‌ای)

1. در صفحه ریپازیتوری گیت‌هاب خود، به تب **Settings > Pages** بروید.
2. در بخش **Build and deployment**، گزینه **Source** را روی **GitHub Actions** قرار دهید.
3. در پروژه خود پوشه `.github/workflows/` را ایجاد کرده و فایلی با نام `deploy.yml` بسازید:

```yaml
# .github/workflows/deploy.yml
name: Deploy KlasYar to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: دریافت آخرین کدها (Checkout)
        uses: actions/checkout@v4

      - name: راه‌اندازی Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: نصب وابستگی‌ها
        run: npm ci

      - name: کامپایل پروژه
        env:
          GITHUB_PAGES: 'true'
        run: npm run build

      - name: آماده‌سازی SPA برای ریدایرکت گیت‌هاب پیجز
        run: cp dist/index.html dist/404.html

      - name: بارگذاری خروجی استاتیک
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: استقرار در GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

با ارسال این فایل به برنچ `main`، گیت‌هاب به صورت خودکار پروژه را می‌سازد و در نشانی `https://<username>.github.io/<repo-name>/` منتشر می‌کند.

### روش ب: استقرار با پکیج `gh-pages`

```bash
# نصب پکیج به عنوان وابستگی توسعه
npm install -D gh-pages
```

در فایل `package.json` در بخش `"scripts"` دستورات زیر را اضافه نمایید:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```
سپس دستور زیر را در ترمینال بزنید:
```bash
npm run deploy
```

---

## گزینه ۴: استقرار روی Cloudflare Pages

سرویس **[Cloudflare Pages](https://pages.cloudflare.com)** به دلیل دارا بودن دیتاسنترهای متعدد و تأخیر ناچیز شبکه در سراسر جهان و ایران، گزینه‌ای بسیار پایدار و پرسرعت با **پهنای باند نامحدود و رایگان** است.

### مراحل اتصال به گیت‌هاب:

1. وارد داشبورد کلادفلر در [dash.cloudflare.com](https://dash.cloudflare.com) شوید.
2. از منوی سمت چپ به بخش **Workers & Pages** بروید.
3. روی دکمه آبی‌رنگ **"Create application"** کلیک کنید.
4. تب **"Pages"** را انتخاب کرده و دکمه **"Connect to Git"** را بزنید.
5. ریپازیتوری **KlasYar** را برگزینید و دکمه **"Begin setup"** را بزنید.
6. در بخش تنظیمات ساخت (Build Settings):
   - **Framework preset:** گزینه `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`
7. (اختیاری) در بخش **Environment variables** می‌توانید متغیر `NODE_VERSION` را با مقدار `20` اضافه کنید.
8. دکمه **"Save and Deploy"** را بزنید.

کلادفلر به‌طور پیش‌فرض مسیریابی SPA را برای پروژه‌های Vite مدیریت می‌کند.

---

## گزینه ۵: استقرار روی سرور مجازی شخصی VPS (اوبونتو / دبیان با Nginx)

اگر یک سرور مجازی شخصی (مانند Ubuntu 22.04 / 24.04 یا Debian 12) در دیتاسنترهای داخلی یا خارجی دارید و می‌خواهید برنامه را روی دامنه اختصاصی با نهایت سرعت و شخصی‌سازی میزبانی کنید، مراحل زیر را طی نمایید:

### پیش‌نیازها:
- دسترسی SSH به سرور مجازی با دسترسی `sudo`
- دامنه اختصاصی که رکوردهای DNS نوع `A` آن به IP سرور شما متصل شده باشند.

---

### مرحله ۱: نصب وب‌سرور Nginx
از وب‌سرور پرسرعت [Nginx](https://nginx.org) استفاده می‌کنیم:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx curl -y

# اطمینان از فعال بودن Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### مرحله ۲: ایجاد پوشه نگهداری فایل‌های کلاس‌یار
```bash
sudo mkdir -p /var/www/klasyar
sudo chown -R $USER:$USER /var/www/klasyar
sudo chmod -R 755 /var/www/klasyar
```

### مرحله ۳: بیلد و انتقال فایل‌ها به سرور با `scp`
در کامپیوتر شخصی خود، ابتدا دستور بیلد را اجرا کنید و سپس پوشه `dist` را با دستور امن `scp` به سرور منتقل نمایید:

```bash
# در سیستم محلی
npm run build

# کپی فایل‌ها به سرور (به جای user و your-server-ip اطلاعات خود را وارد کنید)
scp -r dist/* user@your-server-ip:/var/www/klasyar/
```

### مرحله ۴: تنظیم فایل کانفیگ Nginx برای SPA Routing و Caching

یک فایل تنظیمات جدید برای کلاس‌یار ایجاد کنید:

```bash
sudo nano /etc/nginx/sites-available/klasyar
```

محتوای کامل و بهینه‌سازی‌شده زیر را در آن قرار دهید (به جای `yourdomain.com` دامنه خود را بنویسید):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/klasyar;
    index index.html;

    # فشرده‌سازی خودکار داده‌ها برای لود فوق‌سریع در اینترنت ایران
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/x-javascript application/xml application/json font/woff2;
    gzip_disable "MSIE [1-6]\.";

    # هدرهای امنیتی
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # کش بلندمدت فایل‌های هش‌دار جاوااسکریپت و استایل‌ها
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # کش بلندمدت فونت‌های فارسی
    location /fonts/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # فایل اصلی نباید کش شود تا کاربران بلافاصله نسخه جدید را دریافت کنند
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    # قلب تپنده مسیریابی SPA — هر مسیری که فایل فیزیکی نباشد به index.html بازمی‌گردد
    location / {
        try_files $uri $uri/ /index.html;
    }

    # مدیریت صفحات خطا
    error_page 404 /index.html;
}
```

### مرحله ۵: فعال‌سازی سایت و بررسی کانفیگ

```bash
# ایجاد لینک نمادین
sudo ln -s /etc/nginx/sites-available/klasyar /etc/nginx/sites-enabled/

# غیرفعال کردن سایت پیش‌فرض در صورت نیاز
sudo rm -f /etc/nginx/sites-enabled/default

# تست صحت سینتکس Nginx
sudo nginx -t

# بارگذاری مجدد تنظیمات
sudo systemctl reload nginx
```

### مرحله ۶: دریافت گواهی SSL رایگان با Certbot (HTTPS)
برای فعال‌سازی پروتکل امن `https://` از ابزار رسمی بنیاد الکترونیک [Certbot](https://certbot.eff.org) استفاده کنید:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

ابزار Certbot به طور خودکار فایل کانفیگ Nginx را به‌روزرسانی کرده و تمدید خودکار ۹۰ روزه را نیز فعال می‌کند. برای تست تمدید خودکار:
```bash
sudo certbot renew --dry-run
```

---

## گزینه ۶: استقرار کانتینری با داکر (Docker & Docker Compose)

با استفاده از [Docker](https://docs.docker.com) می‌توانید کلاسیار را درون یک کانتینر ایزوله و مستقل اجرا کنید.

> [!NOTE]
> **نکته معماری در کانتینر:**  
> چون داده‌های کلاس‌یار به صورت محلی در مرورگر معلم ذخیره می‌شوند، کانتینر داکر نیازی به دیتابیس ندارد. بنابراین داکر صرفاً فایل‌های استاتیک کامپایل‌شده را با وب‌سرور سبک `nginx:alpine` با حجمی حدود ۲۰ مگابایت و مصرف رم کمتر از ۱۵ مگابایت منتشر می‌کند.

### فایل `Dockerfile` (چندمرحله‌ای بهینه‌سازی‌شده):

فایلی با نام `Dockerfile` در ریشه پروژه بسازید:

```dockerfile
# مرحله ۱: ساخت و کامپایل پروژه
FROM node:20-alpine AS builder
WORKDIR /app

# کپی فایل‌های پکیج برای استفاده از قابلیت Layer Caching
COPY package*.json ./
RUN npm ci

# کپی تمام کدهای منبع و اجرای بیلد نهایی
COPY . .
RUN npm run build

# مرحله ۲: ایجاد وب‌سرور سبک پروداکشن
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# حذف فایل‌های پیش‌فرض Nginx
RUN rm -rf ./*

# کپی خروجی کامپایل‌شده از مرحله قبل
COPY --from=builder /app/dist .

# کپی پیکربندی Nginx برای SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# اکسپوز پورت ۸۰ کانتینر
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### فایل کانفیگ `nginx.conf` برای داکر:

فایلی با نام `nginx.conf` در ریشه پروژه با محتوای زیر ایجاد نمایید:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml font/woff2;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /fonts/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

### فایل `docker-compose.yml`:

```yaml
version: '3.8'

services:
  klasyar:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: klasyar-app
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
```

### دستورات اجرا:

```bash
# ۱. ساخت ایمیج داکر
docker build -t klasyar .

# ۲. اجرای مستقیم کانتینر
docker run -d -p 8080:80 --name klasyar-app klasyar

# یا اجرای آسان با Docker Compose:
docker compose up -d --build
```
اکنون برنامه روی آدرس `http://localhost:8080` در دسترس است.

---

## گزینه ۷ (اختیاری): راه‌اندازی PocketBase برای همگام‌سازی ابری

[PocketBase](https://pocketbase.io) یک بک‌اند اوپن‌سورس، فوق‌العاده سریع و متشکل از یک تک‌فایل اجرایی (Single Binary) بر پایه زبان Go و دیتابیس SQLite است.

### 💡 مفهوم معماری و نقش بک‌اند در کلاس‌یار:
- کلاس‌یار برای کار کردن **هیچ نیازی** به بک‌اند ندارد. منبع اصلی حقیقت (Single Source of Truth) همان دیتابیس محلی کاربر (**Dexie / IndexedDB**) است.
- راه‌اندازی PocketBase کاملاً **اختیاری** است و صرفاً برای قابلیت **همگام‌سازی دوطرفه (Sync)** میان چند دستگاه (مثلاً انتقال اطلاعات بین تبلت کلاسی و کامپیوتر منزل معلم) یا بکاپ‌گیری دوره‌ای در سرور استفاده می‌شود.

### مراحل راه‌اندازی PocketBase:

#### ۱. دریافت فایل اجرایی PocketBase
فایل باینری متناسب با سیستم‌عامل سرور خود را از صفحه [PocketBase Releases](https://pocketbase.io) دانلود کنید:

```bash
# مثال برای سرور لینوکس 64 بیتی
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.20/pocketbase_0.22.20_linux_amd64.zip
unzip pocketbase_0.22.20_linux_amd64.zip -d pocketbase/
cd pocketbase/
```

#### ۲. اجرای اولیه سرویس
```bash
./pocketbase serve --http="0.0.0.0:8090"
```

#### ۳. تنظیمات حساب مدیر و کالکشن‌ها
- آدرس `http://your-server-ip:8090/_/` را در مرورگر باز کنید.
- ایمیل و رمزعبور حساب کاربری مدیر ارشد (Superuser) را تعریف نمایید.
- کالکشن‌های مورد نظر را برای داده‌ها (مانند `classes`, `students`, `attendance`, `scores`, `sync_events`) بسازید.

#### ۴. تنظیم آدرس در اپلیکیشن کلاس‌یار
- وارد اپلیکیشن کلاس‌یار شوید.
- به بخش **تنظیمات > همگام‌سازی ابری (Cloud Sync)** بروید.
- نشانی سرور پاکت‌بیس خود (مثلاً `https://pb.yourdomain.com` یا `http://localhost:8090`) را به همراه توکن یا اطلاعات حساب وارد نمایید تا همگام‌سازی خودکار فعال گردد.

---

## راهنمای نصب PWA روی موبایل و رایانه

کلاس‌یار به صورت استاندارد **PWA (Progressive Web App)** طراحی شده است. پس از یک‌بار لود شدن در مرورگر، می‌توانید آن را به عنوان یک نرم‌افزار دائمی و مستقل روی سیستم یا تلفن همراه خود نصب کنید تا در صورت قطعی اینترنت نیز بدون کوچک‌ترین مشکلی اجرا شود.

### 📱 ۱. نصب روی سیستم‌عامل اندروید (مرورگر Chrome / Edge / Samsung Internet):
1. آدرس سایت مستقر شده کلاس‌یار را در مرورگر تلفن همراه باز کنید.
2. روی آیکون منوی سه‌نقطه (بالا سمت راست یا پایین صفحه) ضربه بزنید.
3. گزینه **«نصب برنامه» (Install app)** یا **«افزودن به صفحه اصلی» (Add to Home screen)** را انتخاب کنید.
4. در پیام تایید ظاهر شده روی **Install** بزنید.
5. آیکون اختصاصی کلاس‌یار به لیست برنامه‌ها و صفحه خانگی تلفن شما اضافه شده و مانند یک اپ نیتیو در تمام‌صفحه باز می‌شود.

### 🍎 ۲. نصب روی آیفون و آیپد (سیستم‌عامل iOS / iPadOS در مرورگر Safari):
1. سایت را حتماً در مرورگر پیش‌فرض **Safari** باز کنید.
2. روی دکمه **Share** (آیکون مربع با فلشی که به سمت بالا اشاره دارد در نوار پایین صفحه) ضربه بزنید.
3. در منوی باز شده به پایین اسکرول کنید و گزینه **"Add to Home Screen"** (افزودن به صفحه اصلی) را انتخاب کنید.
4. نام برنامه را مشاهده کرده و در گوشه بالا سمت راست روی **"Add"** ضربه بزنید.

### 💻 ۳. نصب روی دسکتاپ (ویندوز، مک، لینوکس در Chrome یا Edge):
1. سایت را در مرورگر کروم یا مایکروسافت اج باز کنید.
2. در سمت راست نوار آدرس URL، روی آیکون کوچک **Install KlasYar** (نماد مانیتور با فلش رو به پایین یا علامت ⊕) کلیک کنید.
3. یا کلید سه‌نقطه منو را زده و گزینه **"Save and share" > "Install KlasYar"** را انتخاب کنید.
4. برنامه در پنجره‌ای مستقل، شکیل، و بدون نوار آدرس‌های مرورگر باز خواهد شد و در منوی استارت و تسک‌بار شما سنجاق می‌شود.

---

## چک‌لیست پیش از انتشار رسمی

قبل از انتشار نهایی سامانه در محیط عملیاتی، مطمئن شوید تمام موارد زیر را بررسی کرده‌اید:

- [ ] **بررسی بیلد موفق:** دستور `npm run build` بدون هیچ‌گونه خطای تایپ‌اسکریپت و بدون نقص اجرا شد.
- [ ] **پاس شدن آزمون‌ها:** دستور `npm test` اجرا شد و تمامی آزمون‌های واحد و منطقی با موفقیت پاس شدند.
- [ ] **بررسی پیش‌نمایش لوکال:** دستور `npm run preview` اجرا شد و تمام تب‌ها، فرم‌ها و تقویم جلالی تست گردید.
- [ ] **تایید بارگذاری فونت فارسی:** در تب Network ابزار توسعه مرورگر (F12) بررسی شد که فونت `Vazirmatn-Variable.woff2` با وضعیت `200` لود می‌شود و خطای 404 یا پرش فونت پیش‌فرض رخ نمی‌دهد.
- [ ] **آزمایش خروجی‌های چاپی و PDF:** دریافت فایل PDF گزارش و کارنامه روی سرور واقعی (نه فقط در localhost) تست شد و فونت‌ها و چینش متن راست‌به‌چپ به درستی در فایل خروجی ذخیره شدند.
- [ ] **امنیت کلیدها و تنظیمات:** مطمئن شدید هیچ فایل `.env` یا داده‌ی حساسی وارد مخزن عمومی Git نشده است.
- [ ] **به‌روزرسانی اسناد و نگارش:** فایل `README.md` و فیلد نسخه (`version`) در `package.json` به نسخه جاری آپدیت شده‌اند.
- [ ] **تست آفلاین بودن:** اینترنت سیستم را قطع کرده و صفحه را رفرش کردید؛ برنامه باید از طریق کش مرورگر به سرعت باز شود.

---

## جدول عیب‌یابی و رفع مشکلات متداول

| مشکل | علت احتمالی | راه‌حل گام‌به‌گام |
| :--- | :--- | :--- |
| **صفحه با خطای 404 مواجه می‌شود** (به‌ویژه بعد از رفرش صفحه یا تایپ مستقیم آدرس در نوار مرورگر) | وب‌سرور برای برنامه‌های تک‌صفحه‌ای (SPA) پیکربندی نشده و در غیاب فایل فیزیکی خطای Not Found می‌دهد. | اضافه کردن قانون ریرایت به `index.html`:<br>• در Vercel: ایجاد فایل `vercel.json`<br>• در Netlify: ایجاد فایل `netlify.toml` یا `_redirects`<br>• در Nginx: افزودن `try_files $uri $uri/ /index.html;` |
| **فونت‌ها یا استایل‌های CSS لود نمی‌شوند** یا ظاهر صفحه کاملاً به‌هم‌ریخته است | مسیر پایه (`base`) در `vite.config.ts` به اشتباه تنظیم شده است (معمولاً در گیت‌هاب پیجز یا ساب‌دایرکتوری‌ها). | مقدار `base: './'` یا نام مسیر ریپازیتوری (مانند `base: '/KlasYar/'`) را در `vite.config.ts` قرار دهید و مجدداً `npm run build` بگیرید. |
| **خطای فونت در خروجی PDF** (حروف فارسی به صورت مربع، علامت سؤال یا ناخوانا ذخیره می‌شوند) | فونت اختصاصی در مرحله بیلد کپی نشده یا کتابخانه تولید PDF دسترسی CORS به فایل فونت ندارد. | مطمئن شوید فونت در پوشه `public/fonts/` قرار دارد و در استایل‌های چاپی با مسیر معتبر و فونت استاندارد وب لود شده است. |
| **تصاویر، آیکون‌ها یا لوگو نمایش داده نمی‌شوند** | آدرس‌دهی فایل‌ها به شکل مطلق (`/image.png`) صورت گرفته و در زیرمسیرها دچار شکستگی لینک شده است. | در کدهای کامپوننت‌ها فایل‌ها را `import` کنید یا مسیرها را به شکل نسبی یا با متغیر `import.meta.env.BASE_URL` فراخوانی نمایید. |
| **کاربران تغییرات جدید سایت را بعد از استقرار نمی‌بینند** | فایل `index.html` در مرورگر کاربران کش شده و مرورگر نسخه قدیمی را فراخوانی می‌کند. | تنظیم هدر `Cache-Control: no-cache, no-store, must-revalidate` برای فایل `index.html` در تنظیمات سرور یا وب‌سایت. |
| **خطای Mixed Content در کنسول مرورگر** | سایت شما روی HTTPS باز شده اما درخواستی به صورت نامن را به یک آدرس ناامن `http://` ارسال می‌کند. | مطمئن شوید تمام ارجاعات و آدرس سرورهای بک‌اند یا فونت‌های خارجی از پروتکل امن `https://` استفاده می‌کنند. |
| **پرش نور اولیه صفحه (Theme Flickering)** | تم تاریک/روشن قبل از اجرای جاوااسکریپت اعمال نشده است. | اسکریپت سبک inline موجود در `index.html` کوکی یا تنظیمات ذخیره‌شده را در اولین لحظه به تگ `<html>` تزریق می‌کند و نیاز به تغییری ندارد. |

---

## نکات تکمیلی برای کاربران هاست‌های اشتراکی (cPanel / DirectAdmin)

اگر از هاست‌های اشتراکی سی‌پنل یا دایرکت‌ادمین استفاده می‌کنید:

1. دستور `npm run build` را در سیستم خود بزنید.
2. تمام محتویات درون پوشه `dist` (شامل `index.html`, `assets/`, `fonts/` و ...) را درون یک فایل `.zip` فشرده کنید.
3. در کنترل‌پنل هاست خود وارد **File Manager** شده و به پوشه **`public_html`** بروید.
4. فایل ZIP را آپلود و اکسترکت (Extract) نمایید.
5. برای حل مشکل SPA Routing در وب‌سرور آپاچی (Apache)، یک فایل به نام `.htaccess` در پوشه `public_html` ساخته و کدهای زیر را درون آن بنویسید:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```
با این کار، سایت شما روی هاست اشتراکی نیز با نهایت سرعت و بدون هیچ باگ روتینگی اجرا خواهد شد.
