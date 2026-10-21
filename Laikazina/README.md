# Laikaziņa — API atslēga servera pusē

Laikapstākļu lietotne latviešu valodā ar HTML, CSS, JavaScript un nelielu Node.js serveri. OpenWeatherMap API atslēga atrodas tikai serverī.

## Palaišana datorā

Nepieciešams Node.js 20.12 vai jaunāks. Papildu bibliotēkas nav jāinstalē.

1. Iegūsti savu aktīvo OpenWeatherMap API atslēgu: https://home.openweathermap.org/api_keys.
2. Nokopē `.env.example` failu un kopijai piešķir nosaukumu `.env`.
3. `.env` failā aiz vienādības zīmes ieraksti savu atslēgu:

   ```env
   OPENWEATHER_API_KEY=tava_atslēga
   ```

4. Palaid `start.bat` vai projekta mapē izpildi `node server.js`.
5. Pārlūkā atver http://127.0.0.1:4173.

Pēc `.env` maiņas pārstartē serveri. Projekts vairs nedarbojas, vienkārši atverot `dist/index.html` vai izmantojot tikai Live Server: laikapstākļu pieprasījumus apkalpo Node.js serveris. Ja ports 4173 jau aizņemts, apturi iepriekšējo priekšskatījuma serveri vai iestati citu `PORT` vides mainīgo.

Atslēga nav iekļauta lejupielādējamajā projektā. Tā vienreiz jāievada servera `.env` failā, nevis lapā vai čatā.

## Kā tiek paslēpta atslēga

```text
Pārlūks → mūsu Node.js serveris → OpenWeatherMap API
         tikai koordinātes       appid + koordinātes
```

Pārlūka `app.js` vairs nesatur atslēgu un neveic tiešus laikapstākļu API pieprasījumus uz OpenWeatherMap. Tas pieprasa `/api/weather`, `/api/forecast` un `/api/cities` mūsu serverī.

`server.js` nolasa `process.env.OPENWEATHER_API_KEY` un tikai servera pusē pievieno to OpenWeatherMap pieprasījumam:

```js
query.set("appid", apiKey);
```

Pārlūks saņem laikapstākļu JSON datus. OpenWeatherMap kļūdu teksti un URL netiek pārsūtīti apmeklētājam. Serveris publiski izsniedz tikai `index.html`, `style.css`, `app.js` un `icons.js`; `.env` un `server.js` adreses atgriež 404. `.gitignore` neļauj `.env` failam nejauši nonākt Git repozitorijā.

Apmeklētājs nevar nolasīt šo atslēgu pārlūka pirmkodā, lapas laukos vai pārlūka tīkla pieprasījumos. Servera īpašnieks ar piekļuvi failiem vai hostinga iestatījumiem atslēgu joprojām var redzēt. Faila pārdēvēšana vai JavaScript teksta sajaukšana pati par sevi atslēgu nepaslēptu.

## Publicēšana

Nepieciešams hostings ar Node.js servera atbalstu. Hostinga vides mainīgajos iestati `OPENWEATHER_API_KEY`; atslēgu neievieto publiskajos failos. Palaides komanda ir `node server.js`. Serveris izmanto `PORT` un `HOST` vides mainīgos; izvietojot hostingā, parasti nepieciešams `HOST=0.0.0.0`. Pārlūks un API maršruti darbojas vienā vietnes adresē. Nepublicē projekta saknes mapi kā parastu failu direktoriju.

Ja iepriekšējā pārlūka versijā tava īstā atslēga jau tika publiski izplatīta, nomaini to OpenWeatherMap kontā: jaunā versija nevar izņemt atslēgu no jau lejupielādētām vecajām kopijām.

## Failu uzbūve

- `server.js` — statiskie faili, API maršruti, ievades pārbaude un servera atslēga.
- `.env.example` — konfigurācijas paraugs bez atslēgas.
- `.env` — tavs lokālais fails ar atslēgu; tas nav iekļauts piegādes arhīvā.
- `.gitignore` — izslēdz slepeno konfigurāciju no Git.
- `start.bat` — ērta palaišana Windows datorā.
- `dist/index.html` — lapas saturs.
- `dist/style.css` — noformējums.
- `dist/app.js` — meklēšana, datu pieprasījumi mūsu serverim un attēlošana.
- `dist/icons.js` — ikonas pēc API saņemtā ikonas koda.

## API un aprēķini

Serveris izmanto OpenWeatherMap Current Weather, 5 Day / 3 Hour Forecast un Geocoding API. Laikapstākļu pieprasījumos izmanto `units=metric` un `lang=la`.

- `main.temp`, `main.feels_like`, `main.temp_min`, `main.temp_max` — temperatūras °C.
- `main.pressure` — spiediens hPa; `main.humidity` — mitrums %.
- `visibility / 1000` — redzamība kilometros.
- `wind.speed`, `wind.deg` — vēja ātrums m/s un virziens grādos.
- `weather[0].description`, `weather[0].icon` — apraksts un ikona.
- `pop * 100` — nokrišņu varbūtība procentos.

Current Weather `temp_min` un `temp_max` ir min./maks. temperatūras pilsētā konkrētajā brīdī, nevis visas dienas galējās vērtības. Dienu kartītēs min./maks. aprēķināti no pieejamajiem 3 h prognozes punktiem; pēdējā diena var būt nepilna. Dienas ikonu un aprakstu izvēlamies no punkta, kas tuvāks vietējam pusdienlaikam. Pilsētas laiku iegūstam no `dt` un `timezone`. Noklusējuma pilsēta ir Valmiera; pēdējā izvēlētā pilsēta saglabājas localStorage.

Dokumentācija:
- https://openweathermap.org/api/current
- https://openweathermap.org/api/forecast5
- https://openweathermap.org/api/geocoding-api

Pārbaudes izmanto imitētas API atbildes un fiktīvu atslēgu. Reāliem laikapstākļu datiem serverī jāiestata sava aktīva atslēga.
