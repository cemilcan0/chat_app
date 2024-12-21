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

# Django komutlarını çalıştır (ör. migration ve runserver)
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]
