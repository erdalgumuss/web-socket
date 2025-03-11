# 1️⃣ Hafif bir Node.js ortamı kullan
FROM node:18-alpine

# 2️⃣ Çalışma dizinini belirle
WORKDIR /app

# 3️⃣ Bağımlılıkları yükle
COPY package.json package-lock.json ./
RUN npm install

# 4️⃣ Proje dosyalarını konteynere kopyala
COPY . .

# 5️⃣ TypeScript derlemesi yap
RUN npm run build

# 6️⃣ WebSocket sunucusunu başlat
CMD ["node", "dist/server.js"]
