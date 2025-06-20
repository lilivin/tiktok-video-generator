# Dokument wymagań produktu (PRD) – TikTok Video Automation Engine

## 1. Przegląd produktu
Aplikacja webowa, która pozwala nietechnicznym twórcom treści wygenerować w ≤ 30 s wideo-quiz 9:16 (1080 × 1920 px, ≤ 100 MB) zgodny z TikTok. Użytkownik podaje 3-5 pytań i odpowiedzi (opcjonalnie także obrazy). System automatycznie tworzy film z tłem (statycznym lub animowanym), 3-sekundowym timerem, odkryciem odpowiedzi, podkładem muzycznym oraz (opcjonalnym) lektorem PL/EN. Przed pobraniem użytkownik może nanieść proste korekty (tekst, tło, muzyka). Wszystko odbywa się w przeglądarce; backend Node.js/TypeScript wykorzystuje ElevenLabs (TTS), Replicate (obrazy) i FFmpeg/Remotion do renderu.

## 2. Problem użytkownika
Twórcy spędzają zbyt dużo czasu i/lub pieniędzy na ręczny montaż krótkich filmów-quizów. Potrzebują narzędzia, które jednym kliknięciem dostarcza klip o jakości zbliżonej do pracy montażysty, bez konieczności obsługi skomplikowanego software’u.

## 3. Wymagania funkcjonalne
1. Formularz web (PL UI) umożliwiający wprowadzenie:
   • tytułu,  
   • 3-5 par pytanie/odpowiedź,  
   • opcjonalnych obrazów (JPG/PNG ≤ 5 MB).  
2. Walidacja wejścia:
   • <3 lub >5 pytań odrzuca wysyłkę,  
   • max 120 zn./pytanie,  
   • sprawdzenie formatu plików.  
3. Przycisk Generate uruchamia pipeline, który:
   • równolegle generuje TTS (opcjonalny) i tła AI,  
   • montuje film i zwraca go w ≤ 30 s (95-percentyl).  
4. Automatyczny montaż 1080 × 1920 px, 30 fps, H.264/AAC:  
   • tło (obraz lub animacja),  
   • fade-in tekstu pytania,  
   • timer 3 s,  
   • animowane ujawnienie odpowiedzi,  
   • muzyka (1 z 3 licencjonowanych utworów) z ducking podczas lektora.  
5. Edytor post-generacyjny (bez rekodowania) pozwala:  
   • zmienić teksty,  
   • podmienić tło/obraz na inne z galerii,  
   • podmienić muzykę.  
6. Podgląd wideo w <video> oraz pobranie pliku MP4.  
7. Obsługa lektora PL lub EN w zależności od języka treści (wykrycie heurystyczne lub wybór w formularzu).  
8. Fallback assets: domyślne tło i dźwięk „bip” używane przy awarii zewnętrznych API.  
9. Zarządzanie licencjami zasobów (muzyka, obrazy) w ramach aplikacji.  

## 4. Granice produktu
* Brak:  
  • batch-processingu,  
  • publikacji przez TikTok API,  
  • wariantów pytań ABCD/True-False,  
  • awatarów mówiących,  
  • przełączania języka UI,  
  • logowania i kont użytkowników,  
  • dashboardu monitoringu błędów.  
* Maks. długość filmu 40 s; nadmiar pytań odrzucany.  
* Render realizowany na jednej instancji; skalowanie planowane w przyszłości.  
* Obsługiwane języki audio: PL i EN; UI w języku polskim.  
* Narzędzie używane lokalnie (brak moderacji treści).

## 5. Historyjki użytkowników

| ID    | Tytuł                    | Opis                                                                                                         | Kryteria akceptacji |
|-------|--------------------------|--------------------------------------------------------------------------------------------------------------|---------------------|
| US-001 | Utwórz quiz             | Jako content creator chcę wprowadzić 3-5 pytań i jedną poprawną dpowiedzi dla kazdego, by przygotować quiz.                           | • Formularz blokuje <3 lub >5 pytań.<br>• Puste pola powodują komunikat błędu.<br>• Każde pytanie ≤ 120 zn. |
| US-002 | Dodaj obraz             | Jako content creator chcę dodać własny obraz do pytania.                                                     | • Po wgraniu JPG/PNG ≤ 5 MB pokazywana jest miniatura.<br>• Nieobsługiwany format zwraca błąd. |
| US-003 | Generuj wideo           | Jako content creator chcę jednym kliknięciem wygenerować film.                                              | • Spinner startuje ≤ 1 s po kliknięciu.<br>• 95 % generacji kończy się sukcesem < 30 s.<br>• W razie błędu pojawia się komunikat z opcją ponów. |
| US-004 | Edytuj wideo            | Jako content creator chcę poprawić tekst lub muzykę bez ponownego renderu.                                  | • Edytor otwiera się po sukcesie renderu.<br>• Zmiany widoczne w podglądzie ≤ 200 ms.<br>• Pobierany plik zawiera poprawki. |
| US-005 | Podgląd                 | Jako content creator chcę obejrzeć film przed pobraniem.                                                     | • Odtwarzacz HTML5 działa w głównym widoku.<br>• Dźwięk startuje dopiero po kliknięciu użytkownika. |
| US-006 | Pobierz wideo           | Jako content creator chcę pobrać plik MP4 zgodny z TikTok.                                                   | • Plik ≤ 100 MB.<br>• Parametry: 1080 × 1920, H.264 baseline, AAC.<br>• Nazwa pliku = tytuł_quiz.mp4. |
| US-007 | Fallback assety         | Jako content creator chcę, aby film powstał nawet gdy AI tła zawiedzie.                                     | • Przy awarii API stosowany jest gradient-placeholder.<br>• Użytkownik otrzymuje ostrzeżenie, ale film się generuje. |
| US-008 | Ograniczenie długości   | Jako content creator otrzymuję ostrzeżenie, gdy próbuję dodać 6. pytanie.                                   | • UI blokuje dodanie 6. elementu i wyświetla komunikat o limicie. |

## 6. Metryki sukcesu
* Performance  
  • 95-percentyl czasu generacji < 30 s.  
  • Średni rozmiar pliku < 20 MB.  
* Niezawodność  
  • Render success rate ≥ 99 %.  
  • Wymuszone fallback-y < 2 % wszystkich renderów.  
* Jakość  
  • 80 % ankietowanych twórców ocenia film jako „nie gorszy” od ręcznego montażu.  
* Aktywność  
  • ≥ 50 unikalnych filmów wygenerowanych tygodniowo w pierwszym miesiącu po uruchomieniu.  
