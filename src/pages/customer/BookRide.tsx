import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ArrowRight, 
  Car, 
  Star, 
  Calendar,
  MapPin,
  Crosshair,
  Map,
  X,
  Users
} from 'lucide-react';
import { Button, Badge, Card } from '../../components/ui';
import { customerRideApi, fareApi, TokenStore } from '../../lib/api';

import { toast } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// ── Car-only categories with passenger capacity ──────────────────────────────
const CAR_CATEGORIES: Record<string, { capacity: number; label: string; desc: string }> = {
  MINI:     { capacity: 4, label: 'Mini',    desc: 'Compact & affordable' },
  SEDAN:    { capacity: 4, label: 'Sedan',   desc: 'Comfort for everyday rides' },
  SUV:      { capacity: 6, label: 'SUV',     desc: 'Spacious family ride' },
  AUTO:     { capacity: 3, label: 'Auto',    desc: 'Affordable three-wheeler' }
};

// Mock fallback fares when backend is offline
const MOCK_FARES = [
  { category: 'MINI',      fare: 120, eta: '4 min' },
  { category: 'SEDAN',     fare: 190, eta: '6 min' },
  { category: 'SUV',       fare: 280, eta: '7 min' },
  { category: 'AUTO',      fare: 90,  eta: '5 min' },
];

// ── Curated Quick-Suggestions for Tumakuru & Bengaluru ───────────────────────
const QUICK_SUGGESTIONS = [
  // Tumakuru
  { name: 'KSRTC Bus Stand, Tumakuru', type: 'Bus Stand', city: 'Tumakuru', lat: 13.3378, lng: 77.1062 },
  { name: 'Tumakuru Railway Station', type: 'Railway', city: 'Tumakuru', lat: 13.3421, lng: 77.1009 },
  { name: 'SIT College, Tumakuru', type: 'College', city: 'Tumakuru', lat: 13.3275, lng: 77.1252 },
  { name: 'B.H. Road, Tumakuru', type: 'Road', city: 'Tumakuru', lat: 13.3392, lng: 77.1140 },
  { name: 'Sri Siddaganga Math, Tumakuru', type: 'Landmark', city: 'Tumakuru', lat: 13.3101, lng: 77.0987 },
  { name: 'Tumakuru City Center', type: 'Area', city: 'Tumakuru', lat: 13.3392, lng: 77.1140 },
  // Bengaluru
  { name: 'Kempegowda International Airport', type: 'Airport', city: 'Bengaluru', lat: 13.1986, lng: 77.7066 },
  { name: 'Majestic Bus & Railway Station', type: 'Transit Hub', city: 'Bengaluru', lat: 12.9779, lng: 77.5730 },
  { name: 'MG Road Metro Station', type: 'Metro', city: 'Bengaluru', lat: 12.9744, lng: 77.6074 },
  { name: 'Electronic City Phase 1', type: 'IT Hub', city: 'Bengaluru', lat: 12.8564, lng: 77.6749 },
  { name: 'Whitefield ITPL', type: 'IT Park', city: 'Bengaluru', lat: 12.9830, lng: 77.7479 },
  { name: 'Koramangala, Bengaluru', type: 'Neighbourhood', city: 'Bengaluru', lat: 12.9345, lng: 77.6269 },
  { name: 'Indiranagar, Bengaluru', type: 'Neighbourhood', city: 'Bengaluru', lat: 12.9784, lng: 77.6408 },
  { name: 'HSR Layout, Bengaluru', type: 'Area', city: 'Bengaluru', lat: 12.9116, lng: 77.6389 },
];

// Default home base — Tumakuru city center
const DEFAULT_COORDS = { lat: 13.3392, lng: 77.1140 };
const DEFAULT_PICKUP  = 'Tumakuru City Center';

// ── Detect city from coordinates ─────────────────────────────────────────────
function detectCity(lat: number, lng: number): string {
  // Bengaluru bounding box: 12.7–13.2 N, 77.4–77.9 E
  if (lat >= 12.7 && lat <= 13.2 && lng >= 77.4 && lng <= 77.9) return 'Bengaluru';
  // Tumakuru bounding box: 13.2–13.5 N, 76.9–77.3 E
  if (lat >= 13.2 && lat <= 13.5 && lng >= 76.9 && lng <= 77.3) return 'Tumakuru';
  // Mysuru
  if (lat >= 12.1 && lat <= 12.5 && lng >= 76.5 && lng <= 76.9) return 'Mysuru';
  // Mangaluru
  if (lat >= 12.7 && lat <= 13.1 && lng >= 74.7 && lng <= 75.1) return 'Mangaluru';
  // For inter-city routes, pick the city closest to drop
  return 'Bengaluru';
}

// ── Nominatim autocomplete with Tumakuru/Bengaluru bias ──────────────────────
async function searchPlaces(query: string): Promise<Array<{ display_name: string; lat: string; lon: string; address: any }>> {
  if (query.length < 3) return [];
  try {
    // Bias to Karnataka (viewbox covers Tumakuru + Bengaluru area)
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query + ', Karnataka')}&viewbox=76.6,13.7,78.0,12.6&bounded=0&limit=6&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function formatNominatimName(item: any): string {
  const a = item.address || {};
  const parts: string[] = [];
  if (a.road || a.pedestrian || a.footway) parts.push(a.road || a.pedestrian || a.footway);
  if (a.suburb || a.neighbourhood || a.quarter) parts.push(a.suburb || a.neighbourhood || a.quarter);
  if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
  if (a.state_district) parts.push(a.state_district);
  return parts.length > 0 ? parts.join(', ') : item.display_name.split(',').slice(0, 3).join(',').trim();
}

export default function BookRide() {
  const [step, setStep] = useState(1); // 1: Locations, 2: Vehicle Select
  const [pickup, setPickup] = useState(DEFAULT_PICKUP);
  const [destination, setDestination] = useState('');
  const [selectedRide, setSelectedRide] = useState<string>('');
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Coordinates State — default to Tumakuru
  const [pickupCoords, setPickupCoords] = useState(DEFAULT_COORDS);
  const [dropCoords, setDropCoords] = useState({ lat: 12.9779, lng: 77.5730 }); // Majestic, Bengaluru

  // Autocomplete state
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<any[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const [pickupSearching, setPickupSearching] = useState(false);
  const [dropSearching, setDropSearching] = useState(false);

  // Map Selector Modal State
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapTarget, setMapTarget] = useState<'PICKUP' | 'DROP'>('PICKUP');
  const [tempLocation, setTempLocation] = useState('');
  const [tempCoordinates, setTempCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const navigate = useNavigate();

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  // Autocomplete debounce refs
  const pickupTimer = useRef<any>(null);
  const dropTimer   = useRef<any>(null);
  const pickupRef   = useRef<HTMLDivElement>(null);
  const dropRef     = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickupRef.current && !pickupRef.current.contains(e.target as Node)) {
        setShowPickupSuggestions(false);
      }
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDropSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Pickup autocomplete handler
  const handlePickupChange = (value: string) => {
    setPickup(value);
    clearTimeout(pickupTimer.current);
    if (value.length < 2) { setPickupSuggestions([]); setShowPickupSuggestions(false); return; }
    setPickupSearching(true);
    pickupTimer.current = setTimeout(async () => {
      const results = await searchPlaces(value);
      setPickupSuggestions(results);
      setShowPickupSuggestions(results.length > 0);
      setPickupSearching(false);
    }, 350);
  };

  // Drop autocomplete handler
  const handleDropChange = (value: string) => {
    setDestination(value);
    clearTimeout(dropTimer.current);
    if (value.length < 2) { setDropSuggestions([]); setShowDropSuggestions(false); return; }
    setDropSearching(true);
    dropTimer.current = setTimeout(async () => {
      const results = await searchPlaces(value);
      setDropSuggestions(results);
      setShowDropSuggestions(results.length > 0);
      setDropSearching(false);
    }, 350);
  };

  const selectPickupSuggestion = (item: any) => {
    const name = formatNominatimName(item);
    setPickup(name);
    setPickupCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setShowPickupSuggestions(false);
    setPickupSuggestions([]);
  };

  const selectDropSuggestion = (item: any) => {
    const name = formatNominatimName(item);
    setDestination(name);
    setDropCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setShowDropSuggestions(false);
    setDropSuggestions([]);
  };

  const selectQuickSuggestion = (s: typeof QUICK_SUGGESTIONS[0]) => {
    setDestination(s.name);
    setDropCoords({ lat: s.lat, lng: s.lng });
  };

  // Initialize and clean up Leaflet Map
  useEffect(() => {
    if (!isMapOpen || !mapContainerRef.current) return;
    let active = true;

    import('leaflet').then((L) => {
      if (!active || !mapContainerRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const initialCoords = mapTarget === 'PICKUP' ? pickupCoords : dropCoords;
      const map = L.map(mapContainerRef.current).setView([initialCoords.lat, initialCoords.lng], 13);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const marker = L.marker([initialCoords.lat, initialCoords.lng], { draggable: true }).addTo(map);
      markerInstanceRef.current = marker;

      const updateLocationInfo = async (lat: number, lng: number) => {
        setTempCoordinates({ lat, lng });
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (response.ok) {
            const data = await response.json();
            const details = data.address;
            const shortName = details.road || details.suburb || details.neighbourhood || details.city || data.display_name.split(',')[0];
            const fullName = data.display_name;
            setTempLocation(`${shortName} (${fullName.split(',').slice(0, 3).join(',')})`);
          } else {
            setTempLocation(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } catch {
          setTempLocation(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      };

      updateLocationInfo(initialCoords.lat, initialCoords.lng);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        updateLocationInfo(position.lat, position.lng);
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        updateLocationInfo(lat, lng);
      });
    });

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, [isMapOpen, mapTarget]);

  // HTML5 Current Location Handler
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLoading(true);
    toast.loading('Fetching current location...', { id: 'geo' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPickupCoords({ lat: latitude, lng: longitude });
        setPickup(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        toast.success('Current location updated!', { id: 'geo' });
        setLoading(false);
      },
      () => {
        // Fallback to Tumakuru city center
        setPickupCoords(DEFAULT_COORDS);
        setPickup('Tumakuru City Center (GPS Fallback)');
        toast.success('Using Tumakuru city center as fallback', { id: 'geo' });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Open Map Selector Modal
  const handleOpenMapSelector = (target: 'PICKUP' | 'DROP') => {
    setMapTarget(target);
    setTempLocation('');
    setTempCoordinates(null);
    setIsMapOpen(true);
  };

  // Confirm Map Selection
  const handleConfirmMapSelection = () => {
    if (!tempLocation || !tempCoordinates) return;
    if (mapTarget === 'PICKUP') {
      setPickup(tempLocation);
      setPickupCoords(tempCoordinates);
    } else {
      setDestination(tempLocation);
      setDropCoords(tempCoordinates);
    }
    setIsMapOpen(false);
    toast.success('Location set from map!');
  };

  const fetchEstimates = async () => {
    if (!destination) return;
    setLoading(true);

    // Detect city based on drop coordinates (for inter-city routes, use drop city for pricing)
    const city = detectCity(dropCoords.lat, dropCoords.lng);

    try {
      const categories = ['MINI', 'SEDAN', 'SUV', 'AUTO'];
      const estimatesData = await Promise.all(
        categories.map(async (category) => {
          try {
            const res = await fareApi.estimate({
              pickupLat: pickupCoords.lat,
              pickupLng: pickupCoords.lng,
              dropLat: dropCoords.lat,
              dropLng: dropCoords.lng,
              city,
              vehicleType: category
            });
            return {
              category,
              fare: res.data.estimatedFare,
              eta: `${res.data.durationMinutes} min`,
              distance: res.data.distanceKm,
              traffic: res.data.traffic,
              breakdown: res.data.breakdown
            };
          } catch (e) {
            console.error(`Failed to fetch estimate for ${category}`, e);
            return null;
          }
        })
      );

      const validEstimates = estimatesData.filter(Boolean);
      if (validEstimates.length > 0) {
        setEstimates(validEstimates);
        setSelectedRide(validEstimates[0].category);
        setStep(2);
      } else {
        throw new Error("No estimates returned from server");
      }
    } catch (err) {
      toast.success('Showing fallback rides');
      setEstimates(MOCK_FARES.map(f => ({
        category: f.category,
        fare: f.fare,
        eta: f.eta,
        distance: 12.5,
        traffic: 'MEDIUM',
        breakdown: { base: 50, distance: 100, time: 20, traffic: 1.05, demand: 1.0 }
      })));
      setSelectedRide(MOCK_FARES[0].category);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 2) {
      fetchEstimates();
    }
  }, [pickupCoords, dropCoords]);

  const handleBook = async () => {
    setLoading(true);
    try {
      const payload = {
        pickupLocation: pickup,
        pickupLatitude: pickupCoords.lat,
        pickupLongitude: pickupCoords.lng,
        dropLocation: destination,
        dropLatitude: dropCoords.lat,
        dropLongitude: dropCoords.lng,
        vehicleCategory: selectedRide,
        paymentMethod: 'WALLET'
      };
      await customerRideApi.book(payload);
      toast.success('Searching for nearby drivers...');
      navigate('/customer/tracking');
    } catch (err) {
      toast.error('Failed to book ride');
    } finally {
      setLoading(false);
    }
  };

  // Filter quick suggestions based on current input
  const filteredQuickSuggestions = destination.length > 0
    ? QUICK_SUGGESTIONS.filter(s =>
        s.name.toLowerCase().includes(destination.toLowerCase()) ||
        s.city.toLowerCase().includes(destination.toLowerCase()) ||
        s.type.toLowerCase().includes(destination.toLowerCase())
      ).slice(0, 5)
    : QUICK_SUGGESTIONS.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-4 overflow-hidden">
      
      {/* Header */}
      <div className="px-6 flex items-center justify-between mb-6">
         <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => step > 1 ? setStep(1) : navigate('/customer')}
            className="rounded-2xl"
          >
            <ChevronLeft className="w-6 h-6" />
         </Button>
         <h1 className="text-xl font-black uppercase tracking-tighter italic">Book a Ride</h1>
         <div className="w-10 h-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-8 pb-32">
        
        {/* Step 1: Location Inputs */}
        <div className="space-y-4">
           {/* Pickup */}
           <div className="relative" ref={pickupRef}>
              <div className="relative flex items-center">
                <div className="absolute left-6 w-2 h-2 rounded-full bg-emerald-500 z-10 shadow-lg shadow-emerald-200" />
                <input 
                  type="text" 
                  value={pickup}
                  onChange={(e) => handlePickupChange(e.target.value)}
                  onFocus={() => { if (pickupSuggestions.length > 0) setShowPickupSuggestions(true); }}
                  placeholder="Pick up point"
                  className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] py-5 pl-14 pr-24 font-bold text-slate-900 dark:text-white transition-all focus:border-indigo-500 outline-none shadow-sm"
                />
                <div className="absolute right-4 flex items-center gap-2 z-20">
                   {pickupSearching && <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />}
                   <button 
                     type="button"
                     onClick={handleGetCurrentLocation}
                     className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/35 hover:text-indigo-600 rounded-xl transition-all"
                     title="Use Current Location"
                   >
                      <Crosshair className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                   </button>
                   <button 
                     type="button"
                     onClick={() => handleOpenMapSelector('PICKUP')}
                     className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/35 hover:text-indigo-600 rounded-xl transition-all"
                     title="Select on Map"
                   >
                      <Map className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                   </button>
                </div>
              </div>
              {/* Pickup Suggestions Dropdown */}
              {showPickupSuggestions && pickupSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                  {pickupSuggestions.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => selectPickupSuggestion(item)}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                    >
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{formatNominatimName(item)}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.display_name.split(',').slice(0, 4).join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
           </div>

           <div className="px-6">
              <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-800 ml-1" />
           </div>

           {/* Drop */}
           <div className="relative" ref={dropRef}>
              <div className="relative flex items-center">
                <div className="absolute left-6 w-2 h-2 rounded-full bg-indigo-600 z-10 shadow-lg shadow-indigo-200" />
                <input 
                  type="text" 
                  value={destination}
                  onChange={(e) => handleDropChange(e.target.value)}
                  onFocus={() => { if (dropSuggestions.length > 0) setShowDropSuggestions(true); }}
                  placeholder="Where to? Search Tumakuru, Bengaluru..."
                  className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] py-5 pl-14 pr-16 font-bold text-slate-900 dark:text-white transition-all focus:border-indigo-500 outline-none shadow-sm"
                  autoFocus
                />
                <div className="absolute right-4 flex items-center gap-2 z-20">
                   {dropSearching && <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />}
                   <button 
                     type="button"
                     onClick={() => handleOpenMapSelector('DROP')}
                     className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/35 hover:text-indigo-600 rounded-xl transition-all"
                     title="Select on Map"
                   >
                      <Map className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                   </button>
                </div>
              </div>
              {/* Drop Suggestions Dropdown */}
              {showDropSuggestions && dropSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                  {dropSuggestions.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => selectDropSuggestion(item)}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                    >
                      <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{formatNominatimName(item)}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.display_name.split(',').slice(0, 4).join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
               key="step1"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="space-y-6"
            >
               {/* Quick Suggestions */}
               <div>
                 <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-3">
                   {destination.length > 0 ? 'Matching Places' : 'Popular Destinations'}
                 </h2>
                 <div className="space-y-3">
                   {filteredQuickSuggestions.map((loc) => (
                     <div 
                       key={loc.name}
                       onClick={() => selectQuickSuggestion(loc)}
                       className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 cursor-pointer hover:border-indigo-500 transition-all active:scale-95 shadow-sm"
                     >
                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
                           {loc.type === 'Airport' ? <span className="text-base">✈️</span> :
                            loc.type === 'Railway' ? <span className="text-base">🚉</span> :
                            loc.type === 'Bus Stand' || loc.type === 'Transit Hub' ? <span className="text-base">🚌</span> :
                            loc.type === 'Metro' ? <span className="text-base">🚇</span> :
                            loc.type === 'College' ? <span className="text-base">🎓</span> :
                            <MapPin className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                           <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-tight">{loc.name}</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{loc.type} • {loc.city}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                     </div>
                   ))}
                   {filteredQuickSuggestions.length === 0 && destination.length > 0 && (
                     <p className="text-xs text-slate-400 text-center py-4">No matching places. Try searching above or select on map.</p>
                   )}
                 </div>
               </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
               key="step2"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="space-y-6"
            >
               <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Choose Ride</h2>
               <div className="space-y-3">
                  {estimates.map((ride) => {
                    const meta = CAR_CATEGORIES[ride.category];
                    if (!meta) return null;
                    const isSelected = selectedRide === ride.category;
                    return (
                      <div 
                        key={ride.category}
                        onClick={() => setSelectedRide(ride.category)}
                        className={cn(
                          "p-5 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col items-stretch",
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500 shadow-xl shadow-indigo-100 dark:shadow-none" 
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-300"
                        )}
                      >
                         <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-16 h-16 rounded-3xl flex items-center justify-center transition-colors shrink-0",
                              isSelected ? "bg-indigo-600 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-400"
                            )}>
                               <Car className="w-8 h-8" />
                            </div>

                            <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                    {meta.label}
                                  </h4>
                                  <Badge className="bg-emerald-100 text-emerald-600 border-none font-bold text-[8px] tracking-widest">
                                    {ride.eta}
                                  </Badge>
                               </div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                 {meta.desc}
                               </p>
                               <div className="flex items-center gap-1 mt-1.5">
                                 <Users className={cn("w-3.5 h-3.5", isSelected ? "text-indigo-500" : "text-slate-400")} />
                                 <span className={cn(
                                   "text-[10px] font-black uppercase tracking-widest",
                                   isSelected ? "text-indigo-600" : "text-slate-400"
                                 )}>
                                   {meta.capacity} People
                                 </span>
                               </div>
                            </div>

                            <div className="text-right shrink-0">
                               <p className="font-black text-slate-900 dark:text-white text-lg tracking-tight">₹{ride.fare.toFixed(0)}</p>
                               <p className={cn(
                                 "text-[9px] font-bold uppercase tracking-widest mt-0.5",
                                 isSelected ? "text-indigo-400" : "text-slate-300"
                               )}>per ride</p>
                            </div>
                         </div>

                         {/* Fare Breakdown Details */}
                         {isSelected && ride.breakdown && (
                           <motion.div 
                             initial={{ opacity: 0, height: 0 }}
                             animate={{ opacity: 1, height: 'auto' }}
                             className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-left space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400"
                           >
                              <div className="flex justify-between">
                                 <span className="uppercase text-[9px] tracking-wider text-slate-400">Base Fare</span>
                                 <span className="font-bold text-slate-700 dark:text-slate-200">₹{ride.breakdown.base}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="uppercase text-[9px] tracking-wider text-slate-400">Distance Charge ({ride.distance ? ride.distance.toFixed(1) : '0'} km)</span>
                                 <span className="font-bold text-slate-700 dark:text-slate-200">₹{ride.breakdown.distance.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="uppercase text-[9px] tracking-wider text-slate-400">Time Charge ({ride.eta})</span>
                                 <span className="font-bold text-slate-700 dark:text-slate-200">₹{ride.breakdown.time.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="uppercase text-[9px] tracking-wider text-slate-400">Traffic Factor ({ride.traffic || 'LOW'})</span>
                                 <span className="font-bold text-indigo-600 dark:text-indigo-400">x{ride.breakdown.traffic.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                                 <span className="uppercase text-[9px] tracking-wider">Demand / Special Multipliers</span>
                                 <span>x{((ride.breakdown.demand || 1) * (ride.breakdown.peak || 1) * (ride.breakdown.weekend || 1) * (ride.breakdown.festival || 1)).toFixed(2)}</span>
                              </div>
                           </motion.div>
                         )}
                      </div>
                    );
                  })}
               </div>

               <Card className="p-6 bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-between border-none">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Payment Method</p>
                        <h4 className="font-bold text-sm tracking-tight capitalize italic">Wallet Balance</h4>
                     </div>
                  </div>
                  <Badge className="bg-indigo-500 text-white border-none font-bold italic">ACTIVE</Badge>
               </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Floating Action Button Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-30">
         <div className="max-w-lg mx-auto w-full space-y-4">
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-800">
                     <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Pick Timing</span>
               </div>
               <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Change Pay Method</span>
            </div>
            
            <Button 
               disabled={(!destination && step === 1) || loading}
               onClick={() => step === 1 ? fetchEstimates() : handleBook()}
               className="w-full py-8 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl shadow-2xl shadow-indigo-200 dark:shadow-none border-none transition-all active:scale-95 group"
            >
               {loading ? (
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
               ) : (
                  <>
                     {step === 1 ? 'FIND RIDES' : 'CONFIRM ' + selectedRide}
                     <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
               )}
            </Button>
         </div>
      </div>

      {/* Map Selector Modal */}
      <AnimatePresence>
        {isMapOpen && (
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col justify-end md:justify-center md:items-center p-4"
          >
             <style>{`
               .leaflet-container {
                 width: 100% !important;
                 height: 100% !important;
                 border-radius: 0 !important;
                 z-index: 10 !important;
               }
               .leaflet-control-zoom {
                 border: none !important;
                 box-shadow: 0 10px 30px rgba(0,0,0,0.08) !important;
                 border-radius: 16px !important;
                 overflow: hidden;
               }
               .leaflet-bar a {
                 background-color: white !important;
                 color: #1e293b !important;
                 border-bottom: 1px solid #f1f5f9 !important;
                 transition: all 0.2s;
               }
               .leaflet-bar a:hover {
                 background-color: #f8fafc !important;
                 color: #4f46e5 !important;
               }
             `}</style>
             <motion.div 
                initial={{ y: 100, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 100, scale: 0.95 }}
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[80vh] md:h-[600px] border border-slate-100 dark:border-slate-800"
             >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <div>
                      <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight italic">
                         {mapTarget === 'PICKUP' ? 'Select Pickup Point' : 'Select Drop Point'}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Drag & tap anywhere on the map to place pin</p>
                   </div>
                   <button 
                      onClick={() => setIsMapOpen(false)}
                      className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 flex items-center justify-center transition-all text-slate-400"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>

                {/* Interactive Real Leaflet Map */}
                <div 
                   ref={mapContainerRef} 
                   className="flex-1 w-full bg-slate-100 dark:bg-slate-950 relative z-10" 
                   style={{ height: '100%', minHeight: '300px' }}
                />

                {/* Modal Bottom Control Panel */}
                <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-4">
                   <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center gap-4 border border-slate-100 dark:border-slate-800">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                         <MapPin className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Location Address</p>
                         <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                            {tempLocation || 'Tap anywhere on map to select...'}
                         </h4>
                         <p className="text-[9px] text-indigo-500 font-mono mt-0.5">
                            {tempCoordinates ? `Coordinates: ${tempCoordinates.lat.toFixed(4)}, ${tempCoordinates.lng.toFixed(4)}` : 'Latitude, Longitude'}
                         </p>
                      </div>
                   </div>

                   <Button 
                      disabled={!tempLocation}
                      onClick={handleConfirmMapSelection}
                      className="w-full py-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-100 dark:shadow-none border-none uppercase tracking-widest"
                   >
                      Confirm This Spot
                   </Button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
