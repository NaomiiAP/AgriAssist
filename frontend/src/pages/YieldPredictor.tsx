import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Calendar, DollarSign, Loader2, AlertCircle, MapPin, Crosshair } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

export default function YieldPredictor() {
  const [crop, setCrop] = useState('');
  const [area, setArea] = useState('');
  const [season, setSeason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [mode, setMode] = useState<'simple' | 'ai'>('simple');
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([0, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (location && mapRef.current) {
      // Update marker position
      if (markerRef.current) {
        markerRef.current.setLatLng([location.lat, location.lng]);
      } else {
        markerRef.current = L.marker([location.lat, location.lng]).addTo(mapRef.current);
      }
      // Center map on marker
      mapRef.current.setView([location.lat, location.lng], 13);
    }
  }, [location]);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocoding using OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          setLocation({
            lat: latitude,
            lng: longitude,
            address: data.display_name || 'Location found'
          });
        } catch (error) {
          setError('Failed to get location details');
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        setError('Failed to get your location. Please ensure location access is enabled.');
        setIsLoadingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop || !area || !season) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    if (mode === 'ai') {
      try {
        const response = await fetch('http://localhost:5000/yield-predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            crop,
            area,
            season,
            location: location ? {
              latitude: location.lat,
              longitude: location.lng,
              address: location.address
            } : undefined
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get predictions');
        }

        const data = await response.json();
        setAiResponse(data.response);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to get predictions');
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-800">Yield & Price Predictor</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setMode('simple')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  mode === 'simple'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => setMode('ai')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  mode === 'ai'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                AI Analysis
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crop Type
                  </label>
                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isLoading}
                  >
                    <option value="">Select a crop</option>
                    <option value="rice">Rice</option>
                    <option value="wheat">Wheat</option>
                    <option value="corn">Corn</option>
                    <option value="soybean">Soybean</option>
                    <option value="potato">Potato</option>
                    <option value="tomato">Tomato</option>
                    <option value="cotton">Cotton</option>
                    <option value="sugarcane">Sugarcane</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Area (hectares)
                  </label>
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter area"
                    disabled={isLoading}
                    min="0.1"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Growing Season
                  </label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isLoading}
                  >
                    <option value="">Select season</option>
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="fall">Fall</option>
                    <option value="winter">Winter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="space-y-3">
                    <div id="map" className="h-48 rounded-lg border"></div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        disabled={isLoadingLocation}
                      >
                        {isLoadingLocation ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Crosshair className="h-5 w-5 mr-2" />
                            Get Current Location
                          </>
                        )}
                      </button>
                      {location && (
                        <div className="flex-1 flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-green-600 mr-1" />
                          <span className="truncate">{location.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Analyzing...
                    </span>
                  ) : (
                    'Get Predictions'
                  )}
                </button>
              </form>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              {error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                  <span>{error}</span>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
              ) : mode === 'ai' && aiResponse ? (
                <div className="prose max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-semibold mb-3">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-semibold mb-2">{children}</h3>,
                      p: ({ children }) => <p className="text-gray-700 mb-4">{children}</p>,
                      strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                      em: ({ children }) => <em className="text-gray-600">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-4 space-y-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-4 space-y-2">{children}</ol>,
                      li: ({ children }) => <li className="text-gray-700">{children}</li>,
                    }}
                  >
                    {aiResponse}
                  </ReactMarkdown>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Predictions</h2>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Expected Yield</p>
                        <p className="text-lg font-semibold">-- tons/hectare</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Best Harvest Time</p>
                        <p className="text-lg font-semibold">--</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Estimated Market Price</p>
                        <p className="text-lg font-semibold">$--/ton</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}