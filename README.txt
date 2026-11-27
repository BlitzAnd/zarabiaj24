ZARABIAJ24 – PWA PROTOTYP

Co zawiera:
- responsywny interfejs marketplace
- przykładowe ogłoszenia i kategorie
- wyszukiwanie
- dodawanie ogłoszeń zapisywanych lokalnie w przeglądarce
- demonstracyjny panel sprzedawcy i administratora
- manifest PWA i service worker

WAŻNE OGRANICZENIA:
To prototyp front-end. Nie ma prawdziwych kont, serwera, wspólnej bazy danych,
płatności BLIK/kartą, wypłat, zamówień ani rzeczywistej publikacji ogłoszeń.
Dane zapisują się tylko w pamięci lokalnej przeglądarki/urządzenia.
Nie należy przyjmować płatności na podstawie tego prototypu.

URUCHOMIENIE TESTOWE:
1. Rozpakuj ZIP.
2. Umieść zawartość na hostingu obsługującym statyczne pliki i HTTPS.
3. Otwórz adres w Safari na iPhonie.
4. Wybierz Udostępnij > Dodaj do ekranu początkowego.

PWA wymaga HTTPS (poza localhost). Samo otwarcie pliku index.html nie daje pełnej instalacji PWA.

NASTĘPNE ETAPY PRODUKCYJNE:
- backend i PostgreSQL/Supabase
- autoryzacja i role kupujący/sprzedawca/admin
- przechowywanie zdjęć i moderacja
- koszyk, zamówienia, statusy i historia transakcji
- integracja operatora marketplace z BLIK/kartami i podziałem środków
- weryfikacja sprzedawców, zwroty, reklamacje, audyt bezpieczeństwa
- dokumentacja prawna i podatkowa
