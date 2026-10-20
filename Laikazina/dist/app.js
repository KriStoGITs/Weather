// 1. Sākuma dati un lapas elementi

let selectedCity = {
  name: "Rīga",
  country: "Latvija",
  latitude: 56.9496,
  longitude: 24.1052
};

let isLoading = false;

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city");
const searchResults = document.getElementById("results");
const refreshButton = document.getElementById("refresh");

// 2. Palīgfunkcijas

function setText(id, text) {
  document.getElementById(id).textContent = text;
}

function formatNumber(value, decimalPlaces = 0) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return value.toLocaleString("lv-LV", {
    maximumFractionDigits: decimalPlaces
  });
}

function showStatus(message, isError = false) {
  const status = document.getElementById("status");
  status.textContent = message;

  if (isError) {
    status.className = "error";
  } else {
    status.className = "";
  }
}

// Vienlaikus veicam vienu pieprasījumu, lai pilsētu dati nesajauktos.
function setLoading(loading) {
  isLoading = loading;
  cityInput.disabled = loading;
  document.getElementById("weather").setAttribute("aria-busy", String(loading));

  const buttons = document.querySelectorAll("button");
  for (const button of buttons) {
    button.disabled = loading;
  }
}

async function getApiData(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("API kļūda: " + response.status);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.reason);
  }

  return data;
}

function getWeatherDescription(code, isDay = true) {
  if (code === 0) {
    if (isDay) {
      return "Skaidrs un saulains";
    }
    return "Skaidra nakts";
  }

  if (code === 1) return "Pārsvarā skaidrs";
  if (code === 2) return "Daļēji mākoņains";
  if (code === 3) return "Apmācies";
  if ([45, 48].includes(code)) return "Migla";
  if ([51, 53, 55].includes(code)) return "Smidzinošs lietus";
  if ([56, 57, 66, 67].includes(code)) return "Sasalstoši nokrišņi";
  if ([61, 63, 65].includes(code)) return "Lietus";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Sniegs";
  if ([80, 81, 82].includes(code)) return "Lietusgāzes";
  if ([95, 96, 99].includes(code)) return "Pērkona negaiss";

  return "Laikapstākļi nav zināmi";
}

// API dod pilsētas vietējo laiku bez laika joslas apzīmējuma.
// UTC šeit izmantojam tikai formatēšanai, lai pārlūks nemainītu datumu.
function formatDate(dateText, options) {
  const date = new Date(dateText + "Z");
  options.timeZone = "UTC";
  return date.toLocaleDateString("lv-LV", options);
}

function findNearestHour(times, currentTime) {
  let nearestIndex = 0;
  let smallestDifference = Infinity;

  for (let i = 0; i < times.length; i++) {
    const difference = Math.abs(new Date(times[i] + "Z") - new Date(currentTime + "Z"));

    if (difference < smallestDifference) {
      smallestDifference = difference;
      nearestIndex = i;
    }
  }

  return nearestIndex;
}

// 3. Laikapstākļu attēlošana

function showCurrentWeather(data, city) {
  const current = data.current;
  const daily = data.daily;
  const todayIndex = daily.time.indexOf(current.time.slice(0, 10));
  let dateText = formatDate(current.time, {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  if (city.country) {
    dateText += " · " + city.country;
  }

  setText("location", city.name);
  setText("date", dateText);
  setText("temperature", formatNumber(current.temperature_2m));
  setText("condition", getWeatherDescription(current.weather_code, current.is_day === 1));
  setText("min", formatNumber(daily.temperature_2m_min[todayIndex]));
  setText("max", formatNumber(daily.temperature_2m_max[todayIndex]));
  setText("feels", formatNumber(current.apparent_temperature) + " °C");

  document.getElementById("hero-icon").innerHTML = getWeatherIcon(current.weather_code, current.is_day === 1);
  setText("updated", "ATJAUNOTS " + current.time.slice(11, 16) + " · VIETĒJAIS LAIKS");
}

function showWeatherDetails(data) {
  const current = data.current;
  const hourly = data.hourly;
  const windDirection = current.wind_direction_10m;
  const directions = ["Z", "ZA", "A", "DA", "D", "DR", "R", "ZR"];

  setText("wind", formatNumber(current.wind_speed_10m, 1));
  setText("humidity", formatNumber(current.relative_humidity_2m));
  setText("pressure", formatNumber(current.pressure_msl));

  if (Number.isFinite(windDirection)) {
    const directionIndex = Math.round(windDirection / 45) % 8;
    setText("wind-note", "No " + directions[directionIndex] + " · " + formatNumber(windDirection) + "°");
    document.getElementById("wind-arrow").style.transform = "rotate(" + (windDirection + 180) + "deg)";
  } else {
    setText("wind-note", "Vēja virziens nav pieejams");
    document.getElementById("wind-arrow").style.transform = "";
  }

  const humidityBar = document.getElementById("humidity-bar");
  humidityBar.style.width = "0%";
  if (Number.isFinite(current.relative_humidity_2m)) {
    humidityBar.style.width = current.relative_humidity_2m + "%";
  }

  // Redzamība pieejama stundu prognozē. API metrus pārvēršam kilometros.
  const hourIndex = findNearestHour(hourly.time, current.time);
  const visibility = hourly.visibility[hourIndex];
  let visibilityText = "Dati nav pieejami";

  if (Number.isFinite(visibility)) {
    setText("visibility", formatNumber(visibility / 1000, 1));

    if (visibility >= 10000) {
      visibilityText = "Laba redzamība";
    } else if (visibility >= 1000) {
      visibilityText = "Ierobežota redzamība";
    } else {
      visibilityText = "Ļoti zema redzamība";
    }
  } else {
    setText("visibility", "—");
  }

  setText("visibility-note", visibilityText);
  setText("visibility-time", "Stundas prognoze · " + hourly.time[hourIndex].slice(11, 16));
}

function showDailyForecast(data) {
  const daily = data.daily;
  const todayIndex = daily.time.indexOf(data.current.time.slice(0, 10));
  const container = document.getElementById("daily");
  container.innerHTML = "";

  for (let i = todayIndex + 1; i < Math.min(daily.time.length, todayIndex + 6); i++) {
    let dayName = formatDate(daily.time[i] + "T12:00:00", { weekday: "long" });
    if (i === todayIndex + 1) {
      dayName = "Rīt";
    }

    const row = document.createElement("div");
    row.className = "day-row";
    row.innerHTML = `
      <span class="day-name">
        ${dayName}
        <small>${getWeatherDescription(daily.weather_code[i])}</small>
      </span>
      <span>${getWeatherIcon(daily.weather_code[i])}</span>
      <span class="day-temps">
        <span>${formatNumber(daily.temperature_2m_min[i])}°</span>
        ${formatNumber(daily.temperature_2m_max[i])}°
      </span>
    `;
    container.append(row);
  }
}

function showHourlyForecast(data) {
  const hourly = data.hourly;
  const container = document.getElementById("hourly");
  container.innerHTML = "";

  let startIndex = hourly.time.findIndex(function (time) {
    return time >= data.current.time;
  });

  if (startIndex === -1) {
    startIndex = findNearestHour(hourly.time, data.current.time);
  }

  // Rādām tuvākās 24 stundas ar divu stundu soli.
  for (let i = startIndex; i < Math.min(hourly.time.length, startIndex + 24); i += 2) {
    const isDay = hourly.is_day[i] === 1;
    const hour = document.createElement("div");
    hour.className = "hour";
    hour.title = getWeatherDescription(hourly.weather_code[i], isDay);
    hour.innerHTML = `
      <p>${hourly.time[i].slice(11, 16)}</p>
      ${getWeatherIcon(hourly.weather_code[i], isDay)}
      <strong>${formatNumber(hourly.temperature_2m[i])}°</strong>
      <small>${formatNumber(hourly.precipitation_probability[i])}% nokrišņi</small>
    `;
    container.append(hour);
  }
}

// 4. Datu ielāde no API

async function loadWeather(city) {
  if (isLoading) return;

  clearSearchResults();
  setLoading(true);
  showStatus("Ielādē laikapstākļus: " + city.name + "…");

  const parameters = new URLSearchParams({
    latitude: city.latitude,
    longitude: city.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m",
    hourly: "temperature_2m,visibility,weather_code,precipitation_probability,is_day",
    daily: "temperature_2m_max,temperature_2m_min,weather_code",
    wind_speed_unit: "ms",
    timezone: "auto",
    forecast_days: "6"
  });

  try {
    const data = await getApiData("https://api.open-meteo.com/v1/forecast?" + parameters);

    showCurrentWeather(data, city);
    showWeatherDetails(data);
    showDailyForecast(data);
    showHourlyForecast(data);

    selectedCity = city;
    saveCity(city);
    showStatus("Prognoze: " + data.timezone + " · Aktuālie API dati");
  } catch (error) {
    showStatus("Neizdevās ielādēt datus. Pārbaudi interneta savienojumu un mēģini vēlreiz ar ↻.", true);
  } finally {
    setLoading(false);
  }
}

function clearSearchResults() {
  searchResults.innerHTML = "";
  searchResults.hidden = true;
}

function showSearchResults(cities) {
  for (const city of cities) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = city.name;

    if (city.admin1) button.textContent += ", " + city.admin1;
    if (city.country) button.textContent += ", " + city.country;

    button.addEventListener("click", function () {
      cityInput.value = "";
      loadWeather(city);
    });

    searchResults.append(button);
  }

  searchResults.hidden = false;
}

async function searchCity(event) {
  event.preventDefault();
  const cityName = cityInput.value.trim();
  if (cityName.length < 2 || isLoading) return;

  clearSearchResults();
  setLoading(true);
  showStatus("Meklē pilsētu…");

  const parameters = new URLSearchParams({
    name: cityName,
    count: "6",
    language: "lv",
    format: "json"
  });

  try {
    const data = await getApiData("https://geocoding-api.open-meteo.com/v1/search?" + parameters);

    if (!data.results || data.results.length === 0) {
      showStatus("Pilsēta nav atrasta. Izmēģini citu nosaukumu.", true);
      return;
    }

    showSearchResults(data.results);
    showStatus("Izvēlies pilsētu meklēšanas rezultātos.");
  } catch (error) {
    showStatus("Meklēšana neizdevās. Mēģini vēlreiz.", true);
  } finally {
    setLoading(false);
  }
}

// 5. Pēdējās pilsētas saglabāšana pārlūkā

function saveCity(city) {
  try {
    localStorage.setItem("laikazina-place", JSON.stringify(city));
  } catch (error) {
    // Lietotne darbojas arī tad, ja pārlūks neatļauj datu saglabāšanu.
  }
}

function restoreCity() {
  try {
    const city = JSON.parse(localStorage.getItem("laikazina-place"));
    if (!city) return;
    if (typeof city.name !== "string") return;
    if (!Number.isFinite(city.latitude) || !Number.isFinite(city.longitude)) return;
    if (Math.abs(city.latitude) > 90 || Math.abs(city.longitude) > 180) return;

    selectedCity = city;
  } catch (error) {
    // Ja saglabātie dati nav derīgi, sākumā paliek Rīga.
  }
}

// 6. Pogu darbības un lietotnes palaišana

searchForm.addEventListener("submit", searchCity);

refreshButton.addEventListener("click", function () {
  loadWeather(selectedCity);
});

const quickCityButtons = document.querySelectorAll("[data-city]");
for (const button of quickCityButtons) {
  button.addEventListener("click", function () {
    const city = {
      name: button.dataset.city,
      country: "Latvija",
      latitude: Number(button.dataset.lat),
      longitude: Number(button.dataset.lon)
    };

    loadWeather(city);
  });
}

cityInput.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    clearSearchResults();
  }
});

document.addEventListener("click", function (event) {
  if (!event.target.closest(".search-area")) {
    clearSearchResults();
  }
});

restoreCity();
loadWeather(selectedCity);
