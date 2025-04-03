"use client";
import React from "react";
import { Input, Button, Typography } from "antd";
import styles from "../Account.module.css";

const { Title } = Typography;

const VehicleDataTab = ({
  editedData,
  userData,
  setEditedData,
  changed,
  setChanged,
}: any) => {
  const handleSave = () => {
    const token = localStorage.getItem("token");
    const id = localStorage.getItem("id");

    if (!token || !id) return;

    console.log("Would send vehicle data:", editedData);
  };

  return (
    <div className={styles.tabContent}>
      <Title level={5}>Vehicle Information</Title>
      <div className={styles.formGrid}>
        <div>
          <label>Vehicle Model</label>
          <Input
            value={editedData?.vehicleModel}
            onChange={(e) => {
              setChanged(true);
              setEditedData({
                ...editedData,
                vehicleModel: e.target.value,
              });
            }}
          />
        </div>
        <div>
          <label>License Plate</label>
          <Input
            value={editedData?.licensePlate}
            onChange={(e) => {
              setChanged(true);
              setEditedData({
                ...editedData,
                licensePlate: e.target.value,
              });
            }}
          />
        </div>
        <div>
          <label>Weight Capacity</label>
          <Input
            value={editedData?.weightCapacity}
            onChange={(e) => {
              setChanged(true);
              setEditedData({
                ...editedData,
                weightCapacity: e.target.value,
              });
            }}
          />
        </div>
        <div>
          <label>Volume Capacity</label>
          <Input
            value={editedData?.volumeCapacity}
            onChange={(e) => {
              setChanged(true);
              setEditedData({
                ...editedData,
                volumeCapacity: e.target.value,
              });
            }}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="primary" disabled={!changed} onClick={handleSave}>
          Save Changes
        </Button>
        {changed && (
          <Button
            onClick={() => {
              setEditedData(userData);
              setChanged(false);
            }}
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};

export default VehicleDataTab;
