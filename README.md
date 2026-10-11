# Weather App

A lightweight, responsive web application for checking current weather conditions in cities worldwide.

## Features

- **City Search**: Search weather by city name using Open-Meteo's Geocoding API.
- **Current Weather Conditions**: View temperature (°C), weather conditions with emoji indicators, humidity (%), and wind speed (km/h).
- **Error Handling & Feedback**: Handles search loading states, timeouts, city not found errors, network connection issues, and service errors gracefully.
- **Dark Mode Support**: Automatically adapts to light and dark system themes (`prefers-color-scheme`).
- **Responsive & Accessible**: Clean mobile-first design with keyboard navigation and screen reader support.

## Technologies Used

- HTML5
- CSS3 (CSS Variables, Flexbox, Grid, Media Queries)
- JavaScript (Vanilla ES6+, Fetch API, Async/Await, AbortController)
- Data source: [Open-Meteo API](https://open-meteo.com/) (Free Weather & Geocoding APIs)

## Getting Started

1. Clone or download this repository.
2. Open `index.html` in any modern web browser.
3. Enter a city name in the search bar and press **Search** or hit **Enter**.

## Credits

Weather and geocoding data provided by [Open-Meteo](https://open-meteo.com/).
