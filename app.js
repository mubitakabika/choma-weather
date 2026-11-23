// ==========================================
// CHOMA WEATHER
// Created by TIVANNAH INNOVATIONS
// ==========================================

const LAT = -16.8065;
const LON = 27.0600;

const API = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max&timezone=Africa%2FLusaka&forecast_days=7`;

const $ = id => document.getElementById(id);

let latestWeatherData = null;
let weatherSoundEnabled = false;


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
    if (!iso) return '--';

    return new Date(iso + 'T12:00:00')
        .toLocaleDateString('en', {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
        });
}


// ==========================================
// ROTATING WEATHER SCENES
// IMPORTANT:
// These scenes rotate independently of
// the actual weather forecast.
// ==========================================

const weatherScenes = [
    'weather-sunny',
    'weather-rain',
    'weather-storm',
    'weather-cloudy',
    'weather-partly'
];

let currentScene = '';

function rotateWeatherScene() {

    let previousIndex = -1;

    try {
        previousIndex = Number(
            localStorage.getItem('chomaWeatherSceneIndex')
        );

        if (
            !Number.isInteger(previousIndex) ||
            previousIndex < 0 ||
            previousIndex >= weatherScenes.length
        ) {
            previousIndex = -1;
        }

    } catch (error) {
        previousIndex = -1;
    }

    const nextIndex =
        (previousIndex + 1) % weatherScenes.length;

    currentScene = weatherScenes[nextIndex];

    try {
        localStorage.setItem(
            'chomaWeatherSceneIndex',
            String(nextIndex)
        );
    } catch (error) {
        console.warn('Could not save scene rotation:', error);
    }

    document.body.classList.remove(
        ...weatherScenes,
        'weather-hot'
    );

    document.body.classList.add(currentScene);

    // If sound is already enabled, change it
    // to match the newly selected scene.

    if (weatherSoundEnabled) {
        startSceneSound(currentScene);
    }

}


// Rotate immediately when the app opens.

rotateWeatherScene();


// ==========================================
// LOAD WEATHER DATA
// ==========================================

async function loadWeather() {

    const status = $('status');
    const refreshButton = $('refreshBtn');

    if (status) {
        status.textContent = 'Updating weather data…';
    }

    if (refreshButton) {
        refreshButton.classList.add('spin');
    }

    try {

        const res = await fetch(API, {
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(
                'Weather service returned ' + res.status
            );
        }

        const d = await res.json();

        const c = d.current;
        const daily = d.daily;
        const hourly = d.hourly;

        if (!c || !daily || !hourly) {
            throw new Error('Weather data is incomplete');
        }

        // Make the latest forecast available
        // to all advisory features.

        latestWeatherData = {
            current: c,
            daily: daily,
            hourly: hourly
        };

        // ==========================================
        // CURRENT WEATHER
        // ==========================================

        const [icon, desc] = w(c.weather_code);

        // IMPORTANT:
        // The background is NOT changed here.
        // It rotates independently on page reload
        // or when the user presses refresh.

        // ==========================================
        // DISPLAY WEATHER INFORMATION
        // ==========================================

        if ($('weatherIcon')) {
            $('weatherIcon').textContent = icon;
        }

        if ($('temperature')) {
            $('temperature').textContent =
                Math.round(c.temperature_2m) + '°';
        }

        if ($('condition')) {
            $('condition').textContent = desc;
        }

        if ($('feels')) {
            $('feels').textContent =
                Math.round(c.apparent_temperature) + '°C';
        }

        if ($('humidity')) {
            $('humidity').textContent =
                (c.relative_humidity_2m ?? '--') + '%';
        }

        if ($('wind')) {
            $('wind').textContent =
                Math.round(c.wind_speed_10m ?? 0) + ' km/h';
        }

        if ($('pressure')) {
            $('pressure').textContent =
                Math.round(c.surface_pressure ?? 0) + ' hPa';
        }

        if ($('uv')) {
            $('uv').textContent =
                daily.uv_index_max?.[0] ?? '--';
        }

        if ($('todayDate')) {
            $('todayDate').textContent =
                dateLong(daily.time?.[0]);
        }

        if ($('sunrise')) {
            $('sunrise').textContent =
                fmtTime(daily.sunrise?.[0]);
        }

        if ($('sunset')) {
            $('sunset').textContent =
                fmtTime(daily.sunset?.[0]);
        }

        if ($('rainToday')) {
            $('rainToday').textContent =
                (daily.precipitation_probability_max?.[0] ?? 0) + '%';
        }

        if ($('rainAmount')) {
            $('rainAmount').textContent =
                (daily.precipitation_sum?.[0] ?? 0) + ' mm';
        }

        // ==========================================
        // UPDATED TIME
        // ==========================================

        const now = new Date();

        if ($('updated')) {
            $('updated').textContent =
                'Updated ' +
                now.toLocaleTimeString('en-ZM', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
        }

        // ==========================================
        // FORECASTS
        // ==========================================

        renderHourly(hourly);

        renderDaily(daily);

        // ==========================================
        // RAIN ALERT
        // ==========================================

        updateRainAlert(hourly);

        // ==========================================
        // SUMMARY DATE SELECTOR
        // ==========================================

        setupSummaryPicker(daily.time);

        setupAdvisoryDatePicker(daily.time);

        if ($('summaryBtn')) {

            $('summaryBtn').onclick = () => {

                generateSummary(
                    $('summaryDate')?.value,
                    hourly,
                    daily
                );

            };

        }

        if ($('summaryDate')) {

            $('summaryDate').onchange = () => {

                generateSummary(
                    $('summaryDate').value,
                    hourly,
                    daily
                );

            };

        }

        generateSummary(
            $('summaryDate')?.value || daily.time[0],
            hourly,
            daily
        );

        // ==========================================
        // STATUS
        // ==========================================

        if (status) {
            status.textContent =
                'Automatically refreshes every 10 minutes · Data by Open-Meteo';
        }

    } catch (e) {

        if (status) {
            status.textContent =
                'Could not load weather. Check your internet connection and try again.';
        }

        console.error('Weather loading error:', e);

    } finally {

        if (refreshButton) {
            refreshButton.classList.remove('spin');
        }

    }

}


// ==========================================
// HOURLY FORECAST
// ==========================================

function renderHourly(h) {

    if (!h || !Array.isArray(h.time)) {

        if ($('hourly')) {
            $('hourly').innerHTML =
                'Hourly forecast unavailable.';
        }

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

    if (thunder) {

        icon = '⛈️';
        title = 'Thunderstorm possible';

        message =
            `Thunderstorm conditions may occur within the next 6 hours. Rain probability reaches ${maxChance}%.`;

        className = 'alert-storm';

    } else if (maxChance >= 70) {

        icon = '🔴';
        title = 'Rain likely';

        message =
            `Rain is likely within the next 6 hours. Probability reaches ${maxChance}%.`;

        className = 'alert-rain';

    } else if (maxChance >= 40) {

        icon = '🟡';
        title = 'Showers possible';

        message =
            `There is a chance of showers within the next 6 hours. Probability reaches ${maxChance}%.`;

        className = 'alert-possible';

    } else {

        icon = '🟢';
        title = 'No rain expected';

        message =
            'No significant rain is indicated in the next 6 hours.';

        className = 'alert-clear';

    }

    let timing = '';

    if (periods.length) {

        const first = periods[0].i;

        const last = periods[periods.length - 1].i;

        timing =
            ` Possible timing: ${fmtTime(h.time[first])}` +
            `${first !== last ? '–' + fmtTime(h.time[last]) : ''}.`;

    }

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

    const ids = h.time
        .map((t, i) => t.slice(0, 10) === date ? i : -1)
        .filter(i => i >= 0);

    if (!ids.length) {

        story.textContent =
            'Hourly forecast data is unavailable for this day.';

        return;

    }

    const max =
        Math.round(d.temperature_2m_max?.[di] ?? 0);

    const min =
        Math.round(d.temperature_2m_min?.[di] ?? 0);

    const peak = ids.reduce((best, i) => {

        const current =
            h.temperature_2m[i] ?? -999;

        const previous =
            h.temperature_2m[best] ?? -999;

        return current > previous ? i : best;

    }, ids[0]);

    const peakTime = fmtTime(h.time[peak]);

    const label = new Date(date + 'T12:00:00')
        .toLocaleDateString('en-ZM', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

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

    const count = {};

    ids.forEach(i => {

        const desc =
            w(h.weather_code?.[i])[1].toLowerCase();

        count[desc] = (count[desc] || 0) + 1;

    });

    const common = Object.entries(count)
        .sort((a, b) => b[1] - a[1])[0]?.[0]
        || 'variable weather';

    story.textContent =
        `${label}: It is expected to be ${mood}, reaching about ${max}°C around ${peakTime}. ` +
        `The minimum temperature is forecast at ${min}°C. ` +
        `${rainSummary}. ` +
        `Overall, ${common} conditions are expected, before cooling towards the evening to around ${eveningT}°C.`;

}


// ==========================================
// BUTTONS AND AUTOMATIC UPDATES
// ==========================================

// Manual refresh changes the visual scene
// immediately, then reloads actual weather data.

const refreshButton = $('refreshBtn');

if (refreshButton) {

    refreshButton.addEventListener('click', () => {

        rotateWeatherScene();

        loadWeather();

    });

}

// Load actual weather immediately.

loadWeather();

// Update weather data every 10 minutes.
// This automatic update does NOT rotate the scene.

setInterval(loadWeather, 10 * 60 * 1000);


// ==========================================
// SERVICE WORKER
// ==========================================

if (
    'serviceWorker' in navigator &&
    location.protocol.startsWith('http')
) {

    navigator.serviceWorker
        .register('./sw.js', {
            updateViaCache: 'none'
        })
        .catch(console.warn);

}


// ==========================================
// CHOMA WEATHER ADVISORY SYSTEM
// Created by TIVANNAH INNOVATIONS
// ==========================================

function setupAdvisoryDatePicker(days) {

    const select = $('advisoryDate');

    if (!select || !Array.isArray(days)) return;

    const previous = select.value;

    select.innerHTML = days.map((date, i) => `
        <option value="${date}">
            ${dayName(date, i)} — ${dateLong(date)}
        </option>
    `).join('');

    if (days.includes(previous)) {
        select.value = previous;
    }

}


// ==========================================
// GENERATE SELECTED WEATHER ADVISORY
// ==========================================

window.generateWeatherAdvisory = function(type) {

    const panel = $('advisoryPanel');
    const title = $('advisoryTitle');
    const result = $('advisoryResult');
    const dateSelect = $('advisoryDate');

    if (!panel || !title || !result) return;

    if (!latestWeatherData) {

        result.innerHTML = `
            <p>Weather information is still loading.
            Please try again shortly.</p>
        `;

        panel.classList.add('active');
        return;
    }

    const { daily, hourly } = latestWeatherData;

    const date = dateSelect?.value || daily.time[0];

    const dayIndex = daily.time.indexOf(date);

    if (dayIndex < 0) {

        result.innerHTML = `
            <p>Forecast information is unavailable for this date.</p>
        `;

        panel.classList.add('active');
        return;
    }

    const ids = hourly.time
        .map((time, i) =>
            time.slice(0, 10) === date ? i : -1
        )
        .filter(i => i >= 0);

    if (!ids.length) {

        result.innerHTML = `
            <p>Hourly forecast information is unavailable for this day.</p>
        `;

        panel.classList.add('active');
        return;
    }

    const high = Math.round(
        daily.temperature_2m_max[dayIndex] ?? 0
    );

    const low = Math.round(
        daily.temperature_2m_min[dayIndex] ?? 0
    );

    const rainMax =
        daily.precipitation_probability_max[dayIndex] ?? 0;

    const rainAmount =
        daily.precipitation_sum[dayIndex] ?? 0;

    const uv =
        daily.uv_index_max[dayIndex] ?? 0;

    const dailyCode =
        daily.weather_code[dayIndex] ?? 0;

    const rainCodes = [
        51, 53, 55, 56, 57,
        61, 63, 65, 66, 67,
        80, 81, 82
    ];

    const stormCodes = [95, 96, 99];

    const fogCodes = [45, 48];

    const rainHours = ids.filter(i => {

        const probability =
            hourly.precipitation_probability?.[i] ?? 0;

        const code =
            hourly.weather_code?.[i] ?? 0;

        return probability >= 30 ||
            rainCodes.includes(code) ||
            stormCodes.includes(code);

    });

    const stormHours = ids.filter(i =>
        stormCodes.includes(hourly.weather_code?.[i])
    );

    const fogHours = ids.filter(i =>
        fogCodes.includes(hourly.weather_code?.[i])
    );

    const warmestHour = ids.reduce((best, i) => {

        return (
            (hourly.temperature_2m?.[i] ?? -999) >
            (hourly.temperature_2m?.[best] ?? -999)
        ) ? i : best;

    }, ids[0]);

    const warmestTime = fmtTime(hourly.time[warmestHour]);

    const selectedDate = dateLong(date);

    let html = '';

    // ==========================================
    // CLOTHING ADVISORY
    // ==========================================

    if (type === 'clothing') {

        title.textContent = '👕 What to Wear';

        let recommendation = '';
        let icon = '👕';

        if (high >= 35) {

            icon = '🥵';

            recommendation =
                'Very hot conditions are expected. Choose lightweight, breathable clothing.';

        } else if (high >= 30) {

            icon = '☀️';

            recommendation =
                'Hot weather is expected. Light cotton clothing and comfortable footwear are recommended.';

        } else if (high >= 25) {

            icon = '🌤️';

            recommendation =
                'Warm conditions are expected. Light clothing should be comfortable during the day.';

        } else if (high >= 19) {

            icon = '🧥';

            recommendation =
                'Mild conditions are expected. Comfortable clothing with a light layer may be suitable.';

        } else {

            icon = '🧥';

            recommendation =
                'Cool conditions are expected. Consider warmer clothing, especially in the morning and evening.';

        }

        if (low <= 13) {

            recommendation +=
                ' Temperatures may be particularly cool early in the morning and at night, so carry a jacket or sweater.';

        }

        if (rainMax >= 40 || rainAmount > 0) {

            recommendation +=
                ' Rain is possible, so waterproof clothing or a raincoat may be useful.';

        }

        html = `
            <div class="advisory-highlight">
                <div class="advisory-big-icon">${icon}</div>
                <h3>Clothing recommendation</h3>
                <p>${recommendation}</p>
            </div>

            <div class="advisory-stats">
                <div>
                    <small>Expected high</small>
                    <strong>${high}°C</strong>
                </div>

                <div>
                    <small>Expected low</small>
                    <strong>${low}°C</strong>
                </div>

                <div>
                    <small>Rain chance</small>
                    <strong>${rainMax}%</strong>
                </div>
            </div>

            <p class="advisory-note">
                Based on the forecast for ${selectedDate}.
            </p>
        `;

    }


    // ==========================================
    // UMBRELLA ADVISORY
    // ==========================================

    else if (type === 'umbrella') {

        title.textContent = '☂️ Umbrella Advisory';

        let recommendation = '';
        let icon = '☀️';
        let status = '';

        if (
            rainMax >= 60 ||
            rainCodes.includes(dailyCode) ||
            stormHours.length
        ) {

            icon = '☂️';
            status = 'YES — CARRY AN UMBRELLA';

            recommendation =
                'Rain or showers are likely according to the forecast. Carry an umbrella when going out.';

        } else if (rainMax >= 30 || rainAmount > 0) {

            icon = '🌦️';
            status = 'CONSIDER CARRYING AN UMBRELLA';

            recommendation =
                'There is a possibility of rain. Carrying an umbrella would be a sensible precaution.';

        } else {

            icon = '🌤️';
            status = 'AN UMBRELLA MAY NOT BE NECESSARY';

            recommendation =
                'The forecast indicates a relatively low chance of rain. An umbrella may not be necessary, although conditions can change.';

        }

        const timing = rainHours.length
            ? rainHours.map(i => {

                const chance =
                    hourly.precipitation_probability?.[i] ?? 0;

                return `
                    <div class="advisory-time">
                        <span>${fmtTime(hourly.time[i])}</span>
                        <strong>${chance}% rain chance</strong>
                    </div>
                `;

            }).join('')
            : '<p>No significant hourly rain periods have been identified.</p>';

        html = `
            <div class="advisory-highlight">
                <div class="advisory-big-icon">${icon}</div>
                <h3>${status}</h3>
                <p>${recommendation}</p>
            </div>

            <div class="advisory-stats">
                <div>
                    <small>Maximum rain chance</small>
                    <strong>${rainMax}%</strong>
                </div>

                <div>
                    <small>Expected rainfall</small>
                    <strong>${rainAmount} mm</strong>
                </div>
            </div>

            <h3>Possible rain periods</h3>

            ${timing}

            <p class="advisory-note">
                Rain probabilities are estimates, not guarantees.
                Forecast for ${selectedDate}.
            </p>
        `;

    }


    // ==========================================
    // DRIVING CONDITIONS
    // ==========================================

    else if (type === 'driving') {

        title.textContent = '🚗 Driving Conditions';

        let icon = '🚗';
        let status = '';
        let recommendation = '';

        if (stormHours.length) {

            icon = '⛈️';
            status = 'EXTRA CAUTION ADVISED';

            recommendation =
                'Thunderstorms are indicated in the forecast. Consider delaying non-essential journeys during storm activity. Watch for reduced visibility, strong winds and wet road surfaces.';

        } else if (
            rainMax >= 60 ||
            rainCodes.includes(dailyCode)
        ) {

            icon = '🌧️';
            status = 'WET WEATHER POSSIBLE';

            recommendation =
                'Rain may affect driving conditions. Reduce speed, increase following distance and be alert for slippery road surfaces.';

        } else if (fogHours.length) {

            icon = '🌫️';
            status = 'LOW VISIBILITY POSSIBLE';

            recommendation =
                'Fog is indicated in some forecast hours. Use appropriate lights, reduce speed and leave extra distance between vehicles.';

        } else if (rainMax >= 30) {

            icon = '🌦️';
            status = 'SOME CAUTION ADVISED';

            recommendation =
                'There is a possibility of showers. Remain alert for changing weather and potentially wet roads.';

        } else {

            icon = '✅';
            status = 'GENERALLY FAVOURABLE WEATHER';

            recommendation =
                'The forecast does not indicate significant rain or thunderstorms. Continue to observe normal road safety precautions.';

        }

        html = `
            <div class="advisory-highlight">
                <div class="advisory-big-icon">${icon}</div>
                <h3>${status}</h3>
                <p>${recommendation}</p>
            </div>

            <div class="advisory-stats">
                <div>
                    <small>Rain probability</small>
                    <strong>${rainMax}%</strong>
                </div>

                <div>
                    <small>Expected high</small>
                    <strong>${high}°C</strong>
                </div>

                <div>
                    <small>Thunderstorm periods</small>
                    <strong>${stormHours.length}</strong>
                </div>
            </div>

            <p class="advisory-note">
                This advisory considers weather forecasts only.
                It does not provide live road, traffic or accident information.
                Forecast for ${selectedDate}.
            </p>
        `;

    }


    // ==========================================
    // OUTDOOR ACTIVITIES
    // ==========================================

    else if (type === 'outdoor') {

        title.textContent = '🌳 Outdoor Activities';

        let icon = '🌳';
        let status = '';
        let recommendation = '';

        const badWeather =
            stormHours.length > 0 ||
            rainMax >= 70;

        if (stormHours.length) {

            icon = '⛈️';
            status = 'OUTDOOR ACTIVITIES MAY BE AFFECTED';

            recommendation =
                'Thunderstorms are indicated. Avoid open outdoor areas during thunderstorms and seek safe shelter.';

        } else if (badWeather) {

            icon = '🌧️';
            status = 'PLAN AROUND POSSIBLE RAIN';

            recommendation =
                'Rain is likely enough to affect some outdoor plans. Consider flexible arrangements or indoor alternatives.';

        } else if (high >= 35) {

            icon = '🥵';
            status = 'HOT CONDITIONS EXPECTED';

            recommendation =
                'Outdoor activities may be more comfortable during cooler morning or evening hours. Take breaks and drink water.';

        } else if (rainMax >= 30) {

            icon = '🌦️';
            status = 'CHECK THE WEATHER BEFORE GOING OUT';

            recommendation =
                'Some showers are possible. Outdoor activities may still be possible, but consider having an alternative plan.';

        } else {

            icon = '☀️';
            status = 'GENERALLY SUITABLE CONDITIONS';

            recommendation =
                'The forecast suggests generally favourable conditions for outdoor activities. Remember sun protection and stay hydrated.';

        }

        const suitableHours = ids.filter(i => {

            const temperature =
                hourly.temperature_2m?.[i] ?? 0;

            const rain =
                hourly.precipitation_probability?.[i] ?? 0;

            const code =
                hourly.weather_code?.[i] ?? 0;

            return temperature >= 18 &&
                temperature <= 30 &&
                rain < 40 &&
                !stormCodes.includes(code);

        });

        const periods = suitableHours.length
            ? suitableHours.map(i => `
                <div class="advisory-time">
                    <span>${fmtTime(hourly.time[i])}</span>
                    <strong>${Math.round(hourly.temperature_2m[i])}°C</strong>
                </div>
            `).join('')
            : '<p>No clearly favourable hourly periods were identified using these weather criteria.</p>';

        html = `
            <div class="advisory-highlight">
                <div class="advisory-big-icon">${icon}</div>
                <h3>${status}</h3>
                <p>${recommendation}</p>
            </div>

            <h3>Potentially comfortable hours</h3>

            ${periods}

            <p class="advisory-note">
                These periods are estimates based on temperature,
                rain probability and storm forecasts.
                Forecast for ${selectedDate}.
            </p>
        `;

    }


    // ==========================================
    // HEAT ADVISORY
    // ==========================================

    else if (type === 'heat') {

        title.textContent = '🌡️ Heat Advisory';

        let icon = '🌤️';
        let status = '';
        let recommendation = '';

        if (high >= 40) {

            icon = '🥵';
            status = 'EXTREMELY HOT CONDITIONS';

            recommendation =
                'Very high temperatures are forecast. Limit strenuous outdoor activity during the hottest hours, seek shade and drink water regularly.';

        } else if (high >= 35) {

            icon = '🔥';
            status = 'HIGH HEAT EXPECTED';

            recommendation =
                'Hot conditions are expected. Avoid prolonged exposure to direct sunlight, especially around the warmest part of the day.';

        } else if (high >= 30) {

            icon = '☀️';
            status = 'WARM TO HOT CONDITIONS';

            recommendation =
                'It may become hot during the day. Wear light clothing, use sun protection and stay hydrated.';

        } else {

            icon = '🌤️';
            status = 'NO SIGNIFICANT HEAT SIGNAL';

            recommendation =
                'The forecast does not indicate particularly high temperatures. Normal precautions against sun exposure are still advisable.';

        }

        let uvAdvice = '';

        if (uv >= 8) {

            uvAdvice =
                ' UV levels are forecast to be very high or extreme. Seek shade and use sun protection when outdoors.';

        } else if (uv >= 6) {

            uvAdvice =
                ' UV levels are forecast to be high. Sun protection is recommended when outdoors.';

        } else if (uv >= 3) {

            uvAdvice =
                ' Some sun protection may be useful during extended outdoor exposure.';

        } else {

            uvAdvice =
                ' Forecast UV levels are relatively low.';

        }

        recommendation += uvAdvice;

        html = `
            <div class="advisory-highlight">
                <div class="advisory-big-icon">${icon}</div>
                <h3>${status}</h3>
                <p>${recommendation}</p>
            </div>

            <div class="advisory-stats">
                <div>
                    <small>Expected high</small>
                    <strong>${high}°C</strong>
                </div>

                <div>
                    <small>Expected low</small>
                    <strong>${low}°C</strong>
                </div>

                <div>
                    <small>Maximum UV index</small>
                    <strong>${uv}</strong>
                </div>
            </div>

            <p class="advisory-note">
                Based on the forecast for ${selectedDate}.
                UV and temperature values are forecasts, not live measurements.
            </p>
        `;

    }

    else {

        title.textContent = 'Weather Advisory';

        html = '<p>Select an advisory from the menu.</p>';

    }

    result.innerHTML = html;

    panel.classList.add('active');

};


// ==========================================
// WEATHER SOUND SYSTEM
// Created by TIVANNAH INNOVATIONS
// ==========================================

let weatherAudioContext = null;

let sceneSoundNodes = [];

let soundIntervals = [];


// ==========================================
// CREATE AUDIO CONTEXT
// ==========================================

function getWeatherAudio() {

    if (!weatherAudioContext) {

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) {
            console.warn('Web Audio is not supported.');
            return null;
        }

        weatherAudioContext = new AudioContextClass();

    }

    return weatherAudioContext;

}


// ==========================================
// STOP CURRENT SCENE SOUND
// ==========================================

function stopSceneSound() {

    soundIntervals.forEach(interval => {
        clearInterval(interval);
    });

    soundIntervals = [];

    sceneSoundNodes.forEach(node => {

        try {

            if (node.stop) {
                node.stop();
            }

            if (node.disconnect) {
                node.disconnect();
            }

        } catch (error) {
            // Ignore already stopped audio nodes.
        }

    });

    sceneSoundNodes = [];

}


// ==========================================
// CREATE AMBIENT NOISE
// Rain, wind and distant thunder atmosphere
// ==========================================

function createWeatherNoise(type) {

    const ctx = getWeatherAudio();

    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 4;

    const buffer = ctx.createBuffer(
        1,
        bufferSize,
        ctx.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {

        data[i] = Math.random() * 2 - 1;

    }

    const source = ctx.createBufferSource();

    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();

    const gain = ctx.createGain();

    if (type === 'rain') {

        filter.type = 'lowpass';
        filter.frequency.value = 1600;

        gain.gain.value = 0.12;

    } else if (type === 'wind') {

        filter.type = 'lowpass';
        filter.frequency.value = 500;

        gain.gain.value = 0.09;

    } else if (type === 'thunder') {

        filter.type = 'lowpass';
        filter.frequency.value = 180;

        gain.gain.value = 0.18;

    }

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();

    sceneSoundNodes.push(source, filter, gain);

}


// ==========================================
// BIRD CHIRPING
// ==========================================

function playBirdChirp() {

    const ctx = getWeatherAudio();

    if (!ctx) return;

    const oscillator = ctx.createOscillator();

    const gain = ctx.createGain();

    const startTime = ctx.currentTime;

    const frequency =
        1500 + Math.random() * 1000;

    oscillator.type = 'sine';

    oscillator.frequency.setValueAtTime(
        frequency,
        startTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
        frequency * 1.5,
        startTime + 0.12
    );

    oscillator.frequency.exponentialRampToValueAtTime(
        frequency * 0.8,
        startTime + 0.28
    );

    gain.gain.setValueAtTime(0.001, startTime);

    gain.gain.linearRampToValueAtTime(
        0.045,
        startTime + 0.04
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + 0.32
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.35);

    sceneSoundNodes.push(oscillator, gain);

}


// ==========================================
// DISTANT THUNDER SOUND
// ==========================================

function playThunder() {

    const ctx = getWeatherAudio();

    if (!ctx) return;

    const oscillator = ctx.createOscillator();

    const gain = ctx.createGain();

    const filter = ctx.createBiquadFilter();

    const startTime = ctx.currentTime;

    oscillator.type = 'sawtooth';

    oscillator.frequency.setValueAtTime(
        75,
        startTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
        35,
        startTime + 2.5
    );

    filter.type = 'lowpass';
    filter.frequency.value = 180;

    gain.gain.setValueAtTime(0.001, startTime);

    gain.gain.linearRampToValueAtTime(
        0.13,
        startTime + 0.12
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + 2.8
    );

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + 3);

    sceneSoundNodes.push(
        oscillator,
        filter,
        gain
    );

}


// ==========================================
// START SOUND FOR SELECTED SCENE
// ==========================================

function startSceneSound(scene) {

    stopSceneSound();

    if (!weatherSoundEnabled) return;

    const ctx = getWeatherAudio();

    if (!ctx) return;

    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    // SUNNY SCENE
    // Birds chirping.

    if (scene === 'weather-sunny') {

        playBirdChirp();

        soundIntervals.push(
            setInterval(playBirdChirp, 2200)
        );

    }

    // PARTLY CLOUDY SCENE
    // Gentle wind and occasional birds.

    else if (scene === 'weather-partly') {

        createWeatherNoise('wind');

        playBirdChirp();

        soundIntervals.push(
            setInterval(playBirdChirp, 4500)
        );

    }

    // CLOUDY SCENE
    // Gentle wind atmosphere.

    else if (scene === 'weather-cloudy') {

        createWeatherNoise('wind');

    }

    // RAIN SCENE
    // Continuous rainfall.

    else if (scene === 'weather-rain') {

        createWeatherNoise('rain');

    }

    // THUNDERSTORM SCENE
    // Rainfall, wind and occasional thunder.

    else if (scene === 'weather-storm') {

        createWeatherNoise('rain');

        createWeatherNoise('wind');

        playThunder();

        soundIntervals.push(
            setInterval(playThunder, 9000)
        );

    }

}


// ==========================================
// SOUND BUTTON
// ==========================================

window.toggleWeatherSound = async function() {

    const ctx = getWeatherAudio();

    if (!ctx) return;

    weatherSoundEnabled = !weatherSoundEnabled;

    const button = $('soundToggle');

    if (weatherSoundEnabled) {

        try {

            await ctx.resume();

            startSceneSound(currentScene);

        } catch (error) {

            console.warn('Could not start weather sound:', error);

            weatherSoundEnabled = false;

        }

    } else {

        stopSceneSound();

    }

    if (button) {

        button.textContent =
            weatherSoundEnabled
                ? '🔊 Sound On'
                : '🔇 Sound Off';

        button.setAttribute(
            'aria-label',
            weatherSoundEnabled
                ? 'Mute weather sounds'
                : 'Enable weather sounds'
        );

        button.setAttribute(
            'aria-pressed',
            String(weatherSoundEnabled)
        );

    }

};


// ==========================================
// INITIAL SOUND BUTTON DISPLAY
// ==========================================

const soundButton = $('soundToggle');

if (soundButton) {

    soundButton.textContent = '🔇 Sound Off';

    soundButton.setAttribute(
        'aria-label',
        'Enable weather sounds'
    );

    soundButton.setAttribute(
        'aria-pressed',
        'false'
    );

}
