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
  Switch,
} from "antd";
import { CameraOutlined, CloseCircleOutlined } from "@ant-design/icons";
import styles from "./Edit.module.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import dayjs from "dayjs";
import { getApiDomain } from "@/utils/domain";

const BASE_URL = getApiDomain();
/* eslint-disable @typescript-eslint/no-explicit-any */
interface Props {
  proposalId: string;
}

const ViewOfferedProposal = ({ proposalId }: Props) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [fetchContractError, setFetchContractError] = useState<string | null>(
    null,
  );
  const [fromCoords, setFromCoords] = useState({ address: "", lat: 0, lng: 0 });
  const [toCoords, setToCoords] = useState({ address: "", lat: 0, lng: 0 });
  const [imagePaths, setImagePaths] = useState<string[]>([]);

  const fetchContract = async () => {
    setFetchContractError(null);
    try {
      console.log(`proposalId (from prop): ${proposalId}`);
      if (!proposalId) {
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
      console.log("Received Contract Data:", JSON.stringify(data, null, 2));

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
        weight: Number(data.weight),
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
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      setFetchContractError(
        backendMessage || err.message ||
          "An unknown error occurred while fetching contract details.",
      );
    }
  };

  useEffect(() => {
    fetchContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  return (
    <div className={styles.wrapper}>
      {/* Image Upload */}
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

      {/* Form */}
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
            <label style={{ display: "block", marginBottom: "8px" }}>
              From
            </label>
            <Input
              placeholder="From address"
              value={fromCoords.address}
              disabled
            />
          </Col>
          <Col span={8}>
            <label style={{ display: "block", marginBottom: "8px" }}>To</label>
            <Input
              placeholder="To address"
              value={toCoords.address}
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

        <Row justify="start" style={{ marginTop: "20px" }}>
          <Col>
            <Button type="default" onClick={() => router.back()}>
              Go Back
            </Button>
          </Col>
        </Row>
      </Form>

      {/* Modal: Now only for fetch errors */}
      <Modal
        open={!!fetchContractError} // Modal is open if there is an error message
        footer={null}
        closable={false} // Consider making closable true or providing explicit close in footer
        centered
        onCancel={() => {
          setFetchContractError(null);
          // Decide if navigating away is appropriate or allow user to stay on page
          // router.push("/dashboard/contract-overview");
        }}
      >
        <div className={styles.registerCenter}>
          {/* Modal content is now only for error display */}
          {/* No loading condition inside the modal */}
          <div className={styles.registerError}>
            <CloseCircleOutlined style={{ fontSize: 48, color: "red" }} />
            <p>
              {/* Use the specific error message from fetchContractError */}
              {fetchContractError ||
                "Something went wrong while fetching the proposal details."}
            </p>
            <Row justify="center" gutter={16}>
              <Col>
                <Button
                  onClick={() => {
                    setFetchContractError(null); // Clear error
                    router.push("/dashboard/contract-overview");
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

export default ViewOfferedProposal;
