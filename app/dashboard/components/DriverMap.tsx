// component responsible for rendering the Google Map
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  GoogleMap,
  Libraries,
  LoadScript,
  Marker,
} from "@react-google-maps/api";

// Define MAP_LIBRARIES outside the component to avoid redefinition on every render
const MAP_LIBRARIES: Libraries = ["places"];

const center = {
  lat: 47.3769, // Default to Zurich coordinates
  lng: 8.5417,
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface DriverMapProps {
  containerStyle: React.CSSProperties;
  filters: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onCenterChanged?: (lat: number, lng: number) => void;
}

const DriverMap: React.FC<DriverMapProps> = (
  { containerStyle, filters, onCenterChanged },
) => {
  const [selectedLocation, setSelectedLocation] = useState(center);
  const [allContracts, setallContracts] = useState([]);
  const [filteredContracts, setfilteredContracts] = useState([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const isLoadingRef = useRef(false);

  console.log(filteredContracts)
  

  const BASE_URL = process.env.NODE_ENV === "production"
    ? "https://sopra-fs25-group-39-client.vercel.app/" // Production API URL
    : "http://localhost:5001"; // Development API URL, change to 3000 as soon as the backend has implemented the get contracts endpoint (Mock Backend URL = localhost 5001)

  const fetchContracts = useCallback(
    async () => {
      if (isLoadingRef.current) return; // Prevent fetch if already loading
      isLoadingRef.current = true;
      try {
        const query: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (filters.lat !== null) query.lat = selectedLocation.lat;
        if (filters.lng !== null) query.lng = selectedLocation.lng;

        const filterParams: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (filters.radius !== null) filterParams.radius = filters.radius;
        if (filters.price !== null) filterParams.price = filters.price;
        if (filters.weight !== null) filterParams.weight = filters.weight;
        if (filters.volume !== null) filterParams.volume = filters.volume;
        if (filters.requiredPeople !== null) {
          filterParams.requiredPeople = filters.requiredPeople;
        }
        if (filters.fragile !== null) filterParams.fragile = filters.fragile;
        if (filters.coolingRequired !== null) {
          filterParams.coolingRequired = filters.coolingRequired;
        }
        if (filters.rideAlong !== null) {
          filterParams.rideAlong = filters.rideAlong;
        }
        if (filters.moveDateTime !== null) {
          filterParams.moveDateTime = filters.moveDateTime.format(
            "YYYY-MM-DDTHH:mm:ss",
          );
        }

        if (Object.keys(filterParams).length > 0) {
          query.filters = JSON.stringify(filterParams);
        }

        console.log("Filters passed to the API call:", query);

        const response = await fetch(
          `${BASE_URL}/api/v1/map/contracts?lat=${selectedLocation.lat}&lng=${selectedLocation.lng}&filters=${
            encodeURIComponent(query.filters)
          }`,
        );
        const data = await response.json();
        setallContracts(Array.isArray(data.contracts) ? data.contracts : []);

        // Filter contracts immediately after fetching
        if (mapInstance) {
          const bounds = mapInstance.getBounds();
          if (bounds) {
            const filtered = data.contracts.filter(
              (
                contract: {
                  fromLocation: { latitude: number; longitude: number };
                },
              ) => {
                const contractLat = contract.fromLocation.latitude;
                const contractLng = contract.fromLocation.longitude;
                return bounds.contains(
                  new google.maps.LatLng(contractLat, contractLng),
                );
              },
            );
            setfilteredContracts(filtered);
          }
        }
      } catch (error) {
        console.error("Error fetching contracts:", error);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [selectedLocation, filters, mapInstance, BASE_URL],
  );

  const filtercontractsByBounds = useCallback(() => {
    if (!mapInstance) {
      console.error("mapInstance is null or undefined");
      return;
    }

    if (!Array.isArray(allContracts) || allContracts.length === 0) {
      console.error("allContracts is not a valid array or is empty");
      return;
    }

    const bounds = mapInstance.getBounds();
    if (!bounds) {
      console.error("mapInstance.getBounds() returned null or undefined");
      return;
    }

    const filtered = allContracts.filter(
      (contract: { fromLocation: { latitude: number; longitude: number } }) => {
        if (
          !contract.fromLocation ||
          typeof contract.fromLocation.latitude !== "number" ||
          typeof contract.fromLocation.longitude !== "number"
        ) {
          console.error(
            "Invalid contract fromLocation or coordinates",
            contract,
          );
          return false;
        }

        const contractLat = contract.fromLocation.latitude;
        const contractLng = contract.fromLocation.longitude;

        return bounds.contains(
          new google.maps.LatLng(contractLat, contractLng),
        );
      },
    );

    setfilteredContracts(filtered);
  }, [allContracts, mapInstance]);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError("Google Maps API key is missing.");
    }
    fetchContracts();
    if (onCenterChanged) {
      onCenterChanged(center.lat, center.lng);
    }
  }, [fetchContracts, filters, onCenterChanged]);

  useEffect(() => {
    if (mapInstance) {
      const center = mapInstance.getCenter();
      if (center) {
        fetchContracts();
      }
    }
  }, [fetchContracts, mapInstance, filters]);

  useEffect(() => {
    if (mapInstance && allContracts.length > 0) {
      filtercontractsByBounds();
    }
  }, [filtercontractsByBounds, mapInstance, allContracts]);

  // Handle successful map load
  const handleMapLoad = (map: google.maps.Map) => {
    if (!map || typeof map.getBounds !== "function") {
      console.error("Google Map failed to load properly.");
      setMapError("Map failed to initialize.");
      return;
    }
    setMapInstance(map);

    console.log("Google Map Loaded Successfully");
    setMapError(null); // Reset any error if map is loaded successfully
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

  console.log(fetchProposals)

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place?.geometry?.location) {
        const newLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        // Update map center
        setSelectedLocation(newLocation);
        if (mapInstance) {
          mapInstance.setCenter(
            new google.maps.LatLng(newLocation.lat, newLocation.lng),
          );
        }

        // Notify parent component of center change (if applicable)
        if (onCenterChanged) {
          onCenterChanged(newLocation.lat, newLocation.lng);
        }

        // Update filters with the new coordinates
        filters.lat = newLocation.lat;
        filters.lng = newLocation.lng;

        // Notify parent component of center change (if applicable)
        if (onCenterChanged) {
          onCenterChanged(newLocation.lat, newLocation.lng);
        }
        fetchContracts();
      } else {
        console.error("No location data available for this place.");
      }
    }
  };

  const handleMapDragEnd = () => {
    if (mapInstance) {
      const center = mapInstance.getCenter();
      if (center && onCenterChanged) {
        onCenterChanged(center.lat(), center.lng());
      }
    }
    filtercontractsByBounds();
  };

  const handleMapZoom = () => {
    if (mapInstance) {
      filtercontractsByBounds();
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
        mapContainerStyle={containerStyle}
        center={selectedLocation}
        zoom={12}
        options={{ fullscreenControl: false, streetViewControl: false }}
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
