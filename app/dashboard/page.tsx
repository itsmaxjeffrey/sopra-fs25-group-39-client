"use client";
import React, { useState } from "react";
import DriverMap from "./components/DriverMap";
import { useRouter } from "next/navigation";
import { Button, Drawer, Slider, InputNumber, Input, Checkbox, DatePicker, Tooltip } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface Location {
  latitude: number;
  longitude: number;
}

const HomePage = () => {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [filters, setFilters] = useState({
    lat: null,
    lng: null,
    radius: undefined,
    price: undefined,
    weight: null,
    height: null,
    length: null,
    width: null,
    requiredPeople: null,
    fragile: null,
    coolingRequired: null,
    rideAlong: null,
    fromAddress: null as Location | null,
    toAddress: null as Location | null,
    moveDateTime: null as dayjs.Dayjs | null,
  });

  const updateFilter = (key: keyof typeof filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilter = () => {
    const query: any = {};

    if (filters.lat !== null) query.lat = filters.lat;
    if (filters.lng !== null) query.lng = filters.lng;

    const filterParams: any = {};

    if (filters.radius !== null) filterParams.radius = filters.radius;
    if (filters.price !== null) filterParams.price = filters.price;
    if (filters.weight !== null) filterParams.weight = filters.weight;
    if (filters.height !== null) filterParams.height = filters.height;
    if (filters.length !== null) filterParams.length = filters.length;
    if (filters.width !== null) filterParams.width = filters.width;
    if (filters.requiredPeople !== null) filterParams.requiredPeople = filters.requiredPeople;
    if (filters.fragile !== null) filterParams.fragile = filters.fragile;
    if (filters.coolingRequired !== null) filterParams.coolingRequired = filters.coolingRequired;
    if (filters.rideAlong !== null) filterParams.rideAlong = filters.rideAlong;
    if (filters.fromAddress !== null) {
      filterParams.fromAddress = `${filters.fromAddress.latitude},${filters.fromAddress.longitude}`;
    }
    if (filters.toAddress !== null) {
      filterParams.toAddress = `${filters.toAddress.latitude},${filters.toAddress.longitude}`;
    }
    if (filters.moveDateTime !== null) {
      filterParams.moveDateTime = filters.moveDateTime.format('YYYY-MM-DDTHH:mm:ss');
    }

    if (Object.keys(filterParams).length > 0) {
      query.filters = JSON.stringify(filterParams);
    }

    router.push(`/api/v1/map/contracts?${new URLSearchParams(query).toString()}`);
    setVisible(false);
  };

  const mapContainerStyle = {
    width: "100%",
    height: "100%",
  };

  return (
    
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
    <div style={{ flexGrow: 1, position: "relative" }}> {/* Map Component */}
      <DriverMap containerStyle={mapContainerStyle} onCenterChanged={(lat, lng) => {
          updateFilter("lat", lat);
          updateFilter("lng", lng);
      }}/> 
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
          onClick={() => setVisible(true)}
        />
      </Tooltip>

      <Drawer title="Edit Filters" placement="right" onClose={() => setVisible(false)} open={visible}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>Radius</label>
            <Slider min={0} max={100} value={filters.radius} onChange={(val) => updateFilter("radius", val)} style={{ flex: 1, marginLeft: "10px" }} />
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
            <Checkbox checked={!!filters.fragile} onChange={(e) => updateFilter("fragile", e.target.checked)}>Fragile</Checkbox>
            <Checkbox checked={!!filters.coolingRequired} onChange={(e) => updateFilter("coolingRequired", e.target.checked)}>Cooling Required</Checkbox>
            <Checkbox checked={!!filters.rideAlong} onChange={(e) => updateFilter("rideAlong", e.target.checked)}>Ride Along</Checkbox>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>Start Position</label>
            <Input value={filters.fromAddress ? `${filters.fromAddress.latitude},${filters.fromAddress.longitude}` : ''} onChange={(e) => {
              const [lat, lng] = e.target.value.split(",");
              updateFilter("fromAddress", { latitude: parseFloat(lat), longitude: parseFloat(lng) });
            }} style={{ flex: 1, marginLeft: "10px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>End Position</label>
            <Input value={filters.toAddress ? `${filters.toAddress.latitude},${filters.toAddress.longitude}` : ''} onChange={(e) => {
              const [lat, lng] = e.target.value.split(",");
              updateFilter("toAddress", { latitude: parseFloat(lat), longitude: parseFloat(lng) });
            }} style={{ flex: 1, marginLeft: "10px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>Date</label>
            <DatePicker onChange={(date) => updateFilter("moveDateTime", date)} style={{ flex: 1, marginLeft: "10px" }} />
          </div>
          <Button type="primary" onClick={applyFilter} style={{ marginTop: "20px" }}>Apply Filter</Button>
        </div>
      </Drawer>
    </div>
  );
};

export default HomePage;