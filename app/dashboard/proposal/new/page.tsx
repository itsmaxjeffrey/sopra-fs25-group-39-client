"use client";
import '@ant-design/v5-patch-for-react-19';
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  Upload,
} from "antd";
import {
  CameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { Autocomplete } from "@react-google-maps/api";
import styles from "./New.module.css";
import dayjs from "dayjs";
import { getApiDomain } from "@/utils/domain";

const BASE_URL = getApiDomain();

/* eslint-disable @typescript-eslint/no-explicit-any */

const NewProposalFormPage = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalState, setModalState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [fromCoords, setFromCoords] = useState({ address: "", lat: 0, lng: 0 });
  const [toCoords, setToCoords] = useState({ address: "", lat: 0, lng: 0 });
  const fromRef = useRef<any>(null);
  const toRef = useRef<any>(null);
  const [uploadedPaths, setUploadedPaths] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);

  const handleUpload = async (file: File, idx: number) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "proposal");

    if (!token || !userId) return;

    try {
      const response = await axios.post(`${BASE_URL}/api/v1/files/upload`, formData, {
        headers: {
          UserId: `${userId}`,
          Authorization: `${token}`,
        },
      });

      if (!response.data.filePath) {
        throw new Error("File path is missing in the response");
      }

      const newPaths = [...uploadedPaths];
      newPaths[idx] = response.data.filePath;
      setUploadedPaths(newPaths);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleFinish = async (values: any) => {
    console.log("Submitting values:", values); // Log the raw form values
    setModalState("loading");
    setModalVisible(true);

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    // *** Log the specific values being used for address ***
    console.log("Address from values.from:", values.from);
    console.log("Address from values.to:", values.to);

    const payload = {
      title: values.title,
      contractDescription: values.description,
      moveDateTime: values.moveDate?.toISOString(),
      fromLocation: {
        latitude: fromCoords.lat,
        longitude: fromCoords.lng,
        formattedAddress: values.from, // Using form value
      },
      toLocation: {
        latitude: toCoords.lat,
        longitude: toCoords.lng,
        formattedAddress: values.to,   // Using form value
      },
      length: Number(values.length),
      width: Number(values.width),
      height: Number(values.height),
      mass: Number(values.mass),
      fragile: values.fragile,
      coolingRequired: values.cooling,
      rideAlong: values.rideAlong,
      // Add fallback for parseInt in case manPower is empty/undefined
      manPower: parseInt(values.manPower) || 0, 
      price: parseFloat(values.price),
      contractStatus: "REQUESTED",
      requesterId: userId ? parseInt(userId) : null,
      imagePath1: uploadedPaths[0],
      imagePath2: uploadedPaths[1],
      imagePath3: uploadedPaths[2],
    };

    try {
      console.log("Payload From Address:", payload.fromLocation.formattedAddress);
      console.log("Payload To Address:", payload.toLocation.formattedAddress);
      console.log("WOULD SEND:", JSON.stringify(payload, null, 2));
      await axios.post(`${BASE_URL}/api/v1/contracts`, payload, {
        headers: {
          UserId: `${userId}`,
          Authorization: `${token}`,
        },
        withCredentials: true,
      });
      setModalState("success");
    } catch (err: any) {
      console.error("Creation failed", err);
      setModalState("error");
      // Extract more specific error message if available
      const backendMessage = err.response?.data?.message || err.message;
      setErrorMessage(backendMessage || "Something went wrong while creating your proposal.");
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Image Upload Section */}
      <div className={styles.imageUpload}>
        <div className={styles.imageRow}>
          {[0, 1, 2].map((idx) => (
            <div key={idx} className={styles.imageBox}>
              <Upload
                listType="picture-card"
                maxCount={1}
                beforeUpload={(file) => {
                  handleUpload(file, idx);
                  return false;
                }}
                onRemove={() => {
                  const newPaths = [...uploadedPaths];
                  newPaths[idx] = null;
                  setUploadedPaths(newPaths);
                }}
                showUploadList={false}
              >
                {uploadedPaths[idx]
                  ? (
                    <Image
                      src={`${BASE_URL}/api/v1/files/download?filePath=${
                        uploadedPaths[idx]
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
              </Upload>
            </div>
          ))}
        </div>
      </div>

      <Form
        layout="vertical"
        className={styles.form}
        form={form}
        onFinish={handleFinish}
      >
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter a title" }]}
        >
          <Input placeholder="Give your proposal a fitting name" />
        </Form.Item>

        <Form.Item
          name="description"
          rules={[{ required: true, message: "Please enter a description" }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Describe what you want to move"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Moving Date"
              name="moveDate"
              rules={[{ required: true, message: "Please select a move date" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                showTime={{ format: "HH:mm", showSecond: false }}
                disabledDate={(current) =>
                  current && current < dayjs().startOf("minute")}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="From"
              name="from"
              rules={[
                { required: true, message: "Please enter pickup location" },
              ]}
            >
              <Autocomplete
                onLoad={(auto) => (fromRef.current = auto)}
                onPlaceChanged={() => {
                  const place = fromRef.current?.getPlace();
                  if (place && place.geometry) {
                    const address = place.formatted_address;
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    setFromCoords({ address, lat, lng });
                    form.setFieldsValue({ from: address });
                  }
                }}
              >
                <Form.Item name="from" noStyle>
                  <Input placeholder="Start typing..." />
                </Form.Item>
              </Autocomplete>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="To"
              name="to"
              rules={[
                { required: true, message: "Please enter drop-off location" },
              ]}
            >
              <Autocomplete
                onLoad={(auto) => (toRef.current = auto)}
                onPlaceChanged={() => {
                  const place = toRef.current?.getPlace();
                  if (place && place.geometry) {
                    const address = place.formatted_address;
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    setToCoords({ address, lat, lng });
                    form.setFieldsValue({ to: address });
                  }
                }}
              >
                <Form.Item name="to" noStyle>
                  <Input placeholder="Start typing..." />
                </Form.Item>
              </Autocomplete>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="Length (cm)"
              name="length"
              rules={[{ required: true, message: "Please enter length" }]}
            >
              <InputNumber
                placeholder="100 cm"
                style={{ width: "100%" }}
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Width (cm)"
              name="width"
              rules={[{ required: true, message: "Please enter width" }]}
            >
              <InputNumber
                placeholder="100 cm"
                style={{ width: "100%" }}
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Height (cm)"
              name="height"
              rules={[{ required: true, message: "Please enter height" }]}
            >
              <InputNumber
                placeholder="100 cm"
                style={{ width: "100%" }}
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Mass (kg)"
              name="mass"
              rules={[{ required: true, message: "Please enter height" }]}
            >
              <InputNumber
                placeholder="50 kg"
                style={{ width: "100%" }}
                min={0}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="My belongings are fragile"
              name="fragile"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="My belongings require cooling"
              name="cooling"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="I want to ride along"
              name="rideAlong"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch />
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
                placeholder="How many people do you need? (Empty for 0)"
                style={{ width: "100%" }}
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Price proposal"
              name="price"
              rules={[
                {
                  required: true,
                  message: "Please enter your price proposal",
                },
              ]}
            >
              <InputNumber
                placeholder="CHF"
                style={{ width: "100%" }}
                min={0}
                step={1}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Create Proposal
          </Button>
        </Form.Item>
      </Form>
      {/* Modal */}
      <Modal open={modalVisible} footer={null} closable={false} centered>
        <div className={styles.registerCenter}>
          {modalState === "loading" && (
            <div style={{ padding: 64 }}>
              <Spin size="large" />
            </div>
          )}
          {modalState === "success" && (
            <div className={styles.registerSuccess}>
              <CheckCircleOutlined
                style={{ fontSize: 48, color: "green", marginBottom: "20px" }}
              />
              <p>Proposal successfully created!</p>
              <Button type="primary" onClick={() => router.push("/dashboard")}>
                Great!
              </Button>
            </div>
          )}
          {modalState === "error" && (
            <div className={styles.registerError}>
              <CloseCircleOutlined
                style={{ fontSize: 48, color: "red", marginBottom: "20px" }}
              />
              <p>
                {errorMessage ||
                  "Something went wrong while creating your proposal."}
              </p>
              <Button onClick={() => setModalVisible(false)}>OK</Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default NewProposalFormPage;
