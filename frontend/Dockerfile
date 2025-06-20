FROM node:20-alpine AS builder

WORKDIR /app

# Kopiuj pliki package
COPY package*.json ./

# Instaluj zależności
RUN npm ci

# Kopiuj kod źródłowy
COPY . .

# Build aplikacji
RUN npm run build

# Produkcyjny stage
FROM nginx:alpine

# Kopiuj zbudowane pliki
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopiuj konfigurację nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 