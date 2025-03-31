// component responsible for rendering the Google Map
import React, { useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  GoogleMap,
  Libraries,
  LoadScript,
  Marker,
} from "@react-google-maps/api";

// Define MAP_LIBRARIES outside the component to avoid redefinition on every render
const MAP_LIBRARIES: Libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "700px",
};

const center = {
  lat: 47.3769, // Default to Zurich coordinates
  lng: 8.5417,
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const DriverMap = () => {
  const [selectedLocation, setSelectedLocation] = useState(center);
  const [allProposals, setAllProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState(12);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const isLoadingRef = useRef(false);

  const BASE_URL = process.env.NODE_ENV === "production"
    ? "https://sopra-fs25-group-39-client.vercel.app/" // Production API URL
    : "http://localhost:5001"; // Development API URL, change to 3000 as soon as the backend has implemented the get contracts endpoint

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError("Google Maps API key is missing.");
    }
    if (selectedLocation) {
      fetchProposals(selectedLocation);
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (mapInstance && allProposals.length > 0) {
      filterProposalsByBounds();
    }
  }, [mapInstance, allProposals]);

  // Handle successful map load
  const handleMapLoad = (map: google.maps.Map) => {
    setMapInstance(map);
    console.log("Google Map Loaded Successfully");
    setMapError(null); // Reset any error if map is loaded successfully

    if (allProposals.length > 0) {
      setTimeout(filterProposalsByBounds, 100);
    }
  };

  // Handle error in loading map
  const handleMapError = (e: unknown) => {
    console.error("Error loading Google Map:", e);
    setMapError("Failed to load Google Map. Please try again later.");
  };

  const fetchProposals = async (location: { lat: number; lng: number }) => {
    if (isLoadingRef.current) return; // Prevent fetch if already loading
    isLoadingRef.current = true;
    try {

      const response = await fetch(`${BASE_URL}/api/v1/map/contracts?lat=${location.lat}&lng=${location.lng}&radius=5000&filters={}`);

      const data = await response.json();
      setAllProposals(data.features);

      //ensure map is ready
      if (mapInstance) {
        setTimeout(filterProposalsByBounds, 100); //small delay to ensure bounds are available
      }

      // Filter proposals immediately after fetching
      if (mapInstance) {
        const bounds = mapInstance.getBounds();
        if (bounds) {
          const filtered = data.features.filter(
            (proposal: { geometry: { coordinates: [number, number] } }) => {
              const proposalLat = proposal.geometry.coordinates[0];
              const proposalLng = proposal.geometry.coordinates[1];
              return bounds.contains(
                new google.maps.LatLng(proposalLat, proposalLng),
              );
            },
          );
          setFilteredProposals(filtered);
        }
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place?.geometry?.location) {
        const newLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setSelectedLocation(newLocation);

        fetchProposals(newLocation);
      } else {
        console.error("No location data available for this place.");
      }
    }
  };

  const filterProposalsByBounds = () => {
    if (mapInstance) {
      const bounds = mapInstance.getBounds();
      if (!bounds) return;

      const filtered = allProposals.filter(
        (proposal: { geometry: { coordinates: [number, number] } }) => {
          const proposalLat = proposal.geometry.coordinates[0];
          const proposalLng = proposal.geometry.coordinates[1];
          return bounds.contains(
            new google.maps.LatLng(proposalLat, proposalLng),
          );
        },
      );

      setFilteredProposals(filtered);
    }
  };

  const handleMapDragEnd = () => {
    filterProposalsByBounds();
  };

  const handleMapZoom = () => {
    if (mapInstance) {
      setZoom(mapInstance.getZoom() || 12); // Update zoom level state
      filterProposalsByBounds(); // Re-filter proposals when zooming or panning
    }
  };

  // Display an error message if there is an error
  if (mapError) {
    return <div style={{ color: "red" }}>{mapError}</div>;
  }

  // Check if the API key is present before attempting to render the map
  if (!GOOGLE_MAPS_API_KEY) {
    return <div style={{ color: "red" }}>Missing API Key</div>;
  }

  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={MAP_LIBRARIES}
      onError={handleMapError}
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={selectedLocation}
        zoom={12}
        onLoad={handleMapLoad}
        onDragEnd={handleMapDragEnd}

        onZoomChanged={handleMapZoom}
      > 
        {/* Search Input */}
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>
          <Autocomplete
            onLoad={(auto) => (autocompleteRef.current = auto)}
            onPlaceChanged={handlePlaceChanged}
          >
            <input
              type="text"
              placeholder="Search location..."
              style={{
                width: "250px",
                padding: "10px",
                fontSize: "16px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </Autocomplete>
        </div>

        {filteredProposals.map(
          (proposal: { id: string; geometry: { coordinates: [number, number] } }) => (
            <Marker
              key={proposal.id}
              position={{
                lat: proposal.geometry.coordinates[0],
                lng: proposal.geometry.coordinates[1],
              }}
            />
          )
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default DriverMap;
