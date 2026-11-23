const LAT=-16.8065, LON=27.0600;
const API=`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max&timezone=Africa%2FLusaka&forecast_days=7`;
const $=id=>document.getElementById(id);
const weatherMap={0:['☀️','Clear sky'],1:['🌤️','Mainly clear'],2:['⛅','Partly cloudy'],3:['☁️','Overcast'],45:['🌫️','Fog'],48:['🌫️','Depositing rime fog'],51:['🌦️','Light drizzle'],53:['🌦️','Drizzle'],55:['🌧️','Dense drizzle'],56:['🌧️','Freezing drizzle'],57:['🌧️','Heavy freezing drizzle'],61:['🌧️','Light rain'],63:['🌧️','Rain'],65:['🌧️','Heavy rain'],66:['🌧️','Freezing rain'],67:['🌧️','Heavy freezing rain'],71:['🌨️','Light snow'],73:['🌨️','Snow'],75:['❄️','Heavy snow'],77:['🌨️','Snow grains'],80:['🌦️','Light rain showers'],81:['🌧️','Rain showers'],82:['⛈️','Heavy rain showers'],85:['🌨️','Snow showers'],86:['❄️','Heavy snow showers'],95:['⛈️','Thunderstorm'],96:['⛈️','Thunderstorm with hail'],99:['⛈️','Severe thunderstorm']};
function w(code){return weatherMap[code]||['🌡️','Weather conditions'];}
function fmtTime(iso){return iso?.slice(11,16)||'--:--'}
function dayName(iso,index){if(index===0)return'Today';if(index===1)return'Tomorrow';return new Date(iso+'T12:00:00').toLocaleDateString('en',{weekday:'short'})}
function dateLong(iso){return new Date(iso+'T12:00:00').toLocaleDateString('en',{weekday:'long',day:'numeric',month:'short'})}
async function loadWeather(){
  $('status').textContent='Updating weather data…';$('refreshBtn').classList.add('spin');
  try{
    const res=await fetch(API,{cache:'no-store'});if(!res.ok)throw new Error('Weather service returned '+res.status);
    const d=await res.json(),c=d.current, daily=d.daily;
    const [icon,desc]=w(c.weather_code);
    $('weatherIcon').textContent=icon;$('temperature').textContent=Math.round(c.temperature_2m)+'°';
    $('condition').textContent=desc;$('feels').textContent=Math.round(c.apparent_temperature)+'°C';
    $('humidity').textContent=c.relative_humidity_2m+'%';$('wind').textContent=Math.round(c.wind_speed_10m)+' km/h';$('pressure').textContent=Math.round(c.surface_pressure)+' hPa';
    $('uv').textContent=daily.uv_index_max[0]??'--';$('todayDate').textContent=dateLong(daily.time[0]);
    $('sunrise').textContent=fmtTime(daily.sunrise[0]);$('sunset').textContent=fmtTime(daily.sunset[0]);
    $('rainToday').textContent=(daily.precipitation_probability_max[0]??0)+'%';$('rainAmount').textContent=(daily.precipitation_sum[0]??0)+' mm';
    const now=new Date();$('updated').textContent='Updated '+now.toLocaleTimeString('en-ZM',{hour:'2-digit',minute:'2-digit'});
    renderHourly(d.hourly);renderDaily(d.daily);
    setupSummaryPicker(d.daily.time);
    $('summaryBtn').onclick=()=>generateSummary($('summaryDate').value,d.hourly,d.daily);
    $('summaryDate').onchange=()=>generateSummary($('summaryDate').value,d.hourly,d.daily);
    generateSummary($('summaryDate').value || d.daily.time[0],d.hourly,d.daily);
    $('status').textContent='Automatically refreshes every 10 minutes · Data by Open-Meteo';
  }catch(e){$('status').textContent='Could not load weather. Check your internet connection and try again.';console.error(e)}
  finally{$('refreshBtn').classList.remove('spin')}
}
function renderHourly(h){
 const now=new Date();let start=h.time.findIndex(t=>new Date(t)>=new Date(now.getTime()-30*60000));if(start<0)start=0;
 $('hourly').innerHTML=Array.from({length:24},(_,n)=>{let i=start+n;if(i>=h.time.length)return'';let [ic]=w(h.weather_code[i]);let time=new Date(h.time[i]).toLocaleTimeString('en',{hour:'numeric'});return `<div class="hour"><time>${n===0?'Now':time}</time><div class="ico">${ic}</div><strong>${Math.round(h.temperature_2m[i])}°</strong><small>💧 ${h.precipitation_probability[i]??0}%</small></div>`}).join('');
}
function renderDaily(d){
 $('forecast').innerHTML=d.time.map((t,i)=>{let [ic]=w(d.weather_code[i]);return `<div class="day"><div class="dayname">${dayName(t,i)}</div><div class="ico">${ic}</div><div class="range"><strong>${Math.round(d.temperature_2m_max[i])}°</strong> <span class="low">${Math.round(d.temperature_2m_min[i])}°</span></div><div class="rain">💧 ${d.precipitation_probability_max[i]??0}%</div><small>${d.precipitation_sum[i]??0} mm</small></div>`}).join('');
}
$('refreshBtn').addEventListener('click',loadWeather);loadWeather();setInterval(loadWeather,10*60*1000);
if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(console.warn);

function setupSummaryPicker(days){const sel=$('summaryDate'),prior=sel.value;sel.innerHTML=days.map((date,i)=>`<option value="${date}">${dayName(date,i)} — ${dateLong(date)}</option>`).join('');if(days.includes(prior))sel.value=prior;}
function generateSummary(date,h,d){
 if(!date||!h||!d){$('weatherStory').textContent='Forecast information is not available yet.';return}
 const di=d.time.indexOf(date);if(di<0){$('weatherStory').textContent='No forecast found for that date.';return}
 const ids=h.time.map((t,i)=>t.slice(0,10)===date?i:-1).filter(i=>i>=0);if(!ids.length){$('weatherStory').textContent='Hourly forecast data is unavailable for this day.';return}
 const max=Math.round(d.temperature_2m_max[di]),min=Math.round(d.temperature_2m_min[di]);const peak=ids.reduce((best,i)=>h.temperature_2m[i]>h.temperature_2m[best]?i:best,ids[0]);const peakTime=fmtTime(h.time[peak]);const label=new Date(date+'T12:00:00').toLocaleDateString('en-ZM',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
 let mood=max>=32?'very hot':max>=28?'hot':max>=24?'warm':max>=19?'mild':'cool';
 const rain=ids.filter(i=>(h.precipitation_probability[i]||0)>=45||(h.precipitation[i]||0)>=0.3);const groups=[];
 rain.forEach(i=>{let last=groups[groups.length-1];if(last&&i-last[last.length-1]<=1)last.push(i);else groups.push([i])});
 const rainSummary=groups.length?groups.map(g=>{let chance=Math.max(...g.map(i=>h.precipitation_probability[i]||0));let phrase=chance>=70?'rain or showers are likely':'showers are possible';return `${phrase} from around ${fmtTime(h.time[g[0]])} to ${fmtTime(h.time[g[g.length-1]])} (chance up to ${chance}%)`}).join('; '):'no significant rain is indicated in the hourly forecast';
 const evening=ids.filter(i=>Number(h.time[i].slice(11,13))>=17);const eveningT=evening.length?Math.round(h.temperature_2m[evening[evening.length-1]]):min;
 const count={};ids.forEach(i=>{const desc=w(h.weather_code[i])[1].toLowerCase();count[desc]=(count[desc]||0)+1});const common=Object.entries(count).sort((a,b)=>b[1]-a[1])[0][0];
 $('weatherStory').textContent=`${label}: It is expected to be ${mood}, reaching about ${max}°C around ${peakTime}. The minimum temperature is forecast at ${min}°C. ${rainSummary}. Overall, ${common} conditions are expected, before cooling towards the evening to around ${eveningT}°C.`;
}
