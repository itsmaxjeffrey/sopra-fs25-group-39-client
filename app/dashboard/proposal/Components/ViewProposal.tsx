"use client";
import React, { useEffect, useRef, useState } from "react";
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
import axios from "axios";
import dayjs from "dayjs";
import { Autocomplete } from "@react-google-maps/api";
import { useParams } from "next/navigation";

const BASE_URL = process.env.NODE_ENV === "production"
  ? "https://sopra-fs25-group-39-client.vercel.app"
  : "http://localhost:8080";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  proposalId: string;
}

interface ContractData {
  contractId: number;
  title: string;
  contractDescription: string;
  moveDateTime: string;
  fromLocation?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  toLocation?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  length: number;
  width: number;
  height: number;
  mass: number;
  fragile: boolean;
  coolingRequired: boolean;
  rideAlong: boolean;
  manPower: number;
  price: number;
  imagePath1?: string;
  imagePath2?: string;
  imagePath3?: string;
}

const ViewProposal = ({ proposalId }: Props) => {
  const { id } = useParams(); // Retrieve the proposal ID from the URL
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

  const fetchContract = async () => {
    try {
      // console.log(`userId: ${userId}`);
      console.log(`proposalId: ${id}`);
      if (!id) {
        throw new Error("Proposal ID is missing");
      }
      const res = await axios.get<ContractData>(
        `http://localhost:8080/api/v1/contracts/${proposalId}`,
      );
      const data = res.data;
      if (!data || !data.contractId) {
        throw new Error("Invalid contract data");
      }
      form.setFieldsValue({
        title: data.title,
        description: data.contractDescription,
        moveDate: dayjs(data.moveDateTime),
        from: data.fromLocation?.address,
        to: data.toLocation?.address,
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
        address: data.fromLocation?.address,
        lat: data.fromLocation?.latitude,
        lng: data.fromLocation?.longitude,
      });
      setToCoords({
        address: data.toLocation?.address,
        lat: data.toLocation?.latitude,
        lng: data.toLocation?.longitude,
      });
      setImagePaths(
        [data.imagePath1, data.imagePath2, data.imagePath3].filter(Boolean),
      );
      setError(false);
      setModalVisible(false);
    } catch {
      setError(true);
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
      const response = await axios.post("http://localhost:8080/api/v1/offers", {
        contractId: proposalId,
        driverId: driverId,
      });

      if (response.status === 201) {
        console.log("Proposal accepted successfully!", response.data);
        Modal.success({
          title: "Success",
          content: "The proposal has been accepted successfully!",
          onOk: () => router.push("/dashboard"), // Redirect to overview
        });
      }
    } catch (error) {
      console.error("Error accepting proposal:", error);
      Modal.error({
        title: "Error",
        content: "An unexpected error occurred. Please try again later.",
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
            <Form.Item label="Weight (kg)" name="mass">
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
          <Row justify="start" gutter={16}>
            <Col>
              <Button
                type="primary"
                htmlType="button"
                onClick={acceptProposal}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Accept Proposal
              </Button>
            </Col>
          </Row>
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
