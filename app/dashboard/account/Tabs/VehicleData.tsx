"use client";
import React, { useState } from "react";
import { Button, Image, Input, Typography, Upload } from "antd";
import { FileImageOutlined, UploadOutlined } from "@ant-design/icons";
import styles from "../Account.module.css";
import axios from "axios";

/* eslint-disable @typescript-eslint/no-explicit-any */

const { Title } = Typography;

const BASE_URL = process.env.NODE_ENV === "production"
  ? "https://sopra-fs25-group-39-client.vercel.app"
  : "http://localhost:8080";

const extractFilename = (path: string) => path?.split("/")?.pop();

const VehicleDataTab = ({
  editedData,
  userData,
  setEditedData,
  changed,
  setChanged,
}: any) => {
  const [licenseKey, setLicenseKey] = useState(0);
  const [insuranceKey, setInsuranceKey] = useState(0);

  const handleSave = () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) return;

    console.log("Would send vehicle data:", editedData);
  };

  return (
    <div className={styles.tabContent}>
      <Title level={5}>Vehicle Information</Title>
      <div className={styles.formGrid}>
        <div>
          <label>Vehicle Model</label>
          <Input
            value={editedData?.car?.carModel}
            onChange={(e) => {
              setChanged(true);
              setEditedData({
                ...editedData,
                car: {
                  ...editedData.car,
                  carModel: e.target.value,
                },
              });
            }}
          />
        </div>
        <div>
          <label>License Plate</label>
          <Input
            value={editedData?.car?.licensePlate}
            onChange={(e) => {
              setChanged(true);
              setEditedData({
                ...editedData,
                car: {
                  ...editedData.car,
                  licensePlate: e.target.value,
                },
              });
            }}
          />
        </div>
        <div>
          <label>Weight Capacity</label>
          <Input
            value={editedData?.car?.supportedWeight}
            onChange={(e) => {
              setChanged(true);
              setEditedData({
                ...editedData,
                car: {
                  ...editedData.car,
                  supportedWeight: e.target.value,
                },
              });
            }}
          />
        </div>
        <div>
          <label>Volume Capacity</label>
          <Input
            value={editedData?.car?.space}
            onChange={(e) => {
              setChanged(true);
              setEditedData({
                ...editedData,
                car: {
                  ...editedData.car,
                  space: e.target.value,
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
                preferredRange: e.target.value,
              });
            }}
          />
        </div>
      </div>

      <div className={styles.uploadSection}>
        <div className={styles.uploadItem}>
          <label>Driver&apos;s License</label>
          <div className={styles.uploadWrapper}>
            {editedData?.driverLicensePath
              ? (
                <Image
                  key={licenseKey}
                  width={160}
                  height={100}
                  src={`${BASE_URL}${editedData.driverLicensePath}?key=${licenseKey}`}
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
              beforeUpload={async (file) => {
                const formData = new FormData();
                formData.append("file", file);
                await axios.put(
                  `${BASE_URL}/api/v1/files/update/license/${
                    extractFilename(editedData.driverLicensePath)
                  }`,
                  formData,
                );
                setLicenseKey((prev) => prev + 1);
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>
                {editedData?.driverLicensePath ? "Replace" : "Upload"}
              </Button>
            </Upload>
          </div>
        </div>

        <div className={styles.uploadItem}>
          <label>Insurance Proof</label>
          <div className={styles.uploadWrapper}>
            {editedData?.driverInsurancePath
              ? (
                <Image
                  key={insuranceKey}
                  width={160}
                  height={100}
                  src={`${BASE_URL}${editedData.driverInsurancePath}?key=${insuranceKey}`}
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
              beforeUpload={async (file) => {
                const formData = new FormData();
                formData.append("file", file);
                await axios.put(
                  `${BASE_URL}/api/v1/files/update/insurance/${
                    extractFilename(editedData.driverInsurancePath)
                  }`,
                  formData,
                );
                setInsuranceKey((prev) => prev + 1);
                return false;
              }}
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
