"use client";
import React, { useState } from "react";
import DriverMap from "./components/DriverMap";
import { useRouter } from "next/navigation";
import { Button, Drawer, Slider, InputNumber, Input, Checkbox, DatePicker, Tooltip } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const HomePage = () => {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [filters, setFilters] = useState({
    lat: null,
    lng: null,
    radius: 50,
    price: 100,
    weight: 0,
    height: 0,
    length: 0,
    width: 0,
    requiredPeople: 1,
    fragile: false,
    coolingRequired: false,
    rideAlong: false,
    startPosition: "",
    endPosition: "",
    date: null,
  });

  const updateFilter = (key: keyof typeof filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilter = () => {
    const query = {
      lat: filters.lat,
      lng: filters.lng,
      radius: filters.radius,
      filters: {
        price: filters.price,
        weight: filters.weight,
        dimensions: {
          height: filters.height,
          length: filters.length,
          width: filters.width,
        },
        requiredPeople: filters.requiredPeople,
        fragile: filters.fragile,
        coolingRequired: filters.coolingRequired,
        rideAlong: filters.rideAlong,
        startPosition: filters.startPosition,
        endPosition: filters.endPosition,
        date: filters.date ? dayjs(filters.date).format("YYYY-MM-DD") : null,
      },
    };
    router.push(`/api/v1/map/contracts?${new URLSearchParams(query as any).toString()}`);
    setVisible(false);
  };

  const mapContainerStyle = {
    width: "100%",
    height: "100%",
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
    <div style={{ flexGrow: 1, position: "relative" }}>
      <DriverMap containerStyle={mapContainerStyle} /> {/* Map Component */}
    </div>
    
    {/* Button to open filter settings drawer */}
    {/* Floating Action Button */}
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
          onClick={() => setVisible(true)}
        />
      </Tooltip>

      <Drawer title="Edit Filters" placement="right" onClose={() => setVisible(false)} open={visible}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>Radius</label>
            <Slider min={1} max={100} value={filters.radius} onChange={(val) => updateFilter("radius", val)} style={{ flex: 1, marginLeft: "10px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>Price</label>
            <Slider min={0} max={1000} value={filters.price} onChange={(val) => updateFilter("price", val)} style={{ flex: 1, marginLeft: "10px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>Weight</label>
            <InputNumber min={0} value={filters.weight} onChange={(val) => updateFilter("weight", val)} style={{ flex: 1, marginLeft: "10px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>Height</label>
            <InputNumber min={0} value={filters.height} onChange={(val) => updateFilter("height", val)} style={{ flex: 1, marginLeft: "10px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>Length</label>
            <InputNumber min={0} value={filters.length} onChange={(val) => updateFilter("length", val)} style={{ flex: 1, marginLeft: "10px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>Width</label>
            <InputNumber min={0} value={filters.width} onChange={(val) => updateFilter("width", val)} style={{ flex: 1, marginLeft: "10px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>Required People</label>
            <InputNumber min={0} value={filters.requiredPeople} onChange={(val) => updateFilter("requiredPeople", val)} style={{ flex: 1, marginLeft: "10px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Checkbox checked={filters.fragile} onChange={(e) => updateFilter("fragile", e.target.checked)}>Fragile</Checkbox>
            <Checkbox checked={filters.coolingRequired} onChange={(e) => updateFilter("coolingRequired", e.target.checked)}>Cooling Required</Checkbox>
            <Checkbox checked={filters.rideAlong} onChange={(e) => updateFilter("rideAlong", e.target.checked)}>Ride Along</Checkbox>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>Start Position</label>
            <Input value={filters.startPosition} onChange={(e) => updateFilter("startPosition", e.target.value)} style={{ flex: 1, marginLeft: "10px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>End Position</label>
            <Input value={filters.endPosition} onChange={(e) => updateFilter("endPosition", e.target.value)} style={{ flex: 1, marginLeft: "10px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>Date</label>
            <DatePicker onChange={(date) => updateFilter("date", date)} style={{ flex: 1, marginLeft: "10px" }} />
          </div>
          <Button type="primary" onClick={applyFilter} style={{ marginTop: "20px" }}>Apply Filter</Button>
        </div>
      </Drawer>
    </div>
  );
};

export default HomePage;