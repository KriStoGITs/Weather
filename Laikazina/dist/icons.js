// API atgriež ikonas kodu, piemēram, 01d (diena) vai 01n (nakts).
// Izmantojam paša OpenWeatherMap ikonu attēlus.
function getWeatherIcon(iconCode) {
  if (typeof iconCode !== "string" || !/^[0-9]{2}[dn]$/.test(iconCode)) {
    return "";
  }

  return '<img class="weather-icon" src="https://openweathermap.org/img/wn/'
    + iconCode + '@2x.png" alt="" aria-hidden="true">';
}
