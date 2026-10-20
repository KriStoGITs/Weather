// SVG ir attēlu apraksti. Ikonu izvēlamies pēc API laikapstākļu koda.
function getWeatherIcon(code, isDay = true) {
  const sun = `<g stroke="#dfaf58" stroke-width="3.5" stroke-linecap="round"><path d="M50 10v8m0 64v8M10 50h8m64 0h8M22 22l6 6m44 44 6 6M22 78l6-6m44-44 6-6"/></g><circle cx="50" cy="50" r="23" fill="#f4cf7e"/>`;
  const moon = `<path d="M66 18a32 32 0 1 0 16 49A31 31 0 0 1 66 18" fill="#a3bbc9"/>`;
  const cloud = `<path d="M25 72C5 72 6 44 25 44c1-22 37-26 44-3 25-3 32 31 7 31Z" fill="#f8fcfd" stroke="#a9c4d0" stroke-width="1.5"/>`;

  let sky = moon;
  if (isDay) {
    sky = sun;
  }

  let picture = cloud;

  if (code === 0) {
    picture = sky;
  } else if (code === 1 || code === 2) {
    picture = '<g transform="translate(9,-7) scale(.8)">' + sky + '</g>' + cloud;
  } else if (code === 3) {
    picture = '<g transform="translate(10,-12)">' + cloud + '</g>' + cloud;
  } else if ([45, 48].includes(code)) {
    picture = cloud + '<path d="M18 82h63M25 91h49" stroke="#9bb5bf" stroke-width="4" stroke-linecap="round"/>';
  } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
    picture = cloud + '<g fill="#89b9cd"><circle cx="30" cy="85" r="3"/><circle cx="50" cy="90" r="3"/><circle cx="70" cy="83" r="3"/></g>';
  } else if ([95, 96, 99].includes(code)) {
    picture = cloud + '<path d="M51 65 39 84h12l-5 14 22-26H54l7-7" fill="#e4b85e"/>';
  } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    picture = cloud + '<path d="m29 82-3 8m25-8-3 8m25-8-3 8" stroke="#76a8c0" stroke-width="4" stroke-linecap="round"/>';
  }

  return '<svg class="weather-icon" viewBox="0 0 100 100" aria-hidden="true">' + picture + '</svg>';
}
