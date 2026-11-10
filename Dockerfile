# مرحله ۱: ساخت و کامپایل پروژه
FROM node:20-alpine AS builder
WORKDIR /app

# کپی فایل‌های تعریف پکیج
COPY package*.json ./
RUN npm ci

# کپی سورس کد و اجرای بیلد نهایی
COPY . .
RUN npm run build

# مرحله ۲: ایجاد وب‌سرور سبک پروداکشن با Nginx Alpine
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# حذف صفحات پیش‌فرض
RUN rm -rf ./*

# کپی خروجی مرحله بیلد
COPY --from=builder /app/dist .

# کپی تنظیمات Nginx برای SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
