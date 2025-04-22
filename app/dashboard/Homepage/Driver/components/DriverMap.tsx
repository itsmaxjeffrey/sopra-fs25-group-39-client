"use client";
import '@ant-design/v5-patch-for-react-19';
// component responsible for rendering the Google Map
// from Commit 89667df
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";

import {
  Autocomplete,
  GoogleMap,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { getApiDomain } from "@/utils/domain";
import styles from "./DriverMap.module.css";

const center = {
  lat: 47.3769, // Default to Zurich coordinates
  lng: 8.5417,
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Map style to simplify POIs
const mapStyles = [
  {
    featureType: "poi", // Target Points of Interest
    elementType: "all", // Apply to all elements (icons, labels)
    stylers: [{ visibility: "simplified" }] // Reduce visibility (less prominent icons/fewer shown)
    // Alternatively, use "off" to hide them completely:
    // stylers: [{ visibility: "off" }]
  },
  // Optional: Keep road labels clear if simplified POIs affect them
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#666666" }] // Ensure road labels are readable
  }
];

interface DriverMapProps {
  containerStyle: React.CSSProperties;
  filters: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onCenterChanged?: (lat: number, lng: number) => void;
}

interface Contract {
  contractId: string;
  title: string;
  fromLocation: { latitude: number; longitude: number };
  contractStatus: "REQUESTED" | "OFFERED" | "ACCEPTED" | "COMPLETED" | "CANCELED" | "DELETED";
  driverId?: number;
  price?: number;
  moveDateTime?: string;
  contractPhotos?: string[];
}

interface ContractQuery {
  lat?: number;
  lng?: number;
}

interface FilterParams {
  radius?: number;
  price?: number;
  weight?: number;
  volume?: number;
  requiredPeople?: number;
  fragile?: boolean;
  coolingRequired?: boolean;
  rideAlong?: boolean;
  moveDate?: string;
}

const DriverMap: React.FC<DriverMapProps> = (
  { containerStyle, filters, onCenterChanged },
) => {
  // Updated icon definitions: Narrower, teardrop shape
  const defaultIcon = useMemo(() => ({
    // Narrower teardrop path
    path: "M12 2C8.1 2 5 5.1 5 9.3c0 2.3.9 4.4 2.4 6.1.1.1 4.6 6.6 4.6 6.6s4.5-6.5 4.6-6.6c1.5-1.7 2.4-3.8 2.4-6.1C19 5.1 15.9 2 12 2zm0 10.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z",
    fillColor: "#EA4335", // Google Red
    fillOpacity: 1.0,
    strokeColor: "#000000", // Black stroke
    strokeWeight: 1.2, // Slightly reduced stroke weight
    rotation: 0,
    scale: 1.5, // Adjusted scale
    anchor: typeof window !== 'undefined' && window.google ? new google.maps.Point(12, 22) : undefined, // Adjusted anchor
  }), []);

  const acceptedIcon = useMemo(() => ({
    ...defaultIcon,
    fillColor: "#34A853", // Google Green
  }), [defaultIcon]);

  const [selectedLocation, setSelectedLocation] = useState(center);
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [displayContracts, setDisplayContracts] = useState<Contract[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const isLoadingRef = useRef(false);
  const [openInfoWindowId, setOpenInfoWindowId] = useState<string | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

  const BASE_URL = getApiDomain();

  useEffect(() => {
    setLoggedInUserId(localStorage.getItem("userId"));
  }, []);

  const fetchContracts = useCallback(
    async () => {
      if (isLoadingRef.current) return;

      isLoadingRef.current = true;

      try {
        const query: ContractQuery = {};
        if (filters.lat !== null) query.lat = selectedLocation.lat;
        if (filters.lng !== null) query.lng = selectedLocation.lng;

        const filterParams: FilterParams = {};
        if (filters.radius !== null) filterParams.radius = filters.radius;
        if (filters.price !== null) filterParams.price = filters.price;
        if (filters.weight !== null) filterParams.weight = filters.weight;
        if (filters.volume !== null) filterParams.volume = filters.volume;
        if (filters.requiredPeople !== null) filterParams.requiredPeople = filters.requiredPeople;
        if (filters.fragile !== null) filterParams.fragile = filters.fragile;
        if (filters.coolingRequired !== null) filterParams.coolingRequired = filters.coolingRequired;
        if (filters.rideAlong !== null) filterParams.rideAlong = filters.rideAlong;
        if (filters.moveDateTime !== null) {
          filterParams.moveDate = filters.moveDateTime.format("YYYY-MM-DD");
        }

        const encodedFilters = encodeURIComponent(JSON.stringify(filterParams));

        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (userId) headers["UserId"] = userId;
        if (token) headers["Authorization"] = token;

        const response = await fetch(
          `${BASE_URL}/api/v1/contracts?lat=${selectedLocation.lat}&lng=${selectedLocation.lng}&filters=${encodedFilters}`,
          { headers }
        );

        const data = await response.json();

        if (Array.isArray(data.contracts)) {
          setAllContracts(data.contracts);
        } else {
          console.warn("Unexpected response format:", data);
          setAllContracts([]);
        }
      } catch (error) {
        console.error("Error fetching contracts:", error);
        setAllContracts([]);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [selectedLocation, filters, BASE_URL],
  );

  useEffect(() => {
    const filtered = allContracts.filter(contract =>
      contract.contractStatus !== "COMPLETED" && contract.contractStatus !== "CANCELED" && contract.contractStatus !== "DELETED"
    );
    setDisplayContracts(filtered);
  }, [allContracts]);

  const filtercontractsByBounds = useCallback(() => {
    if (!mapInstance) {
      console.error("mapInstance is null or undefined");
      return;
    }

    const contractsToFilter = allContracts.filter(contract =>
      contract.contractStatus !== "COMPLETED" && contract.contractStatus !== "CANCELED" && contract.contractStatus !== "DELETED"
    );

    if (!Array.isArray(contractsToFilter) || contractsToFilter.length === 0) {
      setDisplayContracts([]);
      return;
    }

    const bounds = mapInstance.getBounds();
    if (!bounds) {
      console.error("mapInstance.getBounds() returned null or undefined");
      return;
    }

    const newlyFiltered = contractsToFilter.filter(
      (contract: Contract) => {
        if (
          !contract.fromLocation ||
          typeof contract.fromLocation.latitude !== "number" ||
          typeof contract.fromLocation.longitude !== "number"
        ) {
          console.error("Invalid contract fromLocation or coordinates", contract);
          return false;
        }
        const contractLat = contract.fromLocation.latitude;
        const contractLng = contract.fromLocation.longitude;
        return bounds.contains(new google.maps.LatLng(contractLat, contractLng));
      },
    );
    setDisplayContracts(newlyFiltered);
  }, [allContracts, mapInstance]);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError("Google Maps API key is missing.");
    }
    fetchContracts();

    if (onCenterChanged) {
      onCenterChanged(center.lat, center.lng);
    }
  }, [fetchContracts, onCenterChanged]);

  useEffect(() => {
    fetchContracts();
  }, [filters, fetchContracts]);

  useEffect(() => {
    if (mapInstance && allContracts.length > 0) {
      filtercontractsByBounds();
    }
  }, [mapInstance, allContracts, filtercontractsByBounds]);

  const handleMapLoad = (map: google.maps.Map) => {
    if (!map || typeof map.getBounds !== "function") {
      console.error("Google Map failed to load properly.");
      setMapError("Map failed to initialize.");
      return;
    }
    setMapInstance(map);
    setMapError(null);
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

        if (mapInstance) {
          mapInstance.setCenter(new google.maps.LatLng(newLocation.lat, newLocation.lng));
        }
        if (onCenterChanged) {
          onCenterChanged(newLocation.lat, newLocation.lng);
        }
      } else {
        console.error("No location data available for this place.");
      }
    }
  };

  const handleMapDragEnd = () => {
    if (mapInstance) {
      const center = mapInstance.getCenter();
      if (center) {
        const newLat = center.lat();
        const newLng = center.lng();
        setSelectedLocation({ lat: newLat, lng: newLng });
        if (onCenterChanged) {
          onCenterChanged(newLat, newLng);
        }
      }
    }
  };

  const handleMapZoom = () => {
    if (mapInstance) {
      filtercontractsByBounds();
    }
  };

  if (mapError) {
    return <div style={{ color: "red" }}>{mapError}</div>;
  }
  if (!GOOGLE_MAPS_API_KEY) {
    return <div style={{ color: "red" }}>Missing API Key</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={selectedLocation}
      zoom={12}
      options={{
        fullscreenControl: false,
        streetViewControl: false,
        styles: mapStyles // Apply the custom map styles to simplify POIs
      }}
      onLoad={handleMapLoad}
      onDragEnd={handleMapDragEnd}
      onZoomChanged={handleMapZoom}
    >
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

      {displayContracts.map((contract: Contract) => {
        const isAcceptedByCurrentUser =
          contract.contractStatus === "ACCEPTED" &&
          contract.driverId?.toString() === loggedInUserId;

        const iconToUse = defaultIcon.anchor ? (isAcceptedByCurrentUser ? acceptedIcon : defaultIcon) : undefined;

        if (!iconToUse) return null;

        return (
          <Marker
            key={contract.contractId}
            position={{
              lat: contract.fromLocation.latitude,
              lng: contract.fromLocation.longitude,
            }}
            icon={iconToUse}
            onMouseOver={() => setOpenInfoWindowId(contract.contractId)}
            onMouseOut={() => setOpenInfoWindowId(null)}
            onClick={() => {
              window.location.href = `/dashboard/proposal/${contract.contractId}?type=VIEW`;
            }}
          >
            {openInfoWindowId === contract.contractId && (
              <InfoWindow
                position={{
                  lat: contract.fromLocation.latitude,
                  lng: contract.fromLocation.longitude,
                }}
                onCloseClick={() => setOpenInfoWindowId(null)}
              >
                <div className={styles.infoWindow}>
                  <h4>{contract.title || "Contract Details"}</h4>
                  {contract.price && <p>Price: ${contract.price.toFixed(2)}</p>}
                  {contract.moveDateTime && (
                    <p>Date: {new Date(contract.moveDateTime).toLocaleDateString()}</p>
                  )}
                  <div className={styles.infoWindowImages}>
                    {(contract.contractPhotos || []).slice(0, 3).map((photoPath, index) => (
                      <Image
                        key={index}
                        src={`${BASE_URL}/api/v1/files/download?filePath=${encodeURIComponent(photoPath)}`}
                        alt={`Contract photo ${index + 1}`}
                        className={styles.infoWindowImage}
                        width={50}
                        height={50}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                        style={{ objectFit: 'cover' }}
                      />
                    ))}
                  </div>
                </div>
              </InfoWindow>
            )}
          </Marker>
        );
      })}
    </GoogleMap>
  );
};

export default DriverMap;
