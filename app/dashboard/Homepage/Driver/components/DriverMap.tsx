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
  },
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

interface Location {
    latitude: number;
    longitude: number;
    // Add other location properties if needed, e.g., formattedAddress
}

interface Contract {
  contractId: string;
  title: string;
  fromLocation: Location; // Use the defined Location interface
  contractStatus:
    | "REQUESTED"
    | "OFFERED"
    | "ACCEPTED"
    | "COMPLETED"
    | "FINALIZED" // Added FINALIZED status
    | "CANCELED"
    | "DELETED";
  driverId?: number; // Changed from string to number based on usage
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
  height?: number; // Renamed from volume
  width?: number; // New field
  length?: number; // New field
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
  const baseIconStyle = useMemo(() => ({
    path: "M12 2C8.1 2 5 5.1 5 9.3c0 2.3.9 4.4 2.4 6.1.1.1 4.6 6.6 4.6 6.6s4.5-6.5 4.6-6.6c1.5-1.7 2.4-3.8 2.4-6.1C19 5.1 15.9 2 12 2zm0 10.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z",
    fillOpacity: 1.0,
    strokeColor: "#000000", // Black stroke
    strokeWeight: 1.2,
    rotation: 0,
    scale: 1.5,
    // Anchor point needs google.maps.Point, handle potential SSR issues
    anchor: typeof window !== 'undefined' && window.google ? new google.maps.Point(12, 22) : undefined,
  }), []);

  const defaultIcon = useMemo(() => ({
    ...baseIconStyle,
    fillColor: "#EA4335", // Google Red (Default/Requested/Offered)
  }), [baseIconStyle]);

  const acceptedIcon = useMemo(() => ({
    ...baseIconStyle,
    fillColor: "#34A853", // Google Green (Accepted by current user)
  }), [baseIconStyle]);

  // --- NEW ICON for Completed/Finalized ---
  const completedIcon = useMemo(() => ({
    ...baseIconStyle,
    fillColor: "#424242", // Dark Grey / Black (Completed/Finalized)
  }), [baseIconStyle]);
  // --- END NEW ICON ---

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
        // Use selectedLocation for fetching based on the current map center
        query.lat = selectedLocation.lat;
        query.lng = selectedLocation.lng;

        const filterParams: FilterParams = {};
        // Check for null AND undefined before adding to params
        if (filters.radius !== null && filters.radius !== undefined) filterParams.radius = filters.radius;
        if (filters.price !== null && filters.price !== undefined) filterParams.price = filters.price;
        if (filters.weight !== null && filters.weight !== undefined) filterParams.weight = filters.weight;
        if (filters.height !== null && filters.height !== undefined) filterParams.height = filters.height; // Renamed from volume
        if (filters.width !== null && filters.width !== undefined) filterParams.width = filters.width; // New field
        if (filters.length !== null && filters.length !== undefined) filterParams.length = filters.length; // New field
        if (filters.requiredPeople !== null && filters.requiredPeople !== undefined) filterParams.requiredPeople = filters.requiredPeople;
        if (filters.fragile !== null && filters.fragile !== undefined) filterParams.fragile = filters.fragile;
        if (filters.coolingRequired !== null && filters.coolingRequired !== undefined) filterParams.coolingRequired = filters.coolingRequired;
        if (filters.rideAlong !== null && filters.rideAlong !== undefined) filterParams.rideAlong = filters.rideAlong;
        if (filters.moveDateTime !== null) {
          // Ensure moveDateTime has the format method (like dayjs)
          if (typeof filters.moveDateTime?.format === 'function') {
            filterParams.moveDate = filters.moveDateTime.format("YYYY-MM-DD");
          } else if (filters.moveDateTime) { // Handle if it's already a string or Date object
             try {
               filterParams.moveDate = new Date(filters.moveDateTime).toISOString().split('T')[0];
             } catch (e) {
               console.warn("Could not format moveDateTime filter:", filters.moveDateTime, e);
             }
          }
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
          // Note: Filtering by bounds will happen in onIdle or handleMapZoom now
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
    [selectedLocation, filters, BASE_URL], // Keep dependencies
  );

  // Filter contracts based on status (remove CANCELED and DELETED)
  useEffect(() => {
    const filtered = allContracts.filter(contract =>
      contract.contractStatus !== "CANCELED" && contract.contractStatus !== "DELETED"
    );
    // We set the displayContracts here initially, but filtercontractsByBounds will refine it
    setDisplayContracts(filtered);
  }, [allContracts]);

  // Function to filter contracts based on map bounds
  const filtercontractsByBounds = useCallback(() => {
    if (!mapInstance) {
      return;
    }

    const bounds = mapInstance.getBounds();
    if (!bounds) {
      console.warn("mapInstance.getBounds() returned null or undefined during filtering.");
      return;
    }

    // Filter from the *status-filtered* list derived from allContracts
    const contractsToFilter = allContracts.filter(contract =>
        contract.contractStatus !== "CANCELED" && contract.contractStatus !== "DELETED"
    );

    if (!Array.isArray(contractsToFilter)) { // Check if it's an array
        setDisplayContracts([]);
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
        // Use try-catch for safety, although bounds.contains should be reliable here
        try {
            // Ensure google maps is loaded before trying to use LatLng
            if (typeof window !== 'undefined' && window.google && window.google.maps) {
                return bounds.contains(new google.maps.LatLng(contractLat, contractLng));
            }
            return false; // Cannot check bounds if google maps isn't ready
        } catch (e) {
            console.error("Error checking bounds containment:", e, contract);
            return false;
        }
      },
    );
    setDisplayContracts(newlyFiltered);
  }, [allContracts, mapInstance]); // Dependencies are correct

  // Initial setup effect
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError("Google Maps API key is missing.");
    }
    // Fetch contracts based on the initial center
    fetchContracts();

    if (onCenterChanged) {
      onCenterChanged(center.lat, center.lng);
    }
    // Intentionally disable exhaustive-deps for initial setup if fetchContracts/onCenterChanged are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Refetch contracts when filters change
  useEffect(() => {
    fetchContracts();
  }, [filters, fetchContracts]); // fetchContracts dependency is important here

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    if (!map || typeof map.getBounds !== "function") {
      console.error("Google Map failed to load properly.");
      setMapError("Map failed to initialize.");
      return;
    }
    setMapInstance(map);
    setMapError(null);
    // Don't call filtercontractsByBounds here, wait for onIdle
  }, []); // No dependencies needed if it only sets state

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place?.geometry?.location) {
        const newLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setSelectedLocation(newLocation); // This will trigger fetchContracts via useEffect

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
        // Update selectedLocation state, which will trigger fetchContracts
        setSelectedLocation({ lat: newLat, lng: newLng });
        if (onCenterChanged) {
          onCenterChanged(newLat, newLng);
        }
        // filtercontractsByBounds will be called by onIdle after dragging stops
      }
    }
  };

  // Renamed from handleMapZoom to handleZoomChanged for clarity
  const handleZoomChanged = () => {
    // filtercontractsByBounds will be called by onIdle after zoom stops
    // No immediate action needed here, rely on onIdle.
  };

  const handleMapIdle = useCallback(() => {
    if (mapInstance) {
        filtercontractsByBounds(); // Now it's safer to call this
    }
  }, [mapInstance, filtercontractsByBounds]); // Add dependencies

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchContracts();
    }, 5000); // Fetch every 5 seconds

    // Set up timeout to stop polling after 5 minutes
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId); // Stop polling
      console.log("Polling stopped after 5 minutes to save traffic.");
    }, 300000); // 5 minutes in milliseconds

    return () => {
      clearInterval(intervalId); // Clean up interval
      clearTimeout(timeoutId); // Clean up timeout
    };
  }, [fetchContracts]);

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
        styles: mapStyles
      }}
      onLoad={handleMapLoad}
      onDragEnd={handleMapDragEnd}
      onZoomChanged={handleZoomChanged} // Use the renamed handler
      onIdle={handleMapIdle} // Filter contracts when map movement stops
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
        // --- UPDATED ICON SELECTION LOGIC ---
        let iconToUse = defaultIcon; // Start with default (Red)

        const isAcceptedByCurrentUser =
          contract.contractStatus === "ACCEPTED" &&
          contract.driverId?.toString() === loggedInUserId;

        const isCompletedOrFinalized =
          contract.contractStatus === "COMPLETED" ||
          contract.contractStatus === "FINALIZED";

        if (isAcceptedByCurrentUser) {
          iconToUse = acceptedIcon; // Green for moves accepted by this driver
        } else if (isCompletedOrFinalized) {
          iconToUse = completedIcon; // Black/Grey for completed/finalized moves
        }
        // Otherwise, it remains defaultIcon (Red for REQUESTED/OFFERED or ACCEPTED by others)
        // --- END UPDATED LOGIC ---

        // Ensure anchor point is valid before creating icon object
        const anchorPoint = typeof window !== 'undefined' && window.google ? new google.maps.Point(12, 22) : undefined;
        if (!anchorPoint) return null; // Don't render marker if anchor can't be created (SSR safety)

        // Apply the anchor point to the selected icon style
        const finalIcon = { ...iconToUse, anchor: anchorPoint };

        // Basic validation for location data
        if (!contract.fromLocation || typeof contract.fromLocation.latitude !== 'number' || typeof contract.fromLocation.longitude !== 'number') {
            console.warn("Skipping contract due to invalid location:", contract.contractId, contract.fromLocation);
            return null; // Skip rendering this marker if location is invalid
        }

        return (
          <Marker
            key={contract.contractId}
            position={{
              lat: contract.fromLocation.latitude,
              lng: contract.fromLocation.longitude,
            }}
            icon={finalIcon} // Use the final icon object with the anchor
            onMouseOver={() => setOpenInfoWindowId(contract.contractId)}
            onMouseOut={() => setOpenInfoWindowId(null)}
            onClick={() => {
              // Determine the type based on status for the link
              let linkType = 'VIEW'; // Default to VIEW
              if (isAcceptedByCurrentUser) {
                  linkType = 'ACCEPTED';
              } else if (isCompletedOrFinalized) {
                  linkType = contract.contractStatus; // Use COMPLETED or FINALIZED
              } else if (contract.contractStatus === 'OFFERED') {
                  linkType = 'OFFERED'; // Could be offered to someone else
              } else if (contract.contractStatus === 'REQUESTED') {
                  // Change: Route REQUESTED contracts to VIEW for the driver
                  linkType = 'VIEW'; 
              }
              window.location.href = `/dashboard/proposal/${contract.contractId}?type=${linkType}`;
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
                   <p>Status: {contract.contractStatus}</p> {/* Added status display */}
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
