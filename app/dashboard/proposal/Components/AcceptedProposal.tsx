"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button, Col, DatePicker, Form, Image, Input, Modal, Row } from "antd";
import { CameraOutlined, CloseCircleOutlined } from "@ant-design/icons";
import styles from "./Edit.module.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import dayjs from "dayjs";
import { Autocomplete } from "@react-google-maps/api";
import OfferCard from "./OfferCard";
import Title from "antd/es/typography/Title";
import { getApiDomain } from "@/utils/domain";
import useLocalStorage from "@/hooks/useLocalStorage"; // Import default export

/* eslint-disable @typescript-eslint/no-explicit-any */

// Define an interface for the driver data
interface DriverInfo {
  userId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  // Add other relevant driver fields if available, e.g., averageRating
}

// Add requester info to ContractData
interface ContractData {
  contractId: number;
  title: string;
  contractDescription: string;
  moveDateTime: string;
  fromLocation?: {
    formattedAddress: string;
    latitude: number;
    longitude: number;
  };
  toLocation?: {
    formattedAddress: string;
    latitude: number;
    longitude: number;
  };
  length: number;
  width: number;
  height: number;
  weight: number;
  fragile: boolean;
  coolingRequired: boolean;
  rideAlong: boolean;
  manPower: number;
  price: number;
  contractPhotos?: string[];
  requesterId: number; // Changed from requester: { userId: number; }
  driverId?: number; // Changed from driver?: { userId: number; } - assuming API returns driverId directly
  requesterPhoneNumber?: string; // Added
  driverPhoneNumber?: string; // Added
  // Add other fields from your actual contract data structure
}

interface Props {
  proposalId: string;
}

const AcceptedProposal = ({ proposalId }: Props) => {
  const router = useRouter();
  const [form] = Form.useForm();
  // fetchContractError: Stores the error message if fetching contract details fails.
  const [fetchContractError, setFetchContractError] = useState<string | null>(
    null,
  );
  // modalVisible state is removed. Modal visibility is now controlled by fetchContractError.
  const fromRef = useRef<any>(null);
  const toRef = useRef<any>(null);
  const [fromCoords, setFromCoords] = useState({ address: "", lat: 0, lng: 0 });
  const [toCoords, setToCoords] = useState({ address: "", lat: 0, lng: 0 });
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [loadingDriver, setLoadingDriver] = useState(true);
  const [errorDriver, setErrorDriver] = useState(false);
  const [contractData, setContractData] = useState<ContractData | null>(null); // State for full contract data
  const { value: loggedInUserId } = useLocalStorage("userId", null); // Get logged-in user ID value
  const BASE_URL = getApiDomain();

  const fetchContract = async () => {
    setFetchContractError(null); // Reset any previous error message
    try {
      const token = localStorage.getItem("token") || "";
      const userId = localStorage.getItem("userId") || "";

      if (!token || !userId) {
        setFetchContractError("Authentication details missing."); // Set error message
        console.error("Authentication details missing.");
        return;
      }

      const res = await axios.get<{ contract: ContractData }>(
        `${BASE_URL}/api/v1/contracts/${proposalId}`,
        {
          headers: {
            Authorization: token,
            UserId: userId,
          },
        },
      );
      const data = res.data.contract;
      if (!data || !data.contractId) {
        throw new Error("Invalid contract data");
      }
      // console.log("fetchContract: Contract data found:", data);
      setContractData(data); // Store the full contract data

      form.setFieldsValue({
        title: data.title,
        description: data.contractDescription,
        moveDate: dayjs(data.moveDateTime),
        from: data.fromLocation?.formattedAddress,
        to: data.toLocation?.formattedAddress,
        length: data.length,
        width: data.width,
        height: data.height,
        weight: Number(data.weight),
        fragile: data.fragile,
        cooling: data.coolingRequired,
        rideAlong: data.rideAlong,
        manPower: data.manPower,
        price: data.price,
      });
      setFromCoords({
        address: data.fromLocation?.formattedAddress || "",
        lat: data.fromLocation?.latitude || 0,
        lng: data.fromLocation?.longitude || 0,
      });
      setToCoords({
        address: data.toLocation?.formattedAddress || "",
        lat: data.toLocation?.latitude || 0,
        lng: data.toLocation?.longitude || 0,
      });
      // Use contractPhotos array instead of individual imagePath fields
      setImagePaths(data.contractPhotos || []);
      // setError(false) and setModalVisible(false) are removed.
    } catch (err: any) {
      console.error("Error fetching contract details:", err);
      setFetchContractError(
        err.message ||
          "Something went wrong while fetching the proposal details.",
      ); // Set error message
    }
  };

  const fetchDriverInfo = async () => {
    // console.log("fetchDriverInfo called");
    setLoadingDriver(true);
    setErrorDriver(false);
    try {
      const token = localStorage.getItem("token") || "";
      const userId = localStorage.getItem("userId") || "";

      if (!token || !userId) {
        throw new Error("Authentication details missing.");
      }

      const res = await axios.get<{ driver: DriverInfo }>(
        `${BASE_URL}/api/v1/contracts/${proposalId}/driver`,
        {
          headers: {
            Authorization: token,
            UserId: userId,
          },
        },
      );
      if (res.data && res.data.driver) {
        // console.log("fetchDriverInfo: Driver data found:", res.data.driver);
        setDriverInfo(res.data.driver);
      } else {
        throw new Error("Driver data not found in response");
      }
    } catch (err) {
      console.error("Error fetching driver info:", err);
      setErrorDriver(true);
    } finally {
      setLoadingDriver(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchContract();
      // console.log("After fetchContract, error state:", fetchContractError);
      if (!fetchContractError) { // Check if fetchContractError is null before fetching driver info
        // console.log("Calling fetchDriverInfo");
        await fetchDriverInfo();
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]); // Removed fetchContractError from dependency array as it's handled internally

  // No page-level loading spinner is rendered here.
  // The page structure will be visible while isLoadingContract is true.

  return (
    <div className={styles.wrapper}>
      {/* Bild Upload */}
      <div className={styles.imageUpload}>
        <div className={styles.imageRow}>
          {[0, 1, 2].map((idx) => (
            <div key={idx} className={styles.imageBox}>
              {imagePaths[idx]
                ? (
                  <Image
                    src={`${BASE_URL}/api/v1/files/download?filePath=${
                      imagePaths[idx]
                    }`}
                    alt={`upload-${idx}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )
                : (
                  <div className={styles.cameraIcon}>
                    <CameraOutlined style={{ fontSize: 28, color: "#999" }} />
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>

      {/* Formular */}
      <Form layout="vertical" className={styles.form} form={form}>
        <Form.Item label="Title" name="title">
          <Input placeholder="Give your proposal a fitting name" disabled />
        </Form.Item>

        <Form.Item name="description">
          <Input.TextArea
            rows={3}
            placeholder="Describe what you want to move"
            disabled
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Moving Date" name="moveDate">
              <DatePicker
                style={{ width: "100%" }}
                showTime={{ format: "HH:mm", showSecond: false }}
                disabledDate={(current) =>
                  current && current < dayjs().startOf("minute")}
                disabled
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="From" name="from">
              <Autocomplete
                onLoad={(auto) => (fromRef.current = auto)}
                onPlaceChanged={() => {
                  const place = fromRef.current?.getPlace();
                  if (place && place.geometry) {
                    const address = place.formatted_address;
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    form.setFieldsValue({ from: address });
                    setFromCoords({ address, lat, lng });
                  }
                }}
              >
                <Input
                  placeholder="Select where your belongings should be picked up"
                  value={fromCoords.address}
                  onChange={(e) => {
                    setFromCoords((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }));
                  }}
                  disabled
                />
              </Autocomplete>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="To" name="to">
              <Autocomplete
                onLoad={(auto) => (toRef.current = auto)}
                onPlaceChanged={() => {
                  const place = toRef.current?.getPlace();
                  if (place && place.geometry) {
                    const address = place.formatted_address;
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    form.setFieldsValue({ to: address });
                    setToCoords({ address, lat, lng });
                  }
                }}
              >
                <Input
                  placeholder="Select where your belongings should be moved to"
                  value={toCoords.address}
                  onChange={(e) => {
                    setToCoords((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }));
                  }}
                  disabled
                />
              </Autocomplete>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Weight (kg)" name="weight">
              <Input type="number" disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Price (€)" name="price">
              <Input type="number" disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Man Power" name="manPower">
              <Input type="number" disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Length (m)" name="length">
              <Input type="number" disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Width (m)" name="width">
              <Input type="number" disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Height (m)" name="height">
              <Input type="number" disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Fragile" name="fragile">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Cooling Required" name="cooling">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Ride Along" name="rideAlong">
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>

        {/* Conditionally render the Driver section only for the Requester */}
        {/* {(() => {
          // DEBUG block
          console.log("Driver Section Render Check:");
          console.log("  loggedInUserId:", loggedInUserId);
          console.log("  contractData exists:", !!contractData);
          if (contractData) {
            console.log(
              "  contractData.requesterId:",
              contractData.requesterId,
            );
            console.log(
              "  Number(loggedInUserId) === contractData.requesterId:",
              Number(loggedInUserId) === contractData.requesterId,
            );
          }
          console.log("  loadingDriver:", loadingDriver);
          console.log("  errorDriver:", errorDriver);
          console.log("  driverInfo:", driverInfo);
          return null; // This block is just for logging
        })()} */}
        {loggedInUserId && contractData &&
          Number(loggedInUserId) === contractData.requesterId && (
          <>
            <Title level={2}>Your driver:</Title>
            <div className={styles.scrollContainer}>
              {loadingDriver
                ? <p>Loading driver information...</p>
                : errorDriver
                ? <p>Error loading driver information.</p>
                : driverInfo
                ? (
                  <OfferCard
                    offerId={-1} // Placeholder, as this is not an offer
                    driverName={`${driverInfo.firstName} ${driverInfo.lastName}`}
                    driverId={String(driverInfo.userId)}
                    price={form.getFieldValue("price")} // Price from contract
                    driverPhoneNumber={driverInfo.phoneNumber}
                  />
                )
                : <p>No driver assigned or found.</p>}
            </div>
            <br />
          </>
        )}
      </Form>
      {/* Modal for displaying fetch errors for the main contract */}
      <Modal
        open={!!fetchContractError} // Modal is open if there is an error message
        footer={null}
        closable={false} // Consider making closable true or providing explicit close in footer
        centered
        onCancel={() => {
          setFetchContractError(null);
          // Decide if navigating away is appropriate or allow user to stay on page
          // router.push("/dashboard");
        }}
      >
        <div className={styles.registerCenter}>
          {/* Modal content is now only for error display */}
          {/* No loading condition inside the modal */}
          <div className={styles.registerError}>
            <CloseCircleOutlined style={{ fontSize: 48, color: "red" }} />
            <p>
              {fetchContractError ||
                "Something went wrong while fetching the proposal details."}
            </p>
            <Row justify="center" gutter={16}>
              <Col>
                <Button
                  type="primary"
                  onClick={() => {
                    setFetchContractError(null); // Clear error
                    router.push("/dashboard/proposal/new");
                  }}
                >
                  Create New
                </Button>
              </Col>
              <Col>
                <Button
                  onClick={() => {
                    setFetchContractError(null);
                    router.push("/dashboard");
                  }}
                >
                  Back to Overview
                </Button>
              </Col>
            </Row>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AcceptedProposal;
