"use client";
import '@ant-design/v5-patch-for-react-19';
import React, { useCallback, useEffect, useState } from "react";

import DriverMap from "./components/DriverMap";

import {
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  InputNumber,
  Slider,
  Tooltip,
  Spin,
  Card,
  Typography,
  List,
} from "antd";

import {
  FilterOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  CheckOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import { getApiDomain } from "@/utils/domain";
import axios from "axios";
import Link from "next/link";

const BASE_URL = getApiDomain();

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
  fromLocation: { formattedAddress: string; latitude: number; longitude: number };
  toLocation: { formattedAddress: string; latitude: number; longitude: number };
  price: number;
}

interface Offer {
  offerId: number;
  offerStatus: "CREATED" | "ACCEPTED" | "REJECTED" | "DELETED";
  creationDateTime: string;
  contract: Contract;
}

const HomePage = () => {
  const [visible, setVisible] = useState(false);

  const [filters, setFilters] = useState({
    lat: 47.3769, // Default to Zurich coordinates

    lng: 8.5417,

    radius: undefined,

    price: undefined,

    weight: null,

    volume: null,

    requiredPeople: null,

    fragile: null,

    coolingRequired: null,

    rideAlong: null,

    moveDateTime: null as dayjs.Dayjs | null,
  });

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [contractsError, setContractsError] = useState<string | null>(null);

  const [pendingOffers, setPendingOffers] = useState<Offer[]>([]);
  const [pendingOffersLoading, setPendingOffersLoading] = useState(true);
  const [pendingOffersError, setPendingOffersError] = useState<string | null>(null);

  // Define a more specific type for the value based on possible filter types
  type FilterValue = typeof filters[keyof typeof filters] | dayjs.Dayjs | boolean | number | string | null | undefined;

  const updateFilter = (key: keyof typeof filters, value: FilterValue) => {
    setFilters((prev) => {
      // Add a check to prevent unnecessary updates if the value hasn't changed
      if (prev[key] === value) return prev;

      return { ...prev, [key]: value };
    });
  };

  const applyFilter = useCallback(async () => {
    const query: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (filters.lat !== null) query.lat = filters.lat;

    if (filters.lng !== null) query.lng = filters.lng;

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

    if (filters.rideAlong !== null) filterParams.rideAlong = filters.rideAlong;

    if (filters.moveDateTime !== null) {
      filterParams.moveDateTime = filters.moveDateTime.format(
        "YYYY-MM-DDTHH:mm:ss",
      );
    }

    setVisible(false);
  }, [filters]);

  const undoFilter = async () => {
    setFilters((prevFilters) => ({
      ...prevFilters,

      radius: undefined,

      price: undefined,

      weight: null,

      volume: null,

      requiredPeople: null,

      fragile: null,

      coolingRequired: null,

      rideAlong: null,

      moveDateTime: null,
    }));

    setVisible(false);
  };

  useEffect(() => {
    applyFilter();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const res = await axios.get(`${BASE_URL}/api/v1/users/${userId}/contracts`, {
          headers: {
            UserId: userId,
            Authorization: token,
          },
        });
        
        const fetchedContracts = res.data?.contracts || res.data;

        if (Array.isArray(fetchedContracts)) {
          const sorted = fetchedContracts.sort(
            (a: Contract, b: Contract) =>
              new Date(b.creationDateTime).getTime() -
              new Date(a.creationDateTime).getTime()
          );
          setContracts(sorted);
          setContractsError(null);
        } else {
          console.error("Unexpected contract data format:", res.data);
          setContractsError("Failed to load contracts due to unexpected format.");
          setContracts([]);
        }
      } catch (err: unknown) { // Use unknown for caught errors
        console.error("Error fetching driver contracts:", err);
        // Type assertion or check needed if accessing specific properties of err
        const errorMessage = err instanceof Error ? err.message : "Failed to load contracts.";
        // Define a type for the error structure if known, or use checks
        const responseMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setContractsError(responseMessage || errorMessage);
        setContracts([]);
      } finally {
        setContractsLoading(false);
      }
    };

    fetchDriverContracts();
  }, []);

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
        const res = await axios.get(`${BASE_URL}/api/v1/users/${userId}/offers`, {
          headers: {
            UserId: userId,
            Authorization: token,
          },
          params: {
            status: 'CREATED'
          }
        });

        const fetchedOffers = res.data?.offers || res.data;

        if (Array.isArray(fetchedOffers)) {
          const sorted = fetchedOffers.sort(
            (a: Offer, b: Offer) =>
              new Date(b.creationDateTime).getTime() -
              new Date(a.creationDateTime).getTime()
          );
          setPendingOffers(sorted);
          setPendingOffersError(null);
        } else {
          console.error("Unexpected pending offers data format:", res.data);
          setPendingOffersError("Failed to load pending offers due to unexpected format.");
          setPendingOffers([]);
        }
      } catch (err: unknown) {
        console.error("Error fetching pending driver offers:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load pending offers.";
        const responseMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setPendingOffersError(responseMessage || errorMessage);
        setPendingOffers([]);
      } finally {
        setPendingOffersLoading(false);
      }
    };

    fetchPendingOffers();
  }, []);

  const mapContainerStyle = {
    width: "100%",
    height: "100%",
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flexGrow: 1, position: "relative" }}>
        {/* Map Component */}
        <DriverMap
          containerStyle={mapContainerStyle}
          filters={filters}
          onCenterChanged={(lat, lng) => {
            updateFilter("lat", lat);
            updateFilter("lng", lng);
          }}
        />
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

            top: 20,

            right: 20,

            zIndex: 1000,

            width: "64px",

            height: "64px",

            fontSize: "20px",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            backgroundColor: "black",
          }}
          onClick={() =>
            setVisible(true)}
        />
      </Tooltip>

      <Drawer
        title="Edit Filters"
        placement="right"
        open={visible}
        maskClosable={false}
        keyboard={false}
        onClose={() => {
          applyFilter();

          setVisible(false);
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            style={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",
            }}
          >
            <label>Radius</label>

            <Slider
              min={0}
              max={100}
              value={filters.radius}
              onChange={(val) => updateFilter("radius", val)}
              style={{ flex: 1, marginLeft: "10px" }}
            />
          </div>

          <div
            style={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",
            }}
          >
            <label>Price</label>

            <Slider
              min={0}
              max={1000}
              value={filters.price}
              onChange={(val) => updateFilter("price", val)}
              style={{ flex: 1, marginLeft: "10px" }}
            />
          </div>

          <div
            style={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",
            }}
          >
            <label>Weight</label>

            <InputNumber
              min={0}
              value={filters.weight}
              onChange={(val) => updateFilter("weight", val)}
              style={{ flex: 1, marginLeft: "10px" }}
            />
          </div>

          <div
            style={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",
            }}
          >
            <label>Volume</label>

            <InputNumber
              min={0}
              value={filters.volume}
              onChange={(val) => updateFilter("volume", val)}
              style={{ flex: 1, marginLeft: "10px" }}
            />
          </div>

          <div
            style={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",
            }}
          >
            <label>Required People</label>

            <InputNumber
              min={0}
              value={filters.requiredPeople}
              onChange={(val) => updateFilter("requiredPeople", val)}
              style={{ flex: 1, marginLeft: "10px" }}
            />
          </div>

          <div
            style={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",
            }}
          >
            <Checkbox
              checked={!!filters.fragile}
              onChange={(e) => updateFilter("fragile", e.target.checked)}
            >
              Fragile
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
              Ride Along
            </Checkbox>
          </div>

          <div
            style={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",
            }}
          >
            <label>Date</label>

            <DatePicker
              onChange={(date) => updateFilter("moveDateTime", date)}
              style={{ flex: 1, marginLeft: "10px" }}
            />
          </div>

          <Button
            type="primary"
            onClick={applyFilter}
            style={{ marginTop: "20px" }}
          >
            Apply Filter
          </Button>

          <Button
            type="default"
            onClick={undoFilter}
            style={{ marginTop: "10px" }}
          >
            Undo Filter
          </Button>
        </div>
      </Drawer>

     
      {/* Section for Accepted Contracts using Ant Design List/Card */}
      <div style={{ padding: '10px 20px 20px 20px', flexShrink: 0, background: '#f0f2f5' }}>
        <Typography.Title level={3} style={{ marginBottom: '16px' }}>
          <CheckOutlined /> Your Accepted Moves
        </Typography.Title>
        {contractsLoading ? (
          <div style={{ textAlign: 'center' }}><Spin /></div>
        ) : contractsError ? (
          <Typography.Text type="danger">{contractsError}</Typography.Text>
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 }}
            dataSource={contracts.filter((c) => c.contractStatus === "ACCEPTED")}
            locale={{ emptyText: "No accepted moves yet." }}
            renderItem={(contract) => (
              <List.Item>
                <Link href={`/dashboard/proposal/${contract.contractId}?type=${contract.contractStatus}`}>
                  <Card 
                    hoverable 
                    title={contract.title}
                    size="small"
                  >
                    <p>
                      <CalendarOutlined />{" "}
                      {new Date(contract.moveDateTime).toLocaleString()}
                    </p>
                    <p style={{ whiteSpace: 'normal' }}>
                      <EnvironmentOutlined /> {contract.fromLocation?.formattedAddress || "No location"} ➝{" "}
                      {contract.toLocation?.formattedAddress || "No location"}
                    </p>
                  </Card>
                </Link>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;
