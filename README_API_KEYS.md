# 🔑 Instrukcje uzyskiwania kluczy API

Ten projekt wymaga kilku zewnętrznych serwisów do pełnej funkcjonalności. Oto szczegółowe instrukcje jak uzyskać wymagane klucze API.

## 🚀 Szybki start - minimalna konfiguracja

Na początku możesz uruchomić projekt **bez kluczy API** - będzie działać z podstawowymi funkcjami (bez AI obrazów i lektora):

```bash
# Skopiuj przykładowy plik konfiguracji
cp .env.example .env

# Uruchom Redis
docker-compose up redis -d

# Uruchom aplikację
npm run dev
```

## 📋 Wymagane klucze API

### 1. 🎨 REPLICATE API (Generowanie obrazów AI)

**Do czego służy:** Automatyczne generowanie teł dla pytań używając Stable Diffusion AI.

**Jak uzyskać:**
1. Idź na https://replicate.com
2. Zarejestruj się (możesz użyć GitHub)
3. Przejdź do https://replicate.com/account/api-tokens
4. Kliknij "Create token"
5. Skopiuj token (zaczyna się od `r8_`)

**Koszt:**
- ~$0.00055 za jeden obraz 512x512
- Film z 5 pytaniami = ~$0.003

**W pliku .env:**
```env
REPLICATE_API_TOKEN=r8_twój_klucz_tutaj
```

### 2. 🗣️ ELEVENLABS API (Generowanie lektora)

**Do czego służy:** Zamiana tekstu na mowę (lektor dla filmów).

**Jak uzyskać:**
1. Idź na https://elevenlabs.io
2. Zarejestruj się
3. Przejdź do https://elevenlabs.io/speech-synthesis
4. W prawym górnym rogu kliknij na swój profil
5. Wybierz "Profile" → "API Key"
6. Skopiuj klucz (zaczyna się od `sk_`)

**Koszt:**
- **Darmowe:** 10,000 znaków miesięcznie
- **Płatne:** $5/miesiąc za 30,000 znaków
- Jedno pytanie z odpowiedzią = ~100 znaków

**W pliku .env:**
```env
ELEVENLABS_API_KEY=sk_twój_klucz_tutaj
```

## 🔧 Opcjonalne rozszerzenia

### 3. 🤖 OpenAI API (AI asystent do pytań)

**Do czego służy:** Automatyczne generowanie pytań quizowych przez AI.

**Jak uzyskać:**
1. Idź na https://platform.openai.com
2. Zarejestruj się
3. Przejdź do https://platform.openai.com/api-keys
4. Kliknij "Create new secret key"
5. Skopiuj klucz (zaczyna się od `sk-`)

### 4. ☁️ AWS S3 lub Cloudflare R2 (Przechowywanie wideo)

**Do czego służy:** Przechowywanie wygenerowanych filmów w chmurze.

**AWS S3:**
1. Utwórz konto AWS
2. Przejdź do IAM → Users → Create User
3. Daj uprawnienia S3
4. Skopiuj Access Key i Secret Key

**Cloudflare R2 (tańsze):**
1. Utwórz konto Cloudflare
2. Przejdź do R2 Object Storage
3. Utwórz bucket
4. Wygeneruj API tokeny

## 💰 Szacunkowe koszty

### Koszt jednego filmu (5 pytań):
- **Replicate (obrazy):** ~$0.003
- **ElevenLabs (lektor):** darmowy w limicie
- **Razem:** ~$0.003-0.01 za film

### Miesięczne koszty przy 100 filmach:
- **Replicate:** ~$0.30
- **ElevenLabs:** Darmowe (do 10k znaków) lub $5
- **Razem:** $0.30-5.30/miesiąc

## 🚦 Status funkcji bez kluczy API

| Funkcja | Bez API | Z API |
|---------|---------|-------|
| Tworzenie quizu | ✅ | ✅ |
| Upload obrazów użytkownika | ✅ | ✅ |
| Generowanie obrazów AI | ❌ | ✅ |
| Lektor (TTS) | ❌ | ✅ |
| Renderowanie wideo | ✅ (podstawowe) | ✅ (pełne) |

## 🔧 Konfiguracja

1. **Skopiuj plik konfiguracji:**
   ```bash
   cp .env.example .env
   ```

2. **Edytuj plik .env i dodaj swoje klucze:**
   ```bash
   nano .env
   # lub
   code .env
   ```

3. **Uruchom Redis:**
   ```bash
   docker-compose up redis -d
   ```

4. **Uruchom aplikację:**
   ```bash
   npm run dev
   ```

## ❗ Ważne uwagi

- **Bezpieczeństwo:** Nigdy nie commituj pliku `.env` do repozytorium
- **Limity:** Sprawdzaj limity API, żeby nie przekroczyć budżetu
- **Backup:** Zapisz klucze API w bezpiecznym miejscu
- **Monitoring:** Obserwuj użycie API w panelach dostawców

## 🆘 Pomoc

Jeśli masz problemy z konfiguracją:

1. Sprawdź czy Redis działa: `docker ps`
2. Sprawdź logi backendu: sprawdź terminal gdzie uruchomiłeś `npm run dev:backend`
3. Testuj API endpoint: `curl http://localhost:3000/health`

**Najczęstsze problemy:**
- Redis nie działa → `docker-compose up redis -d`
- Błędny klucz API → sprawdź format klucza
- Przekroczony limit → sprawdź usage w panelu API
- CORS error → upewnij się że frontend i backend działają na właściwych portach 