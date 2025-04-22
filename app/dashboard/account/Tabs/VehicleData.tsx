"use client";
import '@ant-design/v5-patch-for-react-19';
import React, { useState } from "react"; // Ensure useState is imported
import { Button, Image, Input, Typography, Upload, message } from "antd"; // Ensure message is imported
import { FileImageOutlined, UploadOutlined } from "@ant-design/icons";
import styles from "../Account.module.css";
import { getApiDomain } from "@/utils/domain";
import { useApi } from "@/hooks/useApi"; // Import useApi

/* eslint-disable @typescript-eslint/no-explicit-any */

const { Title, Text } = Typography;

const BASE_URL = getApiDomain();

// Define props interface for clarity
interface VehicleDataProps {
  editedData: any; // Use a more specific type if available
  userData: any;   // Use a more specific type if available
  setEditedData: React.Dispatch<React.SetStateAction<any>>;
  changed: boolean;
  setChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

const VehicleData: React.FC<VehicleDataProps> = ({
  editedData, // Destructure props correctly
  userData,
  setEditedData,
  changed,
  setChanged,
}) => {
  const apiService = useApi(); // Initialize useApi
  const [licenseKey, setLicenseKey] = useState(0);
  const [insuranceKey, setInsuranceKey] = useState(0);

  const handleUpload = async (file: File, type: "license" | "insurance") => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      message.error("Authentication details missing. Cannot upload file.");
      return false;
    }

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
        let errorMsg = `Failed to upload ${type} file.`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) { /* Ignore */ }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log(`${type} upload response:`, data);

      if (data.filePath) {
        if (type === "license") {
          setEditedData((prevData) => ({
            ...prevData,
            driverLicensePath: data.filePath,
          }));
          setLicenseKey((prev) => prev + 1);
        } else {
          setEditedData((prevData) => ({
            ...prevData,
            driverInsurancePath: data.filePath,
          }));
          setInsuranceKey((prev) => prev + 1);
        }
        setChanged(true);
        message.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);
      } else {
        throw new Error("File path missing in response");
      }
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      message.error(error.message || `Error uploading ${type}.`);
    }

    return false; // Prevent default Upload behavior
  };

  const handleSave = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      message.error("User ID not found. Cannot save.");
      return;
    }

    // Ensure data being sent uses 'car' not 'carDTO' and is the final structure
    const dataToSend = { ...editedData };
    if (dataToSend.carDTO) {
        if (!dataToSend.car) { // If car doesn't exist, copy from carDTO
            dataToSend.car = { ...dataToSend.carDTO };
        }
        delete dataToSend.carDTO; // Always remove carDTO before sending
    }

    console.log("Data being sent to backend:", JSON.stringify(dataToSend, null, 2));

    try {
      // Send the dataToSend, which is guaranteed to have 'car' if vehicle data exists
      const response = await apiService.put(`/api/v1/users/${userId}`, dataToSend) as { data: any }; // Keep response for logging/potential future use

      console.log("Server response after save:", response.data); // Log server response
      setChanged(false);
      message.success("Vehicle data saved successfully!");

      // *** FIX: Update the state with the data that was sent, ensuring UI consistency ***
      setEditedData(dataToSend); // Use the successfully sent data to update the UI state immediately

    } catch (error: any) {
      console.error("Error saving vehicle data:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error saving vehicle data.";
      message.error(errorMessage);
    }
  };

  // Determine initial values, preferring 'car' but falling back to 'carDTO'
  const initialCarData = editedData?.car ?? editedData?.carDTO;

  return (
    <div className={styles.tabContent}>
      <Title level={5}>Vehicle Information</Title>
      <div className={styles.formGrid}>
        {/* Vehicle input fields */}
        <div>
          <label>Vehicle Model</label>
          <Input
            value={initialCarData?.carModel ?? ""} // Read from normalized initial data
            onChange={(e) => {
              setChanged(true);
              setEditedData((prevData) => ({ // Use functional update
                ...prevData,
                car: {
                  ...(prevData.car || prevData.carDTO || {}), // Initialize car from car or carDTO
                  carModel: e.target.value,
                },
                carDTO: undefined, // Ensure carDTO is removed on edit
              }));
            }}
          />
        </div>
        <div>
          <label>License Plate</label>
          <Input
            value={initialCarData?.licensePlate ?? ""} // Read from normalized initial data
            onChange={(e) => {
              setChanged(true);
              setEditedData((prevData) => ({ // Use functional update
                ...prevData,
                car: {
                  ...(prevData.car || prevData.carDTO || {}), // Initialize car from car or carDTO
                  licensePlate: e.target.value,
                },
                carDTO: undefined, // Ensure carDTO is removed on edit
              }));
            }}
          />
        </div>
        <div>
          <label>Weight Capacity</label>
          <Input
            type="number" // Ensure type is number for parsing
            value={initialCarData?.weightCapacity ?? 0} // Read from normalized initial data, provide default
            onChange={(e) => {
              setChanged(true);
              setEditedData((prevData) => ({ // Use functional update
                ...prevData,
                car: {
                  ...(prevData.car || prevData.carDTO || {}), // Initialize car from car or carDTO
                  weightCapacity: parseFloat(e.target.value) || 0,
                },
                carDTO: undefined, // Ensure carDTO is removed on edit
              }));
            }}
          />
        </div>
        <div>
          <label>Volume Capacity</label> {/* Added label for clarity */}
          <Input
            type="number" // Ensure type is number for parsing
            value={initialCarData?.volumeCapacity ?? 0} // Read from normalized initial data, provide default
            onChange={(e) => {
              setChanged(true);
              setEditedData((prevData) => ({ // Use functional update
                ...prevData,
                car: {
                  ...(prevData.car || prevData.carDTO || {}), // Initialize car from car or carDTO
                  volumeCapacity: parseFloat(e.target.value) || 0,
                },
                carDTO: undefined, // Ensure carDTO is removed on edit
              }));
            }}
          />
        </div>

        <div>
          <label>Preferred Range (km)</label>
          <Input
            type="number"
            value={editedData?.preferredRange ?? 0} // Provide default value
            onChange={(e) => {
              setChanged(true);
              setEditedData((prevData) => ({ // Use functional update
                ...prevData,
                preferredRange: parseFloat(e.target.value) || 0,
                // Preserve carDTO removal logic if car exists from previous edits
                carDTO: prevData.car ? undefined : prevData.carDTO,
              }));
            }}
          />
        </div>
      </div>

      {/* ...existing code for uploads... */}
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
                  <Text type="secondary" style={{ marginTop: 8 }}>No License Uploaded</Text>
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
                  <Text type="secondary" style={{ marginTop: 8 }}>No Insurance Uploaded</Text>
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
              // Reset should also handle potential carDTO in original userData
              const resetData = { ...userData };
              if (resetData.carDTO) {
                  resetData.car = resetData.carDTO; // Normalize to 'car'
                  delete resetData.carDTO;
              }
              setEditedData(resetData); // Set the normalized data
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

export default VehicleData;