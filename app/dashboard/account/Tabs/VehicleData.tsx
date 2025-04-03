"use client";
import React from "react";
import { Input, Button, Typography, Upload, Image } from "antd";
import { UploadOutlined, FileImageOutlined } from "@ant-design/icons";
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

      <div className={styles.uploadSection}>
        <div className={styles.uploadItem}>
          <label>Driver's License</label>
          <div className={styles.uploadWrapper}>
            {editedData?.driversLicense ? (
              <Image
                width={160}
                height={100}
                src={editedData.driversLicense}
                style={{ objectFit: "cover", borderRadius: 4 }}
              />
            ) : (
              <div className={styles.uploadPlaceholder}>
                <FileImageOutlined style={{ fontSize: 24, color: "#999" }} />
              </div>
            )}
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                console.log("Upload driver's license:", file);
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>
                {editedData?.driversLicense ? "Replace" : "Upload"}
              </Button>
            </Upload>
          </div>
        </div>

        <div className={styles.uploadItem}>
          <label>Insurance Proof</label>
          <div className={styles.uploadWrapper}>
            {editedData?.insuranceProof ? (
              <Image
                width={160}
                height={100}
                src={editedData.insuranceProof}
                style={{ objectFit: "cover", borderRadius: 4 }}
              />
            ) : (
              <div className={styles.uploadPlaceholder}>
                <FileImageOutlined style={{ fontSize: 24, color: "#999" }} />
              </div>
            )}
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                console.log("Upload insurance proof:", file);
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>
                {editedData?.insuranceProof ? "Replace" : "Upload"}
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
