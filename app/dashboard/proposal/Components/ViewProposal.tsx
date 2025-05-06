"use client";
import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Row,
  Spin,
  Switch,
} from "antd";
import { CameraOutlined, CloseCircleOutlined } from "@ant-design/icons";
import styles from "./Edit.module.css";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { getApiDomain } from "@/utils/domain";

const BASE_URL = getApiDomain();

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  proposalId: string;
}

const ViewProposal = ({ proposalId }: Props) => {
  const { id } = useParams(); // Retrieve the proposal ID from the URL
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [fromCoords, setFromCoords] = useState({ address: "", lat: 0, lng: 0 });
  const [toCoords, setToCoords] = useState({ address: "", lat: 0, lng: 0 });
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [contractStatus, setContractStatus] = useState<string | null>(null); // Add state for contract status
  const [hasUserOffered, setHasUserOffered] = useState(false); // Track if the user has already made an offer

  const fetchContract = async () => {
    try {
      // console.log(`userId: ${userId}`);
      console.log(`proposalId: ${id}`);
      if (!id) {
        throw new Error("Proposal ID is missing");
      }
      const res = await axios.get<{ contract: any }>(
        `${BASE_URL}/api/v1/contracts/${proposalId}`,
        {
          headers: {
            Authorization: localStorage.getItem("token") || "",
            "userId": localStorage.getItem("userId") || "",
          },
        },
      );
      const data = res.data.contract;
      // *** Log the entire received contract object ***
      console.log("Received Contract Data:", JSON.stringify(data, null, 2));

      if (!data || !data.contractId) {
        throw new Error("Invalid contract data");
      }
      setContractStatus(data.contractStatus); // Store the contract status
      console.log("Contract Status:", data.contractStatus); // Log the contract status

      // Check if the user has already made an offer on this contract
      const userId = localStorage.getItem("userId");
      if (data.offers && Array.isArray(data.offers)) {
        const userOffer = data.offers.find(
          (offer: any) => offer.driverId === Number(userId),
        );
        setHasUserOffered(!!userOffer); // Set to true if the user has already offered
        console.log("User has already made an offer:", !!userOffer); // Log the result
      }

      form.setFieldsValue({
        title: data.title,
        description: data.contractDescription,
        moveDate: dayjs(data.moveDateTime),
        from: data.fromLocation?.formattedAddress, // Use formattedAddress from the DTO for form field
        to: data.toLocation?.formattedAddress, // Use formattedAddress from the DTO for form field
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
        address: data.fromLocation?.formattedAddress || "", // Use formattedAddress from the DTO for state
        lat: data.fromLocation?.latitude,
        lng: data.fromLocation?.longitude,
      });
      setToCoords({
        address: data.toLocation?.formattedAddress || "", // Use formattedAddress from the DTO for state
        lat: data.toLocation?.latitude,
        lng: data.toLocation?.longitude,
      });
      // Update logging to check the correct field
      console.log("Fetched From Address:", data.fromLocation?.formattedAddress);
      console.log("Set From Coords State:", {
        address: data.fromLocation?.formattedAddress || "",
        lat: data.fromLocation?.latitude,
        lng: data.fromLocation?.longitude,
      });
      console.log("Fetched To Address:", data.toLocation?.formattedAddress);
      console.log("Set To Coords State:", {
        address: data.toLocation?.formattedAddress || "",
        lat: data.toLocation?.latitude,
        lng: data.toLocation?.longitude,
      });

      setImagePaths(
        // Use contractPhotos which is populated by the backend
        data.contractPhotos || [],
      );
      setError(false);
      setModalVisible(false);
    } catch (err: any) {
      setError(true);
      const backendMessage = err.response?.data?.message;
      Modal.error({
        title: "Error fetching contract details",
        content: backendMessage || err.message || "An unknown error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, proposalId]);

  const acceptProposal = async () => {
    try {
      setLoading(true); // Show loading spinner while the request is being processed

      const driverId = localStorage.getItem("userId");
      if (!driverId) {
        throw new Error("Driver ID not found in local storage.");
      }

      // Get the current contract status before creating an offer
      const contractResponse = await axios.get(
        `${BASE_URL}/api/v1/contracts/${proposalId}`,
        {
          headers: {
            Authorization: localStorage.getItem("token") || "",
            "UserId": driverId,
          },
        },
      );

      const contractStatus = contractResponse.data.contract.contractStatus;

      // Only allow creating offers for REQUESTED contracts
      if (contractStatus !== "REQUESTED" && contractStatus !== "OFFERED") {
        throw new Error(
          `Cannot create offer for a contract that is in ${contractStatus} state.`,
        );
      }

      // Log the values being sent
      console.log("Submitting offer with:", {
        contractId: Number(proposalId),
        driverId: Number(driverId),
      });

      const response = await axios.post(
        `${BASE_URL}/api/v1/offers`,
        {
          contractId: Number(proposalId), // Convert proposalId to number
          driverId: Number(driverId), // Convert driverId to number
        },
        {
          headers: {
            Authorization: localStorage.getItem("token") || "",
            "UserId": driverId, // Use the retrieved driverId string here
          },
        },
      );

      if (response.status === 201) {
        console.log("Offer created successfully!", response.data); // Changed log message
        Modal.success({
          title: "Success",
          content: "Your offer has been submitted successfully!", // Changed success message
          // Keep the modal open until OK is clicked, then redirect
          onOk() {
            router.push("/dashboard");
          },
        });
      }
    } catch (error) {
      console.error("Error submitting offer:", error); // Changed log message
      let errorMessage =
        "An unexpected error occurred. Please try again later.";
      if ((error as AxiosError).response) {
        // Log the full response for debugging
        console.error("Server Response Data:", (error as AxiosError).response?.data);
        console.error("Server Response Status:", (error as AxiosError).response?.status);
        console.error("Server Response Headers:", (error as AxiosError).response?.headers);

        // Check if the server provided a specific error message
        const responseData = (error as AxiosError).response?.data as { message?: string };
        errorMessage = responseData?.message ||
          ((error as AxiosError).response?.status === 409
            ? "You have already made an offer for this proposal."
            : `Request failed with status code ${(error as AxiosError).response?.status}. Possible reasons: Offer already exists, or the contract is not available.`);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      Modal.error({
        title: "Error",
        content: errorMessage, // Display more specific error
      });
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

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
                    // Use the download endpoint with the correct filePath parameter
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
            {/* Manually add label and use standalone Input */}
            <label style={{ display: "block", marginBottom: "8px" }}>
              From
            </label>
            <Input
              placeholder="From address"
              value={fromCoords.address} // Bind directly to state
              disabled
            />
          </Col>
          <Col span={8}>
            {/* Manually add label and use standalone Input */}
            <label style={{ display: "block", marginBottom: "8px" }}>To</label>
            <Input
              placeholder="To address"
              value={toCoords.address} // Bind directly to state
              disabled
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Dimensions (Length)" name="length">
              <InputNumber style={{ width: "100%" }} min={0} disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Dimensions (Width)" name="width">
              <InputNumber style={{ width: "100%" }} min={0} disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Dimensions (Height)" name="height">
              <InputNumber style={{ width: "100%" }} min={0} disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Weight (kg)" name="weight">
              <InputNumber style={{ width: "100%" }} min={0} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="My belongings are fragile"
              name="fragile"
              valuePropName="checked"
            >
              <Switch disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="My belongings require cooling"
              name="cooling"
              valuePropName="checked"
            >
              <Switch disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="I want to ride along"
              name="rideAlong"
              valuePropName="checked"
            >
              <Switch disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="I need help loading my belongings into the car"
              name="manPower"
            >
              <InputNumber
                placeholder="How many people do you need?"
                style={{ width: "100%" }}
                min={0}
                disabled
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Price proposal" name="price">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                step={1}
                disabled
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          {contractStatus === "REQUESTED" ||
              (contractStatus === "OFFERED" && !hasUserOffered)
            ? (
              <Row justify="start" gutter={16}>
                <Col>
                  <Button
                    type="primary"
                    htmlType="button"
                    onClick={acceptProposal}
                    style={{
                      backgroundColor: "#52c41a",
                      borderColor: "#52c41a",
                    }}
                    disabled={contractStatus === "OFFERED" && hasUserOffered}
                    title={contractStatus === "OFFERED" && hasUserOffered
                      ? "You have already made an offer for this proposal."
                      : ""}
                  >
                    Accept Proposal
                  </Button>
                </Col>
              </Row>
            )
            : (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <p>
                  <strong>Proposal Status:</strong> {contractStatus}
                </p>
                <Button
                  type="default"
                  onClick={() => router.back()} // Navigate back to the previous page
                >
                  Back to Previous Page
                </Button>
              </div>
            )}
        </Form.Item>
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
                  ViewProposal: Something went wrong while fetching the proposal
                  details.
                </p>
                <Row justify="center" gutter={16}>
                  <Col></Col>
                  <Col>
                    <Button
                      onClick={() =>
                        router.push("/dashboard/contract-overview")}
                    >
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

export default ViewProposal;
