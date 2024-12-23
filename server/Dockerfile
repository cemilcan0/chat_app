# Python 3.11 imajını kullanıyoruz
FROM python:3.11-slim

# Çalışma dizinini ayarla
WORKDIR /usr/src/app

# Gereksinim dosyalarını kopyala ve bağımlılıkları yükle
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Django projesini kopyala
COPY . .

# Gerekli portları aç
EXPOSE 8000

# Daphne ile uygulamayı çalıştır
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
