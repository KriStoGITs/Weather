# Laikaziņa

Responsīva laikapstākļu lietotne latviešu valodā ar HTML, CSS, JavaScript un īstiem Open-Meteo API pieprasījumiem.

## Palaišana

Atver `dist/index.html` pārlūkā. Nepieciešams internets; API atslēga nav vajadzīga. Var izmantot arī VS Code Live Server ar `dist` kā lapas direktoriju.

## Iespējas

- Pilsētu meklēšana ar rezultātu izvēli un ātrās pogas Latvijas pilsētām.
- Pašreizējā temperatūra, sajūtu temperatūra, laikapstākļu apraksts un SVG ikonas.
- Dienas minimālā un maksimālā temperatūra.
- Spiediens jūras līmenī (hPa), relatīvais mitrums (%), vēja ātrums (m/s) un virziens.
- Redzamība kilometros no tuvākās stundas prognozes ar norādītu laiku.
- Nākamo piecu dienu un tuvāko 24 stundu prognoze ar divu stundu soli.
- Atjaunošanas poga, ielādes un kļūdu paziņojumi, pēdējās pilsētas saglabāšana pārlūkā.
- Telefona un datora izkārtojumi, tastatūras vadība un pieejamas formas etiķetes.

## API

Pilsētu meklēšana: `https://geocoding-api.open-meteo.com/v1/search` ar `name`, `count`, `language=lv`, `format=json`.

Laikapstākļi: `https://api.open-meteo.com/v1/forecast` ar `latitude` un `longitude`.

`current`: `temperature_2m`, `relative_humidity_2m`, `apparent_temperature`, `is_day`, `weather_code`, `pressure_msl`, `wind_speed_10m`, `wind_direction_10m`.

`hourly`: `temperature_2m`, `visibility`, `weather_code`, `precipitation_probability`, `is_day`.

`daily`: `temperature_2m_max`, `temperature_2m_min`, `weather_code`.

Papildu parametri: `timezone=auto`, `forecast_days=6`, `wind_speed_unit=ms`. Laiki ir izvēlētās pilsētas vietējā laikā. Ikonas un latviskie laikapstākļu apraksti tiek izvēlēti pēc WMO koda. Redzamība no API tiek pārvērsta no metriem kilometros. Visi rādītāji ir API modeļu aprēķini.

Dokumentācija: https://open-meteo.com/en/docs un https://open-meteo.com/en/docs/geocoding-api. Vietu dati: GeoNames. Bezmaksas API paredzēts nekomerciālai lietošanai.

## Faili

- `dist/index.html` — lapas struktūra.
- `dist/style.css` — dizains un responsīvais izkārtojums.
- `dist/app.js` — API pieprasījumi, meklēšana, datu attēlošana un kļūdu apstrāde.
- `dist/icons.js` — SVG laikapstākļu ikonas un to izvēle pēc API koda.

## Kā lasīt kodu

Sāc ar `index.html`, lai redzētu lapas sadaļas. HTML elementu `id` savieno tos ar JavaScript, savukārt `class` nosaka CSS noformējumu.

`app.js` ir sakārtots sešās sadaļās: sākuma dati, palīgfunkcijas, datu attēlošana, API pieprasījumi, pilsētas saglabāšana un pogu darbības. Lietotne sāk darbu faila beigās ar `restoreCity()` un `loadWeather(selectedCity)`.

`loadWeather()` saņem datus no API un izsauc četras attēlošanas funkcijas: `showCurrentWeather()`, `showWeatherDetails()`, `showDailyForecast()` un `showHourlyForecast()`. Pilsētu meklēšanu veic `searchCity()`.

Izmantotas parastas funkcijas, `if` nosacījumi un `for` cikli. `async` un `await` ļauj sagaidīt API atbildi, bet `try`, `catch` un `finally` apstrādā kļūdas un atkal ieslēdz pogas. Kamēr notiek pieprasījums, pogas ir atspējotas, lai vairāku pilsētu atbildes nesajauktos.

Nav ietvaru, instalējamu atkarību vai būvēšanas soļa. Google Fonts neveiksmes gadījumā tiek izmantots sistēmas fonts.
