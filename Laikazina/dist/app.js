
let selectedCity = {
  name: "Valmiera",
  country: "Latvija",
  latitude: 57.5411,
  longitude: 25.4275
};

let isLoading = false;

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city");
const searchResults = document.getElementById("results");
const refreshButton = document.getElementById("refresh");

function setText(id, text) {
  document.getElementById(id).textContent = text;
}

function formatNumber(value, decimalPlaces = 0) {
  if (!Number.isFinite(value)) return "—";

  return value.toLocaleString("lv-LV", {
    maximumFractionDigits: decimalPlaces
  });
}

function showStatus(message, isError = false) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = "";
  if (isError) status.className = "error";
}

function setLoading(loading) {
  isLoading = loading;
  cityInput.disabled = loading;
  document.getElementById("weather").setAttribute("aria-busy", String(loading));

  for (const button of document.querySelectorAll("button")) {
    button.disabled = loading;
  }
}

async function getApiData(path, parameters) {
  const query = new URLSearchParams(parameters);
  const response = await fetch(path + "?" + query);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Neizdevās saņemt laikapstākļu datus.");
  }

  return data;
}


function getLocalDate(timestamp, timezone) {
  return new Date((timestamp + timezone) * 1000);
}

function getDateKey(timestamp, timezone) {
  return getLocalDate(timestamp, timezone).toISOString().slice(0, 10);
}

function getLocalTime(timestamp, timezone) {
  return getLocalDate(timestamp, timezone).toISOString().slice(11, 16);
}



function showCurrentWeather(data, city) {
  const weather = data.weather[0];
  let dateText = getLocalDate(data.dt, data.timezone).toLocaleDateString("lv-LV", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC"
  });

  if (city.country) dateText += " · " + city.country;

  setText("location", city.name);
  setText("date", dateText);
  setText("temperature", formatNumber(data.main.temp));
  setText("condition", weather.description);
  setText("feels", formatNumber(data.main.feels_like) + " °C");


  setText("min", formatNumber(data.main.temp_min));
  setText("max", formatNumber(data.main.temp_max));
  document.getElementById("hero-icon").innerHTML = getWeatherIcon(weather.icon);
  setText("updated", "ATJAUNOTS " + getLocalTime(data.dt, data.timezone) + " · VIETĒJAIS LAIKS");
}

function showWeatherDetails(data) {
  const directions = ["Z", "ZA", "A", "DA", "D", "DR", "R", "ZR"];
  const windDirection = data.wind.deg;

  setText("wind", formatNumber(data.wind.speed, 1));
  setText("humidity", formatNumber(data.main.humidity));
  setText("pressure", formatNumber(data.main.pressure));

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
  if (Number.isFinite(data.main.humidity)) {
    humidityBar.style.width = data.main.humidity + "%";
  }

  let visibilityText = "Dati nav pieejami";
  setText("visibility", "—");

  if (Number.isFinite(data.visibility)) {
    setText("visibility", formatNumber(data.visibility / 1000, 1));
    if (data.visibility >= 10000) {
      visibilityText = "Laba redzamība";
    } else if (data.visibility >= 1000) {
      visibilityText = "Ierobežota redzamība";
    } else {
      visibilityText = "Ļoti zema redzamība";
    }
  }

  setText("visibility-note", visibilityText);
  setText("visibility-time", "Pašreizējie dati · " + getLocalTime(data.dt, data.timezone));
}


function showDailyForecast(forecast, current) {
  const container = document.getElementById("daily");
  container.innerHTML = "";
  const days = {};
  const today = getDateKey(current.dt, current.timezone);

  for (const item of forecast.list) {
    const date = getDateKey(item.dt, current.timezone);
    if (date <= today) continue;

    if (!days[date]) days[date] = [];
    days[date].push(item);
  }

  let dayCount = 0;
  for (const date in days) {
    if (dayCount === 5) break;
    const items = days[date];
    let minimum = items[0].main.temp;
    let maximum = items[0].main.temp;
    let representative = items[0];

    for (const item of items) {
      minimum = Math.min(minimum, item.main.temp);
      maximum = Math.max(maximum, item.main.temp);

      const hour = getLocalDate(item.dt, current.timezone).getUTCHours();
      const selectedHour = getLocalDate(representative.dt, current.timezone).getUTCHours();
      if (Math.abs(hour - 12) < Math.abs(selectedHour - 12)) {
        representative = item;
      }
    }

    const dayName = new Date(date + "T12:00:00Z").toLocaleDateString("lv-LV", {
      weekday: "long",
      timeZone: "UTC"
    });
    const row = document.createElement("div");
    row.className = "day-row";
    row.title = "Min./maks. no pieejamajiem šīs dienas 3 h prognozes punktiem; pēdējā diena var būt nepilna.";
    const label = document.createElement("span");
    label.className = "day-name";
    label.textContent = dayName;
    const description = document.createElement("small");
    description.textContent = representative.weather[0].description;
    label.append(description);
    const symbol = document.createElement("span");
    symbol.innerHTML = getWeatherIcon(representative.weather[0].icon);
    const temperatures = document.createElement("span");
    temperatures.className = "day-temps";
    temperatures.innerHTML = "<span>" + formatNumber(minimum) + "°</span>" + formatNumber(maximum) + "°";
    row.append(label, symbol, temperatures);
    container.append(row);
    dayCount++;
  }

  if (dayCount === 0) container.textContent = "Dienu prognoze nav pieejama.";
}

function showHourlyForecast(forecast, current) {
  const container = document.getElementById("hourly");
  container.innerHTML = "";

  for (const item of forecast.list) {
    if (item.dt < current.dt) continue;
    if (item.dt >= current.dt + 24 * 60 * 60) break;

    const hour = document.createElement("div");
    hour.className = "hour";
    hour.title = item.weather[0].description;
    // API nokrišņu varbūtība ir 0–1; pārvēršam to procentos.
    let probability = "—";
    if (Number.isFinite(item.pop)) probability = formatNumber(item.pop * 100);
    hour.innerHTML = `
      <p>${getLocalTime(item.dt, current.timezone)}</p>
      ${getWeatherIcon(item.weather[0].icon)}
      <strong>${formatNumber(item.main.temp)}°</strong>
      <small>${probability}% nokrišņi</small>
    `;
    container.append(hour);
  }

  if (container.children.length === 0) container.textContent = "Stundu prognoze nav pieejama.";
}

async function loadWeather(city) {
  if (isLoading) return;

  clearSearchError();
  clearSearchResults();
  setLoading(true);
  showStatus("Ielādē laikapstākļus: " + city.name + "…");
  const parameters = {
    lat: city.latitude,
    lon: city.longitude
  };

  try {
    const current = await getApiData("/api/weather", parameters);
    showCurrentWeather(current, city);
    showWeatherDetails(current);
    document.getElementById("weather").hidden = false;
    selectedCity = city;
    saveCity(city);

    setText("daily", "Ielādē prognozi…");
    setText("hourly", "Ielādē prognozi…");
    try {
      const forecast = await getApiData("/api/forecast", parameters);
      showDailyForecast(forecast, current);
      showHourlyForecast(forecast, current);
      showStatus("Dati no OpenWeatherMap · Prognoze ar 3 stundu soli");
    } catch (error) {
      setText("daily", "Prognozi neizdevās ielādēt.");
      setText("hourly", "Prognozi neizdevās ielādēt.");
      showStatus("Pašreizējie dati ielādēti. " + error.message, true);
    }
  } catch (error) {
    showStatus(error.message, true);
  } finally {
    setLoading(false);
  }
}

// 5. Pilsētu meklēšana

function clearSearchError() {
  const error = document.getElementById("search-error");
  error.textContent = "";
  error.hidden = true;
  cityInput.setAttribute("aria-invalid", "false");
}

function clearSearchResults() {
  searchResults.innerHTML = "";
  searchResults.hidden = true;
}

async function searchCity(event) {
  event.preventDefault();
  if (isLoading) return;
  const cityName = cityInput.value.trim();
  if (cityName.length < 2) return;

  clearSearchError();
  clearSearchResults();
  setLoading(true);
  showStatus("Meklē pilsētu…");

  try {
    const cities = await getApiData("/api/cities", { q: cityName });
    if (cities.length === 0) {
      const error = document.getElementById("search-error");
      error.textContent = "Pilsēta nav atrasta. Izmēģini citu nosaukumu.";
      error.hidden = false;
      cityInput.setAttribute("aria-invalid", "true");
      showStatus("");
      return;
    }

    for (const result of cities) {
      let name = result.name;
      if (result.local_names && result.local_names.lv) name = result.local_names.lv;
      const city = {
        name: name,
        country: result.country,
        latitude: result.lat,
        longitude: result.lon
      };
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = name + ", " + result.country;
      if (result.state) button.textContent += ", " + result.state;
      button.addEventListener("click", function () {
        cityInput.value = "";
        loadWeather(city);
      });
      searchResults.append(button);
    }

    searchResults.hidden = false;
    showStatus("Izvēlies pilsētu meklēšanas rezultātos.");
  } catch (error) {
    showStatus(error.message, true);
  } finally {
    setLoading(false);
  }
}



function saveCity(city) {
  try {
    localStorage.setItem("laikazina-place", JSON.stringify(city));
  } catch (error) {
  }
}

function restoreCity() {
  try {
    const city = JSON.parse(localStorage.getItem("laikazina-place"));
    if (!city || typeof city.name !== "string") return;
    if (!Number.isFinite(city.latitude) || !Number.isFinite(city.longitude)) return;
    if (Math.abs(city.latitude) > 90 || Math.abs(city.longitude) > 180) return;
    selectedCity = city;
  } catch (error) {
  }
}

searchForm.addEventListener("submit", searchCity);
refreshButton.addEventListener("click", function () {
  loadWeather(selectedCity);
});

for (const button of document.querySelectorAll("[data-city]")) {
  button.addEventListener("click", function () {
    loadWeather({
      name: button.dataset.city,
      country: "Latvija",
      latitude: Number(button.dataset.lat),
      longitude: Number(button.dataset.lon)
    });
  });
}

cityInput.addEventListener("keydown", function (event) {
  if (event.key === "Escape") clearSearchResults();
});

cityInput.addEventListener("input", clearSearchError);

document.addEventListener("click", function (event) {
  if (!event.target.closest(".search-area")) clearSearchResults();
});

restoreCity();
setText("location", selectedCity.name);
loadWeather(selectedCity);
