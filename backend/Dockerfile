FROM node:20-alpine

WORKDIR /app

# Kopiuj pliki package
COPY package*.json ./

# Instaluj zależności
RUN npm ci --only=production

# Kopiuj kod źródłowy
COPY . .

# Build aplikacji
RUN npm run build

# Ustaw użytkownika
USER node

# Expose port
EXPOSE 3000

# Uruchom aplikację
CMD ["npm", "start"] 