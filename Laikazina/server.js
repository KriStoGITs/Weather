
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");


const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(data));
}

async function handleApi(url, response) {
 
  const endpoints = {
    "/api/weather": "data/2.5/weather",
    "/api/forecast": "data/2.5/forecast",
    "/api/cities": "geo/1.0/direct"
  };
  const endpoint = endpoints[url.pathname];
  if (!endpoint) {
    sendJson(response, 404, { message: "API adrese nav atrasta." });
    return;
  }

  const query = new URLSearchParams();
  if (url.pathname === "/api/cities") {
    const city = (url.searchParams.get("q") || "").trim();
    if (city.length < 2 || city.length > 100) {
      sendJson(response, 400, { message: "Ievadi pilsētas nosaukumu no 2 līdz 100 rakstzīmēm." });
      return;
    }
    query.set("q", city);
    query.set("limit", "5");
  } else {
    const latitudeText = url.searchParams.get("lat");
    const longitudeText = url.searchParams.get("lon");
    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);

    if (!latitudeText || !longitudeText || !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      sendJson(response, 400, { message: "Nederīgas pilsētas koordinātes." });
      return;
    }
    query.set("lat", String(latitude));
    query.set("lon", String(longitude));
    query.set("units", "metric");
    query.set("lang", "la");
  }

  const apiKey = (process.env.OPENWEATHER_API_KEY || "").trim();
  if (!apiKey) {
    sendJson(response, 503, { message: "Laikapstākļu pakalpojums nav konfigurēts. Sazinies ar lapas uzturētāju." });
    return;
  }

  query.set("appid", apiKey);
  const apiUrl = "https://api.openweathermap.org/" + endpoint + "?" + query;

  try {
    const result = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });
    if (!result.ok) {

      let message = "Laikapstākļu pakalpojums pašlaik nav pieejams.";
      if (result.status === 401 || result.status === 403) {
        message = "Laikapstākļu pakalpojuma piekļuve nav pieejama. Sazinies ar lapas uzturētāju.";
      }
      if (result.status === 429) {
        message = "Sasniegts laikapstākļu pieprasījumu limits. Mēģini vēlāk.";
      }
      sendJson(response, 502, { message: message });
      return;
    }

    const data = await result.json();
    sendJson(response, 200, data);
  } catch (error) {
    sendJson(response, 502, { message: "Neizdevās sazināties ar laikapstākļu pakalpojumu. Mēģini vēlreiz." });
  }
}

async function handleRequest(request, response) {
  try {
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Atļauti tikai GET pieprasījumi." });
      return;
    }

    const url = new URL(request.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) {
      await handleApi(url, response);
      return;
    }

 
    const files = new Map([
      ["/", ["index.html", "text/html; charset=utf-8"]],
      ["/index.html", ["index.html", "text/html; charset=utf-8"]],
      ["/style.css", ["style.css", "text/css; charset=utf-8"]],
      ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
      ["/icons.js", ["icons.js", "text/javascript; charset=utf-8"]]
    ]);
    const file = files.get(url.pathname);
    if (!file) {
      sendJson(response, 404, { message: "Lapa nav atrasta." });
      return;
    }

    const content = fs.readFileSync(path.join(__dirname, "dist", file[0]));
    response.writeHead(200, {
      "Content-Type": file[1],
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer"
    });
    response.end(content);
  } catch (error) {
    sendJson(response, 500, { message: "Servera kļūda. Mēģini vēlāk." });
  }
}

module.exports = { handleRequest };
if (require.main === module) {
  const port = Number(process.env.PORT || 4173);
  const host = process.env.HOST || "127.0.0.1";
  http.createServer(handleRequest).listen(port, host, function () {
    console.log("Laikaziņa darbojas: http://" + host + ":" + port);
  });
}
