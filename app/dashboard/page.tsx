"use client";
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
} from "antd";
import { FilterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

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

  const updateFilter = (key: keyof typeof filters, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setFilters((prev) => {
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
    </div>
  );
};

export default HomePage;
