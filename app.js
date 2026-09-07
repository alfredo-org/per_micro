const FLEET_URL='https://velocidades.seguimos.cl/?all-buses-data=1';
const SANTIAGO=[-33.45,-70.66];
const map=L.map('map',{zoomControl:false,attributionControl:true}).setView(SANTIAGO,11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
L.control.zoom({position:'topright'}).addTo(map);

const $=id=>document.getElementById(id);
const form=$('searchForm'),input=$('plate'),button=$('searchButton'),searchShell=$('searchShell'),result=$('result'),toast=$('toast');
let marker=null,lastFetch=0,fleetCache=null;

function normalizePlate(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
function prettyPlate(v){const p=normalizePlate(v);return p.length===6?`${p.slice(0,4)}-${p.slice(4)}`:p}
function ageText(ts){const sec=Math.max(0,Math.round((Date.now()-ts)/1000));if(sec<60)return `hace ${sec} s`;const m=Math.round(sec/60);return `hace ${m} min`}
function showToast(msg){toast.textContent=msg;toast.classList.remove('hidden');setTimeout(()=>toast.classList.add('hidden'),4200)}

function parseFleet(json){
  const features=(json?.geojson||json)?.features||[];
  const buses=new Map();
  for(const f of features){
    const p=f?.properties||{},g=f?.geometry;
    const raw=String(p.license_plate||'').toUpperCase();
    const plate=normalizePlate(raw);
    if(!plate||!Array.isArray(g?.coordinates))continue;
    const lon=+g.coordinates[0],lat=+g.coordinates[1],ts=Date.parse(p.timestamp);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||!Number.isFinite(ts))continue;
    if(lat< -34.3||lat> -33.0||lon< -71.5||lon> -70.3)continue;
    buses.set(plate,{plate:raw||prettyPlate(plate),lat,lon,ts,speed:Number.isFinite(+p.speed)?+p.speed:null,route:String(p.route_code||'').trim()});
  }
  return buses;
}

async function getFleet(){
  if(fleetCache&&Date.now()-lastFetch<60000)return fleetCache;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),20000);
  try{
    const res=await fetch(FLEET_URL,{signal:controller.signal,headers:{Accept:'application/json'},credentials:'omit',referrerPolicy:'origin'});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const data=parseFleet(await res.json());
    if(!data.size)throw new Error('Feed vacío');
    fleetCache=data;lastFetch=Date.now();return data;
  }finally{clearTimeout(timeout)}
}

function showBus(bus){
  if(marker)map.removeLayer(marker);
  const icon=L.divIcon({className:'',html:'<div class="bus-marker pulse">BUS</div>',iconSize:[46,46],iconAnchor:[23,23]});
  marker=L.marker([bus.lat,bus.lon],{icon}).addTo(map);
  map.flyTo([bus.lat,bus.lon],16,{duration:1.15});
  $('resultPlate').textContent=bus.plate;
  $('route').textContent=bus.route||'Sin dato';
  $('speed').textContent=bus.speed===null?'Sin dato':`${Math.round(bus.speed)} km/h`;
  $('age').textContent=ageText(bus.ts);
  const mins=Math.max(0,Math.round((Date.now()-bus.ts)/60000));
  $('status').textContent=mins>=5?'La posición está desactualizada; revisa la hora del GPS antes de usarla como referencia.':'Posición GPS reportada por la flota RED. Se actualizará en una nueva búsqueda después de 1 minuto.';
  searchShell.classList.add('hidden');result.classList.remove('hidden');
}

async function searchPlate(value){
  const plate=normalizePlate(value);
  if(plate.length<5){showToast('Ingresa una patente válida.');return}
  button.disabled=true;button.textContent='Buscando…';
  try{
    const fleet=await getFleet();
    const bus=fleet.get(plate);
    if(!bus){showToast(`No encontramos ${prettyPlate(plate)} en la flota GPS actual.`);return}
    showBus(bus);
  }catch(e){showToast('No pudimos consultar la flota en este momento. Intenta nuevamente.');}
  finally{button.disabled=false;button.textContent='Buscar'}
}

form.addEventListener('submit',e=>{e.preventDefault();searchPlate(input.value)});
input.addEventListener('input',()=>{input.value=input.value.toUpperCase().replace(/[^A-Z0-9-]/g,'')});
function reset(){result.classList.add('hidden');searchShell.classList.remove('hidden');input.focus()}
$('newSearch').addEventListener('click',reset);$('closeResult').addEventListener('click',reset);
