// component responsible for rendering the Google Map
import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '700px',
};

const center = {
  lat: 47.3769, // Default to Zurich coordinates
  lng: 8.5417,
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const DriverMap = () => {
  const [selectedLocation, setSelectedLocation] = useState(center);
  const [mapError, setMapError] = useState<string | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError('Google Maps API key is missing.');
    }
  }, []);

  // Handle successful map load
  const handleMapLoad = () => {
    console.log('Google Map Loaded Successfully');
    setMapError(null); // Reset any error if map is loaded successfully
  };

  // Handle error in loading map
  const handleMapError = (e: unknown) => {
    console.error('Error loading Google Map:', e);
    setMapError('Failed to load Google Map. Please try again later.');
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (!place || !place.geometry || !place.geometry.location) {
        console.error("No location data available for this place.");
        return;
      }
      setSelectedLocation({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
  };

  // Display an error message if there is an error
  if (mapError) {
    return <div style={{ color: 'red' }}>{mapError}</div>;
  }

  // Check if the API key is present before attempting to render the map
  if (!GOOGLE_MAPS_API_KEY) {
    return <div style={{ color: 'red' }}>Missing API Key</div>;
  }

  

  return (
    <LoadScript 
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={["places"]} 
        onLoad={handleMapLoad}
        onError={handleMapError}
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={selectedLocation}
        zoom={12}
      > 
        {/* Search Input */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
          <Autocomplete onLoad={(auto) => (autocompleteRef.current = auto)} onPlaceChanged={handlePlaceChanged}>
            <input
              type="text"
              placeholder="Search location..."
              style={{ width: '250px', padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px', }}
            />
          </Autocomplete>
          </div>
        <Marker position={selectedLocation} />
      </GoogleMap>
    </LoadScript>
  );
};

export default DriverMap;