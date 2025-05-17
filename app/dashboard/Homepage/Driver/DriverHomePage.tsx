"use client";
import "@ant-design/v5-patch-for-react-19";
import React, { useCallback, useEffect, useState } from "react";

import DriverMap from "./components/DriverMap";

import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Drawer,
  InputNumber,
  List,
  Slider,
  Spin,
  Tooltip,
  Typography,
} from "antd";

import {
  CalendarOutlined,
  CheckOutlined,
  ClockCircleOutlined, // Import ClockCircleOutlined for pending offers
  EnvironmentOutlined,
  FilterOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import { getApiDomain } from "@/utils/domain";
import axios from "axios";
import Link from "next/link";

const BASE_URL = getApiDomain();

interface Location {
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

interface Contract {
  contractId: number;
  title: string;
  moveDateTime: string;
  creationDateTime: string;
  contractStatus:
    | "REQUESTED"
    | "OFFERED"
    | "ACCEPTED"
    | "COMPLETED"
    | "FINALIZED"
    | "CANCELED"
    | "DELETED";
  fromLocation: Location;
  toLocation: Location;
  price: number;
}

interface Offer {
  offerId: number;
  offerStatus: "CREATED" | "ACCEPTED" | "REJECTED" | "DELETED";
  creationDateTime: string;
  contract: Contract; // Embed the full contract details within the offer
}

const HomePage = () => {
  const [visible, setVisible] = useState(false);
  const [pendingOffers, setPendingOffers] = useState<Offer[]>([]); // State to hold pending offers
  const [pendingOffersError, setPendingOffersError] = useState<string | null>(
    null,
  );
  const [pendingOffersLoading, setPendingOffersLoading] = useState<boolean>(
    true,
  ); // Start loading true
  const [filters, setFilters] = useState({
    lat: 47.3769, // Default to Zurich coordinates
    lng: 8.5417,
    radius: undefined as number | undefined, // Explicitly type undefined
    price: undefined as number | undefined, // Explicitly type undefined
    weight: null as number | null,
    length: null as number | null, // New
    width: null as number | null, // New
    height: null as number | null, // New (replaces volume)
    requiredPeople: null as number | null,
    fragile: null as boolean | null,
    coolingRequired: null as boolean | null,
    rideAlong: null as boolean | null,
    moveDateTime: null as dayjs.Dayjs | null,
  });

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [contractsError, setContractsError] = useState<string | null>(null);

  // Define a more specific type for the value based on possible filter types
  type FilterValue =
    | typeof filters[keyof typeof filters]
    | dayjs.Dayjs
    | boolean
    | number
    | string
    | null
    | undefined;

  const updateFilter = (key: keyof typeof filters, value: FilterValue) => {
    setFilters((prev) => {
      // Add a check to prevent unnecessary updates if the value hasn't changed
      if (prev[key] === value) return prev;

      // Ensure specific types are handled correctly
      if (key === "moveDateTime" && value instanceof dayjs) {
        return { ...prev, [key]: value };
      } else if (
        typeof value === "number" &&
        (key === "radius" || key === "price" || key === "weight" ||
          key === "length" || key === "width" || key === "height" ||
          key === "requiredPeople")
      ) { // Added length, width, height
        return { ...prev, [key]: value };
      } else if (
        typeof value === "boolean" &&
        (key === "fragile" || key === "coolingRequired" || key === "rideAlong")
      ) {
        return { ...prev, [key]: value };
      } else if (
        value === null &&
        (key === "weight" || key === "length" || key === "width" ||
          key === "height" || key === "requiredPeople" || key === "fragile" ||
          key === "coolingRequired" || key === "rideAlong" ||
          key === "moveDateTime")
      ) { // Added length, width, height
        return { ...prev, [key]: value };
      } else if (value === undefined && (key === "radius" || key === "price")) {
        return { ...prev, [key]: value };
      } else if (key === "lat" || key === "lng") {
        return { ...prev, [key]: value as number }; // Assume lat/lng are numbers
      }
      // Fallback or handle other types if necessary
      return prev;
    });
  };

  const applyFilter = useCallback(async () => {
    // This function seems to only close the drawer now,
    // the actual filtering happens in the DriverMap component based on the filters state.
    // We can keep it simple or remove the async/query parts if not needed here.
    setVisible(false);
  }, []); // Removed filters dependency as it doesn't directly use it for fetching here

  const undoFilter = async () => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      radius: undefined,
      price: undefined,
      weight: null,
      length: null, // New
      width: null, // New
      height: null, // New (replaces volume)
      requiredPeople: null,
      fragile: null,
      coolingRequired: null,
      rideAlong: null,
      moveDateTime: null,
    }));
    setVisible(false);
  };

  // Fetch Accepted Contracts
  useEffect(() => {
    const fetchDriverContracts = async () => {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (!userId || !token) {
        setContractsError("Authentication details missing.");
        setContractsLoading(false);
        return;
      }

      setContractsLoading(true);
      try {
        // Fetch only ACCEPTED contracts for this section
        const res = await axios.get<unknown>(
          `${BASE_URL}/api/v1/users/${userId}/contracts`,
          { // Keep response data as unknown initially
            headers: {
              UserId: userId,
              Authorization: token,
            },
            params: {
              status: "ACCEPTED", // Filter for accepted contracts
            },
          },
        );

        let fetchedContracts: Contract[] = []; // Initialize with a default empty array

        // Check the structure of res.data before accessing properties
        if (
          typeof res.data === "object" && res.data !== null &&
          "contracts" in res.data && Array.isArray(res.data.contracts)
        ) {
          // If data has a 'contracts' property which is an array
          fetchedContracts = res.data.contracts as Contract[];
        } else if (Array.isArray(res.data)) {
          // If data itself is an array
          fetchedContracts = res.data as Contract[];
        } else {
          // Handle unexpected format
          console.error("Unexpected accepted contracts data format:", res.data);
          setContractsError(
            "Failed to load accepted contracts due to unexpected format.",
          );
          // fetchedContracts remains empty
        }

        // Filter out contracts with status "DELETED" or "CANCELED"
        const validContracts = fetchedContracts.filter(
          (contract) =>
            contract.contractStatus !== "DELETED" &&
            contract.contractStatus !== "CANCELED",
        );

        // Now fetchedContracts is guaranteed to be Contract[]
        const sorted = validContracts.sort(
          (a: Contract, b: Contract) =>
            new Date(b.creationDateTime).getTime() -
            new Date(a.creationDateTime).getTime(),
        );
        setContracts(sorted);
        setContractsError(null); // Clear error if data was processed successfully
      } catch (err: unknown) {
        console.error("Error fetching accepted driver contracts:", err);
        const errorMessage = err instanceof Error
          ? err.message
          : "Failed to load accepted contracts.";
        const responseMessage =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message;
        setContractsError(responseMessage || errorMessage);
        setContracts([]);
      } finally {
        setContractsLoading(false);
      }
    };

    fetchDriverContracts();
  }, []); // Runs once on mount

  // Fetch Pending Offers
  useEffect(() => {
    const fetchPendingOffers = async () => {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (!userId || !token) {
        setPendingOffersError("Authentication details missing.");
        setPendingOffersLoading(false);
        return;
      }

      setPendingOffersLoading(true);
      try {
        // Fetch offers with status CREATED
        const res = await axios.get<{ offers: Offer[] }>(
          `${BASE_URL}/api/v1/users/${userId}/offers`,
          {
            headers: {
              UserId: userId,
              Authorization: token,
            },
            params: {
              status: "CREATED", // Filter for pending offers
            },
          },
        );

        // Ensure the response has the 'offers' array
        const fetchedOffers = res.data?.offers;

        if (Array.isArray(fetchedOffers)) {
          // Sort offers by creation date, newest first
          const sorted = fetchedOffers.sort(
            (a: Offer, b: Offer) =>
              new Date(b.creationDateTime).getTime() -
              new Date(a.creationDateTime).getTime(),
          );
          // Filter out offers without valid contract details if necessary
          const validOffers = sorted.filter((offer) =>
            offer.contract && offer.contract.contractId &&
            offer.contract.contractStatus !== "CANCELED" &&
            offer.contract.contractStatus !== "DELETED"
          );
          setPendingOffers(validOffers);
          setPendingOffersError(null);
        } else {
          console.error("Unexpected pending offers data format:", res.data);
          setPendingOffersError(
            "Failed to load pending offers due to unexpected format.",
          );
          setPendingOffers([]);
        }
      } catch (err: unknown) {
        console.error("Error fetching pending driver offers:", err);
        const errorMessage = err instanceof Error
          ? err.message
          : "Failed to load pending offers.";
        const responseMessage =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message;
        setPendingOffersError(responseMessage || errorMessage);
        setPendingOffers([]);
      } finally {
        setPendingOffersLoading(false);
      }
    };

    fetchPendingOffers();
  }, []); // Runs once on mount

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          flexGrow: 1,
          position: "relative", // Keep for potential children like the filter button
          padding: "10px 20px", // Retain padding for this section
          display: "flex", // Added: Make this a flex container
          flexDirection: "column", // Added: Arrange title and map vertically
        }}
      >
        {/* Title for the map */}
        <Typography.Title level={3} style={{ textAlign: "left", marginBottom: "10px" }}> {/* Changed: Align left */}
          Find Available Contracts Near You
        </Typography.Title>
        {/* New wrapper for Map Component to handle flex sizing */}
        <div style={{ flexGrow: 1, position: "relative", width: "100%" }}> {/* Added: Map wrapper takes remaining space */}
          <DriverMap
            containerStyle={{ width: "100%", height: "100%" }} // Ensure map fills its new wrapper
            filters={filters}
            onCenterChanged={(lat, lng) => {
              updateFilter("lat", lat);
              updateFilter("lng", lng);
            }}
          />
        </div>
      </div>

      {/* Button to open filter settings drawer (Floating Action Button) */}
      <Tooltip title="Filter Results">
        <Button
          type="primary"
          shape="circle"
          icon={<FilterOutlined style={{ fontSize: "28px", color: "white" }} />}
          size="large"
          style={{
            position: "fixed",
            top: 80, // Adjusted position slightly lower
            right: 20,
            zIndex: 1000, // Ensure it's above map controls
            width: "64px",
            height: "64px",
            fontSize: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "black", // Consider theme color
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          onClick={() =>
            setVisible(true)}
        />
      </Tooltip>

      <Drawer
        title="Edit Filters"
        placement="right"
        open={visible}
        maskClosable={true} // Allow closing by clicking outside
        keyboard={true} // Allow closing with Esc key
        onClose={() => setVisible(false)} // Close drawer without applying filters implicitly
        width={350} // Adjust width as needed
        footer={
          // Add footer for explicit actions


            <div style={{ textAlign: "right" }}>
              <Button onClick={undoFilter} style={{ marginRight: 8 }}>
                Reset Filters
              </Button>
              <Button type="primary" onClick={applyFilter}>
                Apply & Close
              </Button>
            </div>

        }
      >
        {/* Filter controls - Consider using Form component for better structure */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label>Radius (km)</label>
            <Slider
              min={0}
              max={100} // Adjust max radius as needed
              value={filters.radius}
              onChange={(val) => updateFilter("radius", val)}
              tooltip={{ formatter: (value) => `${value} km` }}
            />
            <InputNumber // Optional: Allow direct number input
              min={0}
              max={100}
              style={{ width: "100%" }}
              value={filters.radius}
              onChange={(val) => updateFilter("radius", val as number)}
            />
          </div>
          <div>
            <label>Min Price ($)</label>
            <Slider
              min={0}
              max={2000} // Adjust max price
              step={50}
              value={filters.price}
              onChange={(val) => updateFilter("price", val)}
              tooltip={{ formatter: (value) => `$${value}` }}
            />
            <InputNumber
              min={0}
              max={2000}
              step={50}
              style={{ width: "100%" }}
              value={filters.price}
              onChange={(val) => updateFilter("price", val as number)}
              formatter={(value) =>
                `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => {
                if (!value) return 0;
                const num = Number(value.replace(/\$\s?|(,*)/g, ""));
                return isNaN(num) ? 0 : num;
              }}
            />
          </div>
          <div>
            <label>Weight (kg)</label>
            <InputNumber
              min={0}
              value={filters.weight}
              onChange={(val) => updateFilter("weight", val)}
              style={{ width: "100%" }}
              addonAfter="kg"
            />
          </div>
          <div>
            <label>Max Length (m)</label> {/* New */}
            <InputNumber
              min={0}
              value={filters.length}
              onChange={(val) => updateFilter("length", val)}
              style={{ width: "100%" }}
              addonAfter="m"
            />
          </div>
          <div>
            <label>Max Width (m)</label> {/* New */}
            <InputNumber
              min={0}
              value={filters.width}
              onChange={(val) => updateFilter("width", val)}
              style={{ width: "100%" }}
              addonAfter="m"
            />
          </div>
          <div>
            <label>Max Height (m)</label> {/* New (replaces Volume) */}
            <InputNumber
              min={0}
              value={filters.height}
              onChange={(val) => updateFilter("height", val)}
              style={{ width: "100%" }}
              addonAfter="m"
            />
          </div>
          <div>
            <label>Required People</label>
            <InputNumber
              min={1} // Usually at least 1 person needed
              step={1}
              value={filters.requiredPeople}
              onChange={(val) => updateFilter("requiredPeople", val)}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label>Date</label>
            <DatePicker
              value={filters.moveDateTime}
              onChange={(date) => updateFilter("moveDateTime", date)}
              style={{ width: "100%" }}
              showTime // Allow selecting time as well if needed
              format="YYYY-MM-DD HH:mm" // Adjust format
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "10px",
            }}
          >
            <Checkbox
              checked={!!filters.fragile}
              onChange={(e) => updateFilter("fragile", e.target.checked)}
            >
              Fragile Items
            </Checkbox>
            <Checkbox
              checked={!!filters.coolingRequired}
              onChange={(e) =>
                updateFilter("coolingRequired", e.target.checked)}
            >
              Cooling Required
            </Checkbox>
            <Checkbox
              checked={!!filters.rideAlong}
              onChange={(e) => updateFilter("rideAlong", e.target.checked)}
            >
              Ride Along Requested
            </Checkbox>
          </div>
        </div>
      </Drawer>

      {/* Container for the lists below the map */}
      <div
        style={{
          height: "200px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          background: "#f0f2f5",
          padding: "10px 20px",
        }}
      >
        {/* Section for Pending Offers */}
        <div style={{ marginBottom: "20px" }}>
          <Typography.Title level={4} style={{ marginBottom: "10px" }}>
            <ClockCircleOutlined /> Your Pending Offers
          </Typography.Title>
          {pendingOffersLoading
            ? (
              <div style={{ textAlign: "center" }}>
                <Spin />
              </div>
            )
            : pendingOffersError
            ? (
              <Typography.Text type="danger">
                {pendingOffersError}
              </Typography.Text>
            )
            : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 }}
                dataSource={pendingOffers}
                locale={{ emptyText: "You have no pending offers." }}
                renderItem={(offer) => (
                  <List.Item>
                    {/* Link to the contract details page */}
                    <Link
                      href={`/dashboard/proposal/${offer.contract.contractId}?type=OFFERED`}
                    >
                      <Card
                        hoverable
                        title={offer.contract.title}
                        size="small"
                      >
                        <p>
                          <CalendarOutlined />{" "}
                          {new Date(offer.contract.moveDateTime)
                            .toLocaleString()}
                        </p>
                        <p style={{ whiteSpace: "normal" }}>
                          <EnvironmentOutlined />{" "}
                          {offer.contract.fromLocation?.formattedAddress ||
                            "N/A"} ➝{" "}
                          {offer.contract.toLocation?.formattedAddress || "N/A"}
                        </p>
                      </Card>
                    </Link>
                  </List.Item>
                )}
              />
            )}
        </div>

        {/* Section for Accepted Contracts */}
        <div>
          <Typography.Title level={4} style={{ marginBottom: "10px" }}>
            <CheckOutlined /> Your Accepted Moves
          </Typography.Title>
          {contractsLoading
            ? (
              <div style={{ textAlign: "center" }}>
                <Spin />
              </div>
            )
            : contractsError
            ? <Typography.Text type="danger">{contractsError}</Typography.Text>
            : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 }}
                dataSource={contracts} // Already filtered for ACCEPTED during fetch
                locale={{ emptyText: "No accepted moves yet." }}
                renderItem={(contract) => (
                  <List.Item>
                    <Link
                      href={`/dashboard/proposal/${contract.contractId}?type=${contract.contractStatus}`}
                    >
                      <Card
                        hoverable
                        title={contract.title}
                        size="small"
                      >
                        <p>
                          <CalendarOutlined />{" "}
                          {new Date(contract.moveDateTime).toLocaleString()}
                        </p>
                        <p style={{ whiteSpace: "normal" }}>
                          <EnvironmentOutlined />{" "}
                          {contract.fromLocation?.formattedAddress || "N/A"} ➝
                          {" "}
                          {contract.toLocation?.formattedAddress || "N/A"}
                        </p>
                      </Card>
                    </Link>
                  </List.Item>
                )}
              />
            )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
