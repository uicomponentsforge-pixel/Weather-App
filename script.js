(() => {
  const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
  const TIMEOUT_MS = 10000;

  const form = document.getElementById('search-form');
  const input = document.getElementById('city-input');
  const button = document.getElementById('search-btn');

  const views = {
    idle: document.getElementById('idle'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    result: document.getElementById('result'),
  };

  // WMO weather codes → label + emoji
  const CONDITIONS = {
    0: ['Clear sky', '☀️'],
    1: ['Mainly clear', '🌤️'],
    2: ['Partly cloudy', '⛅'],
    3: ['Overcast', '☁️'],
    45: ['Fog', '🌫️'],
    48: ['Freezing fog', '🌫️'],
    51: ['Light drizzle', '🌦️'],
    53: ['Drizzle', '🌦️'],
    55: ['Heavy drizzle', '🌧️'],
    56: ['Freezing drizzle', '🌧️'],
    57: ['Heavy freezing drizzle', '🌧️'],
    61: ['Light rain', '🌦️'],
    63: ['Rain', '🌧️'],
    65: ['Heavy rain', '🌧️'],
    66: ['Freezing rain', '🌧️'],
    67: ['Heavy freezing rain', '🌧️'],
    71: ['Light snow', '🌨️'],
    73: ['Snow', '🌨️'],
    75: ['Heavy snow', '❄️'],
    77: ['Snow grains', '❄️'],
    80: ['Light rain showers', '🌦️'],
    81: ['Rain showers', '🌧️'],
    82: ['Violent rain showers', '⛈️'],
    85: ['Light snow showers', '🌨️'],
    86: ['Heavy snow showers', '❄️'],
    95: ['Thunderstorm', '⛈️'],
    96: ['Thunderstorm with hail', '⛈️'],
    99: ['Severe thunderstorm with hail', '⛈️'],
  };

  // A custom error type lets the UI show a different message per failure
  class AppError extends Error {
    constructor(title, message) {
      super(message);
      this.title = title;
    }
  }

  let activeController = null; // so a newer search cancels an older one

  // ---------- UI state ----------
  function showState(name) {
    for (const [key, el] of Object.entries(views)) el.hidden = key !== name;
    const busy = name === 'loading';
    button.disabled = busy;
    button.textContent = busy ? 'Searching…' : 'Search';
  }

  function showError(title, message) {
    document.getElementById('error-title').textContent = title;
    document.getElementById('error-message').textContent = message;
    showState('error');
  }

  function showWeather(place, current) {
    const [label, icon] = CONDITIONS[current.weather_code] || ['Unknown conditions', '🌡️'];
    document.getElementById('place').textContent = place;
    document.getElementById('icon').textContent = icon;
    document.getElementById('temp').textContent = `${Math.round(current.temperature_2m)}°C`;
    document.getElementById('condition').textContent = label;
    document.getElementById('humidity').textContent = `${Math.round(current.relative_humidity_2m)}%`;
    document.getElementById('wind').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    showState('result');
  }

  // ---------- Fetch helpers ----------
  async function getJSON(url, signal) {
    let res;
    try {
      res = await fetch(url, { signal });
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      // fetch only rejects on network-level failures (offline, DNS, blocked)
      throw new AppError('No connection', 'Could not reach the weather service. Check your internet and try again.');
    }
    // fetch does NOT reject on 404/500, so check res.ok ourselves
    if (!res.ok) {
      throw new AppError('Service error', `The weather service returned an error (${res.status}). Try again in a moment.`);
    }
    try {
      return await res.json();
    } catch {
      throw new AppError('Unexpected response', 'The weather service sent data we could not read.');
    }
  }

  async function findCity(name, signal) {
    const url = `${GEO_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
    const data = await getJSON(url, signal);
    // Open-Meteo omits "results" entirely when nothing matches
    if (!data.results || data.results.length === 0) {
      throw new AppError('City not found', `No results for “${name}”. Check the spelling or try a nearby city.`);
    }
    return data.results[0];
  }

  async function getCurrentWeather(lat, lon, signal) {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
      timezone: 'auto',
    });
    const data = await getJSON(`${WEATHER_URL}?${params}`, signal);
    if (!data.current) {
      throw new AppError('No data', 'Weather data is not available for this location right now.');
    }
    return data.current;
  }

  // ---------- Main flow ----------
  async function search(cityName) {
    if (activeController) activeController.abort();
    const controller = new AbortController();
    activeController = controller;
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    showState('loading');

    try {
      const city = await findCity(cityName, controller.signal);
      const current = await getCurrentWeather(city.latitude, city.longitude, controller.signal);

      const place = [city.name, city.admin1, city.country].filter(Boolean).join(', ');
      showWeather(place, current);
    } catch (err) {
      if (err.name === 'AbortError') {
        // Aborted because a newer search started: let that one control the UI
        if (activeController !== controller) return;
        showError('Request timed out', 'The weather service took too long to respond. Try again.');
      } else if (err instanceof AppError) {
        showError(err.title, err.message);
      } else {
        showError('Something went wrong', 'An unexpected error occurred. Please try again.');
        console.error(err);
      }
    } finally {
      clearTimeout(timer);
      if (activeController === controller) activeController = null;
    }
  }

  // ---------- Events ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = input.value.trim();
    if (!city) {
      showError('Enter a city', 'Type a city name to search.');
      input.focus();
      return;
    }
    search(city);
  });

  showState('idle');
})();
