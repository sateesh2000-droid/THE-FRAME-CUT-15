import React, { useState, useEffect } from 'react';
import { 
  Moon, 
  Sun, 
  Droplets, 
  Wind, 
  MapPin, 
  RefreshCw, 
  ChevronDown, 
  Camera, 
  Search,
  Navigation,
  Check,
  X,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CityPreset {
  name: string;
  lat: number;
  lon: number;
  tag: string;
}

const DEFAULT_PRESETS: CityPreset[] = [
  { name: 'Forest', lat: 32.2432, lon: 77.1892, tag: 'Misty Woodland' },
  { name: 'Udaipur', lat: 24.5854, lon: 73.7125, tag: 'Palace & Lake' },
  { name: 'New Delhi', lat: 28.6139, lon: 77.2090, tag: 'Capital Studio' },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873, tag: 'Pink City Forts' },
  { name: 'Goa', lat: 15.2993, lon: 74.1240, tag: 'Coastal Sunset' },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, tag: 'Film City' },
  { name: 'Manali', lat: 32.2432, lon: 77.1892, tag: 'Snow Peaks' },
  { name: 'Kashmir', lat: 34.0837, lon: 74.7973, tag: 'Paradise Valley' }
];

interface WeatherData {
  tempC: number;
  humidity: number;
  windSpeedMs: number;
  conditionText: string;
  shootAdvice: string;
  isNight: boolean;
}

interface SearchResult {
  id: number;
  name: string;
  country?: string;
  admin1?: string; // state/region
  latitude: number;
  longitude: number;
}

export default function LoginWeatherClockWidget({ 
  layout: initialLayout = 'vertical' 
}: { 
  layout?: 'horizontal' | 'vertical' | 'compact' 
}) {
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical'>(
    initialLayout === 'vertical' ? 'vertical' : 'horizontal'
  );
  const [time, setTime] = useState<Date>(new Date());
  
  // Load saved location from localStorage or default to Forest
  const [selectedCity, setSelectedCity] = useState<CityPreset>(() => {
    try {
      const saved = localStorage.getItem('framecut_login_location');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PRESETS[0];
  });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);

  // Live Clock update
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live weather from Open-Meteo
  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();
      const current = data.current;
      const code = current.weather_code ?? 0;
      const isNight = current.is_day === 0;

      let conditionText = 'Clear Atmospheric';
      let shootAdvice = 'Optimal Natural Light for Outdoor & Drone Shoots';

      if (code === 0) {
        conditionText = isNight ? 'Clear Starlit Night' : 'Clear Sunny Sky';
        shootAdvice = '☀️ Pristine Lighting • Great for 4K High-FPS Capture';
      } else if (code >= 1 && code <= 3) {
        conditionText = 'Partly Overcast';
        shootAdvice = '🌤️ Diffused Sunlight • Soft Natural Shadows for Portraits';
      } else if (code === 45 || code === 48) {
        conditionText = 'Misty Woodland Fog';
        shootAdvice = '🌫️ Cinematic Atmosphere • Keep Lens Wipes Ready';
      } else if (code >= 51 && code <= 82) {
        conditionText = 'Rainy Conditions';
        shootAdvice = '🌧️ Rain Alert • Use Indoor Studio or Weatherized Gear';
      }

      // Convert wind speed from km/h to m/s
      const windSpeedMs = Math.round((current.wind_speed_10m / 3.6) * 10) / 10;

      setWeather({
        tempC: Math.round(current.temperature_2m),
        humidity: Math.round(current.relative_humidity_2m),
        windSpeedMs,
        conditionText,
        shootAdvice,
        isNight
      });
    } catch {
      // Fallback
      setWeather({
        tempC: 16,
        humidity: 85,
        windSpeedMs: 4,
        conditionText: 'Misty Woodland',
        shootAdvice: '🌲 Misty Ambience • Ideal for Atmospheric Cinematography',
        isNight: time.getHours() < 6 || time.getHours() >= 19
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedCity.lat, selectedCity.lon);
    try {
      localStorage.setItem('framecut_login_location', JSON.stringify(selectedCity));
    } catch (e) {
      console.error(e);
    }
  }, [selectedCity]);

  // Geocoding city search handler
  const handleSearchCity = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    setSearching(true);
    setSearchError('');
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
        setSearchError('No matching location found');
      }
    } catch (err) {
      console.error(err);
      setSearchError('Error searching location');
    } finally {
      setSearching(false);
    }
  };

  // GPS Detect handler
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        
        // Reverse geocode to name the location
        let cityName = 'Current Location';
        try {
          const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(2)}`);
          // Or simplified label
          cityName = 'Live GPS Location';
        } catch (e) {
          console.error(e);
        }

        const newCity: CityPreset = {
          name: cityName,
          lat,
          lon,
          tag: 'GPS Local Area'
        };
        setSelectedCity(newCity);
        setGpsLoading(false);
        setShowLocationModal(false);
      },
      (err) => {
        console.error(err);
        setGpsLoading(false);
        alert('Could not detect GPS position. Please type city name in search box.');
      }
    );
  };

  const selectCityAndClose = (city: CityPreset) => {
    setSelectedCity(city);
    setShowLocationModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const formattedDate = time.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long'
  });

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div className={`w-full ${layoutMode === 'vertical' ? 'max-w-[320px] sm:max-w-[340px]' : 'max-w-4xl'} mx-auto select-none relative transition-all duration-300`}>
      {/* HORIZONTAL WIDE LANDSCAPE BAR LAYOUT */}
      {layoutMode === 'horizontal' ? (
        <div className="rounded-3xl sm:rounded-[32px] bg-black/40 backdrop-blur-2xl border border-white/20 p-4 sm:p-5 shadow-[0_15px_40px_rgba(0,0,0,0.7)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-white/30 transition-all duration-500">
          {/* Subtle glass glow */}
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

          {/* Left: Aperture Clock Lens Portal */}
          <div className="flex items-center space-x-4 shrink-0 w-full md:w-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-white/25 overflow-hidden shadow-[inset_0_4px_15px_rgba(0,0,0,0.6)] relative flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-500">
              <img 
                src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80" 
                alt="Forest Canopy" 
                className="w-full h-full object-cover filter contrast-125 brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />

              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-1 text-center">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-white drop-shadow">
                  {formattedTime}
                </span>
                <span className="text-[8px] font-mono text-emerald-300 bg-black/60 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                  LIVE CLOCK
                </span>
              </div>
            </div>

            {/* City Name & Date Info */}
            <div className="flex flex-col text-left space-y-0.5">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="flex items-center space-x-1 text-xl sm:text-2xl font-bold font-sans text-white hover:text-gold-300 transition-colors cursor-pointer"
                  title="Click to change shoot location"
                >
                  <span>{selectedCity.name}</span>
                  <ChevronDown className="w-4 h-4 text-gold-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="px-2 py-0.5 rounded-full bg-gold-500/15 hover:bg-gold-500/30 border border-gold-500/30 text-[9px] font-mono text-gold-300 transition-all cursor-pointer flex items-center space-x-1"
                >
                  <MapPin className="w-2.5 h-2.5" />
                  <span>Set Location</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-300 font-mono">
                <span className="font-semibold text-white">{formattedDate}</span>
                <span>•</span>
                <span className="text-gold-300">{weather?.conditionText || 'Misty Woodland'}</span>
              </div>

              <p className="text-[11px] text-gray-400 font-sans line-clamp-1 max-w-sm">
                🎬 {weather?.shootAdvice || 'Optimal Natural Light for Outdoor Shoots'}
              </p>
            </div>
          </div>

          {/* Right: Weather Metrics & Controls */}
          <div className="flex items-center space-x-3 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
            {/* Weather Metrics Joined Bar */}
            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/20 shadow-inner space-x-1.5 text-xs font-mono">
              <div className="flex items-center space-x-1.5 px-3 py-1.2 rounded-xl bg-black/40 text-white border border-white/10">
                {weather?.isNight ? <Moon className="w-3.5 h-3.5 text-sky-200" /> : <Sun className="w-3.5 h-3.5 text-amber-300" />}
                <span className="font-bold">{weather ? `${weather.tempC}°C` : '16°C'}</span>
              </div>

              <div className="flex items-center space-x-1.5 px-3 py-1.2 rounded-xl bg-black/40 text-white border border-white/10">
                <Droplets className="w-3.5 h-3.5 text-sky-300" />
                <span className="font-bold">{weather ? `${weather.humidity}%` : '85%'}</span>
              </div>

              <div className="flex items-center space-x-1.5 px-3 py-1.2 rounded-xl bg-black/40 text-white border border-white/10">
                <Wind className="w-3.5 h-3.5 text-emerald-300" />
                <span className="font-bold">{weather ? `${weather.windSpeedMs}m/s` : '4m/s'}</span>
              </div>
            </div>

            {/* Refresh + Layout Switcher */}
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => fetchWeather(selectedCity.lat, selectedCity.lon)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer border border-white/10"
                title="Refresh weather"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-gold-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode('vertical')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer border border-white/10 text-[10px] font-mono"
                title="Switch to vertical capsule format"
              >
                ↕ Tower
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VERTICAL TALL CAPSULE LAYOUT */
        <div className="rounded-[80px] sm:rounded-[100px] bg-black/35 backdrop-blur-2xl border border-white/20 p-6 pt-5 pb-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center text-center group hover:border-white/30 transition-all duration-500">
          
          {/* Subtle inner glass highlight */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-[100px]" />

          {/* Top Circular Aperture Portal showing the background foliage */}
          <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-full border border-white/25 overflow-hidden shadow-[inset_0_4px_20px_rgba(0,0,0,0.6)] relative my-2 flex items-center justify-center shrink-0">
            <img 
              src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80" 
              alt="Forest Canopy" 
              className="w-full h-full object-cover filter contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

            {/* Aperture Lens Badge & Live Time Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-1">
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/90 drop-shadow-md font-bold">
                {formattedTime}
              </span>
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[9px] font-mono text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE SHOOT CLOCK</span>
              </div>
            </div>
          </div>

          {/* Sub-label: weather */}
          <div className="mt-3 relative z-10 flex items-center space-x-2">
            <span className="text-[11px] font-light tracking-[0.25em] text-white/60 lowercase font-mono">
              weather
            </span>
            <button
              type="button"
              onClick={() => fetchWeather(selectedCity.lat, selectedCity.lon)}
              className="text-white/40 hover:text-white transition-colors cursor-pointer"
              title="Refresh weather"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-gold-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('horizontal')}
              className="text-gold-400 hover:text-gold-200 text-[10px] font-mono cursor-pointer ml-2"
              title="Switch to wide horizontal bar"
            >
              ↔ Wide
            </button>
          </div>

          {/* Selected City Name + Change Location Trigger */}
          <div className="relative mt-1 z-20 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="group/btn flex items-center space-x-2 text-3xl sm:text-4xl font-light tracking-wide text-white font-sans transition-all cursor-pointer hover:text-gold-200"
              title="Click to change location"
            >
              <span className="truncate max-w-[200px]">{selectedCity.name}</span>
              <ChevronDown className="w-4 h-4 text-gold-400 group-hover/btn:text-white transition-colors shrink-0" />
            </button>

            {/* Change Location Pill Button */}
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="mt-1 flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-gold-500/20 border border-white/15 text-[10px] font-mono text-gold-300 hover:text-gold-200 transition-all cursor-pointer shadow-sm"
            >
              <MapPin className="w-2.5 h-2.5 text-gold-400" />
              <span>Set Location</span>
            </button>
          </div>

          {/* Date: e.g. 30 July */}
          <p className="text-xs text-white/60 font-light mt-1.5 font-sans tracking-wide">
            {formattedDate}
          </p>

          {/* Joined Glass Pill Container (exact match to user image) */}
          <div className="flex items-center justify-center my-4 bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-inner space-x-1">
            {/* Left Pill: Moon / Temp */}
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 text-xs font-mono text-white border border-white/10">
              {weather?.isNight ? (
                <Moon className="w-3.5 h-3.5 text-sky-200" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span className="font-medium tracking-tight">
                {weather ? `${weather.tempC}°C` : '16°C'}
              </span>
            </div>

            {/* Right Pill: Humidity */}
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 text-xs font-mono text-white border border-white/10">
              <Droplets className="w-3.5 h-3.5 text-sky-300" />
              <span className="font-medium tracking-tight">
                {weather ? `${weather.humidity}%` : '85%'}
              </span>
            </div>
          </div>

          {/* Wind Speed Row (e.g., 4m/s) */}
          <div className="flex items-center justify-center space-x-2 text-xs font-mono text-white/80">
            <Wind className="w-4 h-4 text-white/60" />
            <span className="tracking-wider">{weather ? `${weather.windSpeedMs}m/s` : '4m/s'}</span>
          </div>

          {/* Production Advice Footer Note */}
          <div className="mt-5 pt-3 border-t border-white/10 text-[10px] text-white/70 font-sans max-w-[260px] leading-snug">
            <span className="text-gold-300 font-mono font-semibold block mb-0.5">
              🎬 Production Status:
            </span>
            {weather?.shootAdvice || '🌲 Misty Ambience • Ideal for Atmospheric Cinematography'}
          </div>

        </div>
      )}

      {/* FULL LOCATION SEARCH & SELECT MODAL */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="w-full max-w-sm bg-charcoal-950 border border-gold-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/30">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                      Set Shoot Location
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Search city or select preset location
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Live Search Input Box */}
              <div className="space-y-3 mb-4">
                <label className="block text-[10px] font-mono text-gold-400 uppercase tracking-wider">
                  🔍 Search Any City / Town Worldwide
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Type city name (e.g. Delhi, London, Udaipur)..."
                    value={searchQuery}
                    onChange={(e) => handleSearchCity(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 bg-black/60 border border-luxury-green-800/40 focus:border-gold-500 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-all"
                    autoFocus
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-3 w-4 h-4 text-gold-400 animate-spin" />
                  )}
                </div>

                {searchError && (
                  <p className="text-[10px] text-amber-400 font-mono">{searchError}</p>
                )}

                {/* Search Results Dropdown List */}
                {searchResults.length > 0 && (
                  <div className="bg-black/90 border border-gold-500/30 rounded-2xl overflow-hidden divide-y divide-white/5 max-h-48 overflow-y-auto">
                    {searchResults.map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => {
                          const stateCountry = [res.admin1, res.country].filter(Boolean).join(', ');
                          selectCityAndClose({
                            name: res.name,
                            lat: res.latitude,
                            lon: res.longitude,
                            tag: stateCountry || 'Custom City'
                          });
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gold-500/20 text-xs text-white flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-white">{res.name}</span>
                          <span className="text-[10px] text-gray-400 block">
                            {[res.admin1, res.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                        <Check className="w-3.5 h-3.5 text-gold-400 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* GPS Auto-detect Button */}
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={gpsLoading}
                className="w-full py-2.5 mb-4 bg-gradient-to-r from-emerald-900/60 via-emerald-800/40 to-emerald-900/60 hover:from-emerald-800 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold font-mono flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {gpsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <Navigation className="w-4 h-4 text-emerald-400" />
                )}
                <span>{gpsLoading ? 'Acquiring GPS Signal...' : 'Use Current Live GPS Location'}</span>
              </button>

              {/* Popular Studio Shoot Presets */}
              <div>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">
                  Popular Studio Shoot Destinations
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {DEFAULT_PRESETS.map((preset) => {
                    const isSelected = selectedCity.name === preset.name;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => selectCityAndClose(preset)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-gold-500/20 border-gold-500/60 text-gold-300 font-bold'
                            : 'bg-black/40 border-white/10 text-gray-300 hover:border-gold-500/30 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-xs font-semibold truncate">{preset.name}</span>
                        <span className="text-[8px] font-mono text-gray-500 truncate">{preset.tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
