"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Image,
  Input,
  Modal,
  Row,
  Spin,
  Switch,
} from "antd";
import { CameraOutlined, CloseCircleOutlined } from "@ant-design/icons";
import styles from "./RatingProposal.module.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import dayjs from "dayjs";
import { Autocomplete } from "@react-google-maps/api";
import Title from "antd/es/typography/Title";
import { Rate } from "antd";
import { getApiDomain } from "@/utils/domain";

const BASE_URL = getApiDomain();

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

const RatingProposal = ({ proposalId }: Props) => {
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
      const res = await axios.get<ContractData>(
        `${BASE_URL}/api/v1/contracts/${proposalId}`,
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
                    src={process.env.NODE_ENV === "production"
                      ? `https://sopra-fs25-group-39-client.vercel.app${
                        imagePaths[idx]
                      }`
                      : `${BASE_URL}${imagePaths[idx]}`}
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

        <Divider />
        <Title level={4}>Rate your experience</Title>
        <Form
          layout="vertical"
          onFinish={async (values) => {
            try {
              const payload = {
                proposalId,
                rating: values.rating,
                issues: values.issues || false,
                issueDetails: values.issues ? values.issueDetails || "" : "",
              };
              await axios.post(
                `${BASE_URL}/api/v1/contracts/${proposalId}/driver-rating`,
                payload,
              );
              Modal.success({
                title: "Thank you!",
                content: "Your feedback has been submitted.",
                centered: true,
                onOk: () => router.push("/dashboard"),
              });
            } catch (err) {
              console.log(err);
            }
          }}
        >
          <Form.Item
            name="rating"
            label="Rating"
            rules={[{ required: true, message: "Please give a rating" }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name="issues"
            label="Were there any issues?"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.issues !== cur.issues}
          >
            {({ getFieldValue }) =>
              getFieldValue("issues")
                ? (
                  <Form.Item
                    name="issueDetails"
                    label="Please describe the issue"
                    rules={[
                      { required: true, message: "Please describe the issue" },
                    ]}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Explain what went wrong..."
                    />
                  </Form.Item>
                )
                : null}
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Submit Rating
            </Button>
          </Form.Item>
        </Form>
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
                  RatingProposal: Something went wrong while fetching the
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

export default RatingProposal;
