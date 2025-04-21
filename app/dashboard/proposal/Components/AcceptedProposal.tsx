"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Image,
  Input,
  Modal,
  Row,
  Spin,
} from "antd";
import { CameraOutlined, CloseCircleOutlined } from "@ant-design/icons";
import styles from "./Edit.module.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import dayjs from "dayjs";
import { Autocomplete } from "@react-google-maps/api";
import OfferCard from "./OfferCard";
import Title from "antd/es/typography/Title";
import { getApiDomain } from "@/utils/domain";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Define an interface for the driver data
interface DriverInfo {
  userId: number;
  firstName: string;
  lastName: string;
  // Add other relevant driver fields if available, e.g., averageRating
}

interface Props {
  proposalId: string;
}

const AcceptedProposal = ({ proposalId }: Props) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const fromRef = useRef<any>(null);
  const toRef = useRef<any>(null);
  const [fromCoords, setFromCoords] = useState({ address: "", lat: 0, lng: 0 });
  const [toCoords, setToCoords] = useState({ address: "", lat: 0, lng: 0 });
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null); // State for driver info
  const [loadingDriver, setLoadingDriver] = useState(true); // Loading state for driver
  const [errorDriver, setErrorDriver] = useState(false); // Error state for driver
  const BASE_URL = getApiDomain();

  const fetchContract = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const userId = localStorage.getItem("userId") || "";

      if (!token || !userId) {
        setError(true);
        setLoading(false);
        console.error("Authentication details missing.");
        // Optionally show a message to the user
        return;
      }

      const res = await axios.get<{ contract: any }>(
        `${BASE_URL}/api/v1/contracts/${proposalId}`,
        {
          headers: {
            Authorization: token,
            UserId: userId, // Use UserId (capital U, capital I, lowercase d)
          },
        },
      );
      const data = res.data.contract;
      if (!data || !data.contractId) {
        throw new Error("Invalid contract data");
      }
      form.setFieldsValue({
        title: data.title,
        description: data.contractDescription,
        moveDate: dayjs(data.moveDateTime),
        from: data.fromLocation?.formattedAddress,
        to: data.toLocation?.formattedAddress,
        length: data.length,
        width: data.width,
        height: data.height,
        mass: Number(data.mass),
        fragile: data.fragile,
        cooling: data.coolingRequired,
        rideAlong: data.rideAlong,
        manPower: data.manPower,
        price: data.price,
      });
      setFromCoords({
        address: data.fromLocation?.formattedAddress || "",
        lat: data.fromLocation?.latitude,
        lng: data.fromLocation?.longitude,
      });
      setToCoords({
        address: data.toLocation?.formattedAddress || "",
        lat: data.toLocation?.latitude,
        lng: data.toLocation?.longitude,
      });
      setImagePaths(data.contractPhotos || []);
      setError(false);
      setModalVisible(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch driver info
  const fetchDriverInfo = async () => {
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
      // Fetch driver info only after contract is fetched successfully (or based on your logic)
      if (!error) {
        await fetchDriverInfo();
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

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
                    // Use the correct download endpoint
                    src={`${BASE_URL}/api/v1/files/download?filePath=${imagePaths[idx]}`}
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

        <Title level={2}>Your driver:</Title>

        <div className={styles.scrollContainer}>
          {loadingDriver
            ? <p>Loading driver information...</p>
            : errorDriver
            ? <p>Error loading driver information.</p>
            : driverInfo
            ? (
              <OfferCard
                offerId={-1} // Dummy offerId as it's not needed here
                driverName={`${driverInfo.firstName} ${driverInfo.lastName}`}
                driverId={String(driverInfo.userId)}
                price={form.getFieldValue("price")} // Price comes from the contract
                rating={0} // Placeholder rating, fetch/calculate if needed
                // No onAccept needed here
              />
            )
            : <p>No driver assigned or found.</p>}
        </div>
        <br />
      </Form>
      <Modal open={modalVisible} footer={null} closable={false} centered>
        <div className={styles.registerCenter}>
          {loading
            ? (
              <div style={{ padding: 64 }}>
                <Spin size="large" />
              </div>
            )
            : error
            ? (
              <div className={styles.registerError}>
                <CloseCircleOutlined style={{ fontSize: 48, color: "red" }} />
                <p>
                  acceptedProposal: Something went wrong while fetching the
                  proposal details.
                </p>
                <Row justify="center" gutter={16}>
                  <Col>
                    <Button
                      type="primary"
                      onClick={() => router.push("/dashboard/proposal/new")}
                    >
                      Create New
                    </Button>
                  </Col>
                  <Col>
                    <Button onClick={() => router.push("/dashboard")}>
                      Back to Overview
                    </Button>
                  </Col>
                </Row>
              </div>
            )
            : null}
        </div>
      </Modal>
    </div>
  );
};

export default AcceptedProposal;
