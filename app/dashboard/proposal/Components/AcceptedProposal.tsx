"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Button,
  Switch,
  Upload,
  Modal,
  Spin,
} from "antd";
import {
  CameraOutlined,
  CloseCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import styles from "./Edit.module.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import dayjs from "dayjs";
import { Autocomplete } from "@react-google-maps/api";
import OfferCard from "./OfferCard";
import Title from "antd/es/typography/Title";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  id: string;
}

const AcceptedProposal = ({ id }: Props) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const fromRef = useRef<any>(null);
  const toRef = useRef<any>(null);
  const [fromCoords, setFromCoords] = useState({ address: "", lat: 0, lng: 0 });
  const [toCoords, setToCoords] = useState({ address: "", lat: 0, lng: 0 });
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [contractStatus, setContractStatus] = useState("");

  const fetchContract = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5001/api/v1/contracts/${id}`
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
      setContractStatus(data.contractStatus);
      setError(false);
      setModalVisible(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelProposal = async () => {
    try {
      await axios.delete(`http://localhost:5001/api/v1/contracts/${id}`);
      router.push("/dashboard");
    } catch (error) {
      console.error("Cancel failed:", error);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [form, id]);

  return (
    <div className={styles.wrapper}>
      {/* Bild Upload */}
      <div className={styles.imageUpload}>
        <div className={styles.imageRow}>
          {[1, 2, 3].map((_, idx) => (
            <div key={idx} className={styles.imageBox}>
              <Upload showUploadList={false}>
                <div className={styles.cameraIcon}>
                  <CameraOutlined style={{ fontSize: 28, color: "#999" }} />
                </div>
              </Upload>
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
                  current && current < dayjs().startOf("minute")
                }
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
          <OfferCard
            title={"Fridge and Piano"}
            driverName={"Peter Baumgartner"}
            price={205}
            rating={3}
          />
        </div>
        <br />

        <Form.Item>
          <Row justify="start" gutter={16}>
            <Col>
              <Button
                danger
                type="primary"
                onClick={() => setIsCancelModalOpen(true)}
              >
                Cancel Proposal
              </Button>
            </Col>
          </Row>
        </Form.Item>
      </Form>
      <Modal open={modalVisible} footer={null} closable={false} centered>
        <div className={styles.registerCenter}>
          {loading ? (
            <div style={{ padding: 64 }}>
              <Spin size="large" />
            </div>
          ) : error ? (
            <div className={styles.registerError}>
              <CloseCircleOutlined style={{ fontSize: 48, color: "red" }} />
              <p>UUUUUUPPPPPPSSSS</p>
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
          ) : null}
        </div>
      </Modal>
      <Modal
        title="Cancel Proposal"
        open={isCancelModalOpen}
        onOk={handleCancelProposal}
        onCancel={() => setIsCancelModalOpen(false)}
        okText="Yes, cancel it"
        cancelText="No"
        centered
      >
        <p>Are you sure you want to cancel this proposal?</p>
        <p>THis will also delete the proposal!</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default AcceptedProposal;
