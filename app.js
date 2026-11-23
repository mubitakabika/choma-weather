// ==========================================
// CHOMA WEATHER
// Created by TIVANNAH INNOVATIONS
// ==========================================

const LAT = -16.8065;
const LON = 27.0600;

const API = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max&timezone=Africa%2FLusaka&forecast_days=7`;

const $ = id => document.getElementById(id);

// ==========================================
// WEATHER ICONS AND CONDITIONS
// ==========================================

const weatherMap = {
    0: ['☀️', 'Clear sky'],
    1: ['🌤️', 'Mainly clear'],
    2: ['⛅', 'Partly cloudy'],
    3: ['☁️', 'Overcast'],
    45: ['🌫️', 'Fog'],
    48: ['🌫️', 'Depositing rime fog'],
    51: ['🌦️', 'Light drizzle'],
    53: ['🌦️', 'Drizzle'],
    55: ['🌧️', 'Dense drizzle'],
    56: ['🌧️', 'Freezing drizzle'],
    57: ['🌧️', 'Heavy freezing drizzle'],
    61: ['🌧️', 'Light rain'],
    63: ['🌧️', 'Rain'],
    65: ['🌧️', 'Heavy rain'],
    66: ['🌧️', 'Freezing rain'],
    67: ['🌧️', 'Heavy freezing rain'],
    71: ['🌨️', 'Light snow'],
    73: ['🌨️', 'Snow'],
    75: ['❄️', 'Heavy snow'],
    77: ['🌨️', 'Snow grains'],
    80: ['🌦️', 'Light rain showers'],
    81: ['🌧️', 'Rain showers'],
    82: ['⛈️', 'Heavy rain showers'],
    85: ['🌨️', 'Snow showers'],
    86: ['❄️', 'Heavy snow showers'],
    95: ['⛈️', 'Thunderstorm'],
    96: ['⛈️', 'Thunderstorm with hail'],
    99: ['⛈️', 'Severe thunderstorm']
};

function w(code) {
    return weatherMap[code] || ['🌡️', 'Weather conditions'];
}

function fmtTime(iso) {
    return iso?.slice(11, 16) || '--:--';
}

function dayName(iso, index) {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';

    return new Date(iso + 'T12:00:00')
        .toLocaleDateString('en', { weekday: 'short' });
}

function dateLong(iso) {
    return new Date(iso + 'T12:00:00')
        .toLocaleDateString('en', {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
        });
}

// ==========================================
// LOAD WEATHER DATA
// ==========================================

async function loadWeather() {

    $('status').textContent = 'Updating weather data…';

    $('refreshBtn').classList.add('spin');

    try {

        const res = await fetch(API, { cache: 'no-store' });

        if (!res.ok) {
            throw new Error('Weather service returned ' + res.status);
        }

        const d = await res.json();

        const c = d.current;
        const daily = d.daily;
        const hourly = d.hourly;

        if (!c || !daily || !hourly) {
            throw new Error('Weather data is incomplete');
        }

        // ==========================================
        // CURRENT WEATHER
        // ==========================================

        const [icon, desc] = w(c.weather_code);

        // ==========================================
        // DYNAMIC WEATHER BACKGROUND
        // ==========================================

        document.body.classList.remove(
            'weather-sunny',
            'weather-cloudy',
            'weather-partly',
            'weather-rain',
            'weather-storm',
            'weather-hot'
        );

        const code = c.weather_code;

        // THUNDERSTORMS

        if ([95, 96, 99].includes(code)) {

            document.body.classList.add('weather-storm');

        // RAIN AND SHOWERS

        } else if (
            [51, 53, 55, 56, 57, 61, 63, 65,
             66, 67, 80, 81, 82].includes(code)
        ) {

            document.body.classList.add('weather-rain');

        // PARTLY CLOUDY

        } else if ([2].includes(code)) {

            document.body.classList.add('weather-partly');

        // CLOUDY OR FOGGY

        } else if ([3, 45, 48].includes(code)) {

            document.body.classList.add('weather-cloudy');

        // SUNNY

        } else if ([0, 1].includes(code)) {

            document.body.classList.add('weather-sunny');

        }

        // HOT WEATHER EFFECT

        if (c.temperature_2m >= 32) {

            document.body.classList.add('weather-hot');

        }

        // ==========================================
        // DISPLAY WEATHER INFORMATION
        // ==========================================

        $('weatherIcon').textContent = icon;

        $('temperature').textContent =
            Math.round(c.temperature_2m) + '°';

        $('condition').textContent = desc;

        $('feels').textContent =
            Math.round(c.apparent_temperature) + '°C';

        $('humidity').textContent =
            (c.relative_humidity_2m ?? '--') + '%';

        $('wind').textContent =
            Math.round(c.wind_speed_10m ?? 0) + ' km/h';

        $('pressure').textContent =
            Math.round(c.surface_pressure ?? 0) + ' hPa';

        $('uv').textContent =
            daily.uv_index_max?.[0] ?? '--';

        $('todayDate').textContent =
            dateLong(daily.time?.[0]);

        $('sunrise').textContent =
            fmtTime(daily.sunrise?.[0]);

        $('sunset').textContent =
            fmtTime(daily.sunset?.[0]);

        $('rainToday').textContent =
            (daily.precipitation_probability_max?.[0] ?? 0) + '%';

        $('rainAmount').textContent =
            (daily.precipitation_sum?.[0] ?? 0) + ' mm';

        // ==========================================
        // UPDATED TIME
        // ==========================================

        const now = new Date();

        $('updated').textContent =
            'Updated ' +
            now.toLocaleTimeString('en-ZM', {
                hour: '2-digit',
                minute: '2-digit'
            });

        // ==========================================
        // FORECASTS
        // ==========================================

        renderHourly(hourly);

        renderDaily(daily);

        // RAIN ALERT

        updateRainAlert(hourly);

        // ==========================================
        // SUMMARY DATE SELECTOR
        // ==========================================

        setupSummaryPicker(daily.time);

        $('summaryBtn').onclick = () => {

            generateSummary(
                $('summaryDate').value,
                hourly,
                daily
            );

        };

        $('summaryDate').onchange = () => {

            generateSummary(
                $('summaryDate').value,
                hourly,
                daily
            );

        };

        generateSummary(
            $('summaryDate').value || daily.time[0],
            hourly,
            daily
        );

        // ==========================================
        // STATUS
        // ==========================================

        $('status').textContent =
            'Automatically refreshes every 10 minutes · Data by Open-Meteo';

    } catch (e) {

        $('status').textContent =
            'Could not load weather. Check your internet connection and try again.';

        console.error('Weather loading error:', e);

    } finally {

        $('refreshBtn').classList.remove('spin');

    }

}

// ==========================================
// HOURLY FORECAST
// ==========================================

function renderHourly(h) {

    if (!h || !Array.isArray(h.time)) {

        $('hourly').innerHTML =
            'Hourly forecast unavailable.';

        return;

    }

    const now = new Date();

    let start = h.time.findIndex(t =>
        new Date(t) >= new Date(now.getTime() - 30 * 60000)
    );

    if (start < 0) start = 0;

    $('hourly').innerHTML = Array.from(
        { length: 24 },
        (_, n) => {

            const i = start + n;

            if (i >= h.time.length) return '';

            const [ic] = w(h.weather_code?.[i]);

            const time = new Date(h.time[i])
                .toLocaleTimeString('en', {
                    hour: 'numeric'
                });

            const temperature =
                h.temperature_2m?.[i] ?? '--';

            const rain =
                h.precipitation_probability?.[i] ?? 0;

            return `
                <div class="hour">

                    <time>${n === 0 ? 'Now' : time}</time>

                    <div class="ico">${ic}</div>

                    <strong>${Math.round(temperature)}°</strong>

                    <small>💧 ${rain}%</small>

                </div>
            `;

        }
    ).join('');

}

// ==========================================
// SEVEN-DAY FORECAST
// ==========================================

function renderDaily(d) {

    if (!d || !Array.isArray(d.time)) {

        $('forecast').innerHTML =
            'Forecast unavailable.';

        return;

    }

    $('forecast').innerHTML = d.time.map((t, i) => {

        const [ic] = w(d.weather_code?.[i]);

        const high =
            d.temperature_2m_max?.[i] ?? '--';

        const low =
            d.temperature_2m_min?.[i] ?? '--';

        const rain =
            d.precipitation_probability_max?.[i] ?? 0;

        const amount =
            d.precipitation_sum?.[i] ?? 0;

        return `
            <div class="day">

                <div class="dayname">
                    ${dayName(t, i)}
                </div>

                <div class="ico">${ic}</div>

                <div class="range">
                    <strong>${Math.round(high)}°</strong>
                    <span class="low">${Math.round(low)}°</span>
                </div>

                <div class="rain">💧 ${rain}%</div>

                <small>${amount} mm</small>

            </div>
        `;

    }).join('');

}

// ==========================================
// SIX-HOUR RAIN ALERT
// ==========================================

function updateRainAlert(h) {

    const box = $('rainAlert');

    if (!box || !h || !Array.isArray(h.time)) return;

    const now = new Date();

    let start = h.time.findIndex(t =>
        new Date(t) >= new Date(now.getTime() - 30 * 60000)
    );

    if (start < 0) start = 0;

    const end = Math.min(start + 6, h.time.length);

    const periods = [];

    for (let i = start; i < end; i++) {

        const chance =
            h.precipitation_probability?.[i] ?? 0;

        const code =
            h.weather_code?.[i] ?? 0;

        if (
            chance >= 40 ||
            [51, 53, 55, 56, 57, 61, 63, 65,
             66, 67, 80, 81, 82, 95, 96, 99].includes(code)
        ) {

            periods.push({
                i,
                chance,
                code
            });

        }

    }

    const thunder = periods.some(p =>
        [95, 96, 99].includes(p.code)
    );

    const maxChance = Math.max(
        0,
        ...periods.map(p => p.chance)
    );

    let icon;
    let title;
    let message;
    let className;

    // ==========================================
    // THUNDERSTORM ALERT
    // ==========================================

    if (thunder) {

        icon = '⛈️';

        title = 'Thunderstorm possible';

        message =
            `Thunderstorm conditions may occur within the next 6 hours. Rain probability reaches ${maxChance}%.`;

        className = 'alert-storm';

    // ==========================================
    // HIGH RAIN CHANCE
    // ==========================================

    } else if (maxChance >= 70) {

        icon = '🔴';

        title = 'Rain likely';

        message =
            `Rain is likely within the next 6 hours. Probability reaches ${maxChance}%.`;

        className = 'alert-rain';

    // ==========================================
    // MODERATE RAIN CHANCE
    // ==========================================

    } else if (maxChance >= 40) {

        icon = '🟡';

        title = 'Showers possible';

        message =
            `There is a chance of showers within the next 6 hours. Probability reaches ${maxChance}%.`;

        className = 'alert-possible';

    // ==========================================
    // NO SIGNIFICANT RAIN
    // ==========================================

    } else {

        icon = '🟢';

        title = 'No rain expected';

        message =
            'No significant rain is indicated in the next 6 hours.';

        className = 'alert-clear';

    }

    // ==========================================
    // RAIN TIMING
    // ==========================================

    let timing = '';

    if (periods.length) {

        const first = periods[0].i;

        const last = periods[periods.length - 1].i;

        timing =
            ` Possible timing: ${fmtTime(h.time[first])}` +
            `${first !== last ? '–' + fmtTime(h.time[last]) : ''}.`;

    }

    // ==========================================
    // DISPLAY ALERT
    // ==========================================

    box.innerHTML = `
        <div class="rain-alert-icon">${icon}</div>

        <div class="rain-alert-text">

            <strong>${title}</strong>

            <p>${message}${timing}</p>

        </div>
    `;

    const panel = $('rainAlertPanel');

    if (panel) {

        panel.classList.remove(
            'alert-storm',
            'alert-rain',
            'alert-possible',
            'alert-clear'
        );

        panel.classList.add(className);

    }

}

// ==========================================
// SUMMARY DATE SELECTOR
// ==========================================

function setupSummaryPicker(days) {

    const sel = $('summaryDate');

    if (!sel || !Array.isArray(days)) return;

    const prior = sel.value;

    sel.innerHTML = days.map((date, i) => {

        return `
            <option value="${date}">
                ${dayName(date, i)} — ${dateLong(date)}
            </option>
        `;

    }).join('');

    if (days.includes(prior)) {

        sel.value = prior;

    }

}

// ==========================================
// GENERATE NATURAL-LANGUAGE WEATHER SUMMARY
// ==========================================

function generateSummary(date, h, d) {

    const story = $('weatherStory');

    if (!story) return;

    if (!date || !h || !d) {

        story.textContent =
            'Forecast information is not available yet.';

        return;

    }

    if (
        !Array.isArray(d.time) ||
        !Array.isArray(h.time) ||
        !Array.isArray(h.temperature_2m)
    ) {

        story.textContent =
            'Forecast data is incomplete. Please refresh the weather.';

        return;

    }

    const di = d.time.indexOf(date);

    if (di < 0) {

        story.textContent =
            'No forecast found for that date.';

        return;

    }

    // ==========================================
    // FIND HOURLY DATA FOR SELECTED DAY
    // ==========================================

    const ids = h.time
        .map((t, i) => t.slice(0, 10) === date ? i : -1)
        .filter(i => i >= 0);

    if (!ids.length) {

        story.textContent =
            'Hourly forecast data is unavailable for this day.';

        return;

    }

    // ==========================================
    // TEMPERATURES
    // ==========================================

    const max =
        Math.round(d.temperature_2m_max?.[di] ?? 0);

    const min =
        Math.round(d.temperature_2m_min?.[di] ?? 0);

    // ==========================================
    // WARMEST HOUR
    // ==========================================

    const peak = ids.reduce((best, i) => {

        const current =
            h.temperature_2m[i] ?? -999;

        const previous =
            h.temperature_2m[best] ?? -999;

        return current > previous ? i : best;

    }, ids[0]);

    const peakTime = fmtTime(h.time[peak]);

    // ==========================================
    // DATE LABEL
    // ==========================================

    const label = new Date(date + 'T12:00:00')
        .toLocaleDateString('en-ZM', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

    // ==========================================
    // GENERAL WEATHER DESCRIPTION
    // ==========================================

    let mood;

    if (max >= 32) {

        mood = 'very hot';

    } else if (max >= 28) {

        mood = 'hot';

    } else if (max >= 24) {

        mood = 'warm';

    } else if (max >= 19) {

        mood = 'mild';

    } else {

        mood = 'cool';

    }

    // ==========================================
    // RAIN FORECAST
    // ==========================================

    const rainProbability =
        Array.isArray(h.precipitation_probability)
            ? h.precipitation_probability
            : [];

    const rain = ids.filter(i =>
        (rainProbability[i] ?? 0) >= 45
    );

    const groups = [];

    rain.forEach(i => {

        const last = groups[groups.length - 1];

        if (
            last &&
            i - last[last.length - 1] <= 1
        ) {

            last.push(i);

        } else {

            groups.push([i]);

        }

    });

    let rainSummary;

    if (groups.length) {

        rainSummary = groups.map(g => {

            const chance = Math.max(
                ...g.map(i => rainProbability[i] ?? 0)
            );

            const phrase = chance >= 70
                ? 'rain or showers are likely'
                : 'showers are possible';

            return `${phrase} from around ${fmtTime(h.time[g[0]])} to ${fmtTime(h.time[g[g.length - 1]])} (chance up to ${chance}%)`;

        }).join('; ');

    } else {

        rainSummary =
            'no significant rain is indicated in the hourly forecast';

    }

    // ==========================================
    // EVENING TEMPERATURE
    // ==========================================

    const evening = ids.filter(i =>
        Number(h.time[i].slice(11, 13)) >= 17
    );

    const eveningT = evening.length
        ? Math.round(
            h.temperature_2m[
                evening[evening.length - 1]
            ] ?? min
        )
        : min;

    // ==========================================
    // MOST COMMON WEATHER CONDITION
    // ==========================================

    const count = {};

    ids.forEach(i => {

        const desc =
            w(h.weather_code?.[i])[1].toLowerCase();

        count[desc] = (count[desc] || 0) + 1;

    });

    const common = Object.entries(count)
        .sort((a, b) => b[1] - a[1])[0]?.[0]
        || 'variable weather';

    // ==========================================
    // FINAL SUMMARY
    // ==========================================

    story.textContent =
        `${label}: It is expected to be ${mood}, reaching about ${max}°C around ${peakTime}. ` +
        `The minimum temperature is forecast at ${min}°C. ` +
        `${rainSummary}. ` +
        `Overall, ${common} conditions are expected, before cooling towards the evening to around ${eveningT}°C.`;

}

// ==========================================
// BUTTONS AND AUTOMATIC UPDATES
// ==========================================

$('refreshBtn').addEventListener('click', loadWeather);

loadWeather();

setInterval(loadWeather, 10 * 60 * 1000);

// ==========================================
// SERVICE WORKER
// ==========================================

if (
    'serviceWorker' in navigator &&
    location.protocol.startsWith('http')
) {

    navigator.serviceWorker
        .register('./sw.js')
        .catch(console.warn);

}
