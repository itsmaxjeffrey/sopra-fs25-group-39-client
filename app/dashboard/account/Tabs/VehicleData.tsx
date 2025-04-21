"use client";
import React, { useState } from "react";
import { Button, Image, Input, Typography, Upload } from "antd";
import { FileImageOutlined, UploadOutlined } from "@ant-design/icons";
import styles from "../Account.module.css";
import { getApiDomain } from "@/utils/domain";

/* eslint-disable @typescript-eslint/no-explicit-any */

const { Title } = Typography;

const BASE_URL = getApiDomain();


const VehicleDataTab = ({
  editedData,
  userData,
  setEditedData,
  changed,
  setChanged,
}: any) => {
  const [licenseKey, setLicenseKey] = useState(0);
  const [insuranceKey, setInsuranceKey] = useState(0);

  const handleUpload = async (file: File, type: "license" | "insurance") => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) return false;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const response = await fetch(`${BASE_URL}/api/v1/files/upload`, {
        method: "POST",
        headers: {
          UserId: `${userId}`,
          Authorization: `${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      console.log(`${type} upload response:`, data);

      if (data.filePath) {
        if (type === "license") {
          setEditedData({
            ...editedData,
            driverLicensePath: data.filePath,
          });
          setLicenseKey((prev) => prev + 1);
        } else {
          setEditedData({
            ...editedData,
            driverInsurancePath: data.filePath,
          });
          setInsuranceKey((prev) => prev + 1);
        }

        setChanged(true);
      } else {
        throw new Error("File path missing in response");
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
    }

    return false; // Prevent default Upload behavior
  };

  const handleSave = () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) return;

    fetch(`${BASE_URL}/api/v1/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        UserId: `${userId}`,
        Authorization: `${token}`,
      },
      body: JSON.stringify(editedData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Vehicle data saved successfully:", data);
        setChanged(false);
      })
      .catch((error) => {
        console.error("Error saving vehicle data:", error);
      });
  };

  return (
    <div className={styles.tabContent}>
      <Title level={5}>Vehicle Information</Title>
      <div className={styles.formGrid}>
        {/* Vehicle input fields */}
        <div>
          <label>Vehicle Model</label>
          <Input
            value={editedData?.carDTO?.carModel}
            onChange={(e) => {
              setChanged(true);
              setEditedData({
                ...editedData,
                carDTO: {
                  ...editedData.carDTO,
                  carModel: e.target.value,
                },
              });
            }}
          />
        </div>
        <div>
          <label>License Plate</label>
          <Input
            value={editedData?.carDTO?.licensePlate}
            onChange={(e) => {
              setChanged(true);
              setEditedData({
                ...editedData,
                carDTO: {
                  ...editedData.carDTO,
                  licensePlate: e.target.value,
                },
              });
            }}
          />
        </div>
        <div>
          <label>Weight Capacity</label>
          <Input
            value={editedData?.carDTO?.weightCapacity}
            onChange={(e) => {
              setChanged(true);
              setEditedData({
                ...editedData,
                carDTO: {
                  ...editedData.carDTO,
                  weightCapacity: parseFloat(e.target.value) || 0,
                },
              });
            }}
          />
        </div>
        <div>
          <Input
            value={editedData?.carDTO?.volumeCapacity}
            onChange={(e) => {
              setChanged(true);
              setEditedData({
                ...editedData,
                carDTO: {
                  ...editedData.carDTO,
                  volumeCapacity: parseFloat(e.target.value) || 0,
                },
              });
            }}
          />
        </div>

        <div>
          <label>Preferred Range (km)</label>
          <Input
            type="number"
            value={editedData?.preferredRange}
            onChange={(e) => {
              setChanged(true);
              setEditedData({
                ...editedData,
                preferredRange: parseFloat(e.target.value) || 0,
              });
            }}
          />
        </div>
      </div>

      <div className={styles.uploadSection}>
        {/* Driver's License Upload */}
        <div className={styles.uploadItem}>
          <label>Driver&apos;s License</label>
          <div className={styles.uploadWrapper}>
            {editedData?.driverLicensePath
              ? (
                <Image
                  key={licenseKey}
                  width={160}
                  height={100}
                  src={`${BASE_URL}/api/v1/files/download?filePath=${editedData.driverLicensePath}`}
                  alt="Driver's License"
                  style={{ objectFit: "cover", borderRadius: 4 }}
                />
              )
              : (
                <div className={styles.uploadPlaceholder}>
                  <FileImageOutlined style={{ fontSize: 24, color: "#999" }} />
                </div>
              )}
            <Upload
              showUploadList={false}
              beforeUpload={(file) => handleUpload(file, "license")}
            >
              <Button icon={<UploadOutlined />}>
                {editedData?.driverLicensePath ? "Replace" : "Upload"}
              </Button>
            </Upload>
          </div>
        </div>

        {/* Insurance Proof Upload */}
        <div className={styles.uploadItem}>
          <label>Insurance Proof</label>
          <div className={styles.uploadWrapper}>
            {editedData?.driverInsurancePath
              ? (
                <Image
                  key={insuranceKey}
                  width={160}
                  height={100}
                  src={`${BASE_URL}/api/v1/files/download?filePath=${editedData.driverInsurancePath}`}
                  alt="Insurance Proof"
                  style={{ objectFit: "cover", borderRadius: 4 }}
                />
              )
              : (
                <div className={styles.uploadPlaceholder}>
                  <FileImageOutlined style={{ fontSize: 24, color: "#999" }} />
                </div>
              )}
            <Upload
              showUploadList={false}
              beforeUpload={(file) => handleUpload(file, "insurance")}
            >
              <Button icon={<UploadOutlined />}>
                {editedData?.driverInsurancePath ? "Replace" : "Upload"}
              </Button>
            </Upload>
          </div>
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
