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
import OfferCard from "./OfferCard";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  id: string;
}

const OfferProposal = ({ id }: Props) => {
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
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  interface Offer {
    offerId: string;
    //title: string;
    driverName: string;
    driverId: string;
    price: number;
    rating: number;
    averageRating: number; // Added averageRating property
  }

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [errorOffers, setErrorOffers] = useState(false);

  const fetchContract = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5001/api/v1/contracts/${id}`,
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
        mass: data.mass,
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

  const handleCancelProposal = async () => {
    try {
      await axios.delete(`http://localhost:5001/api/v1/contracts/${id}`);
      router.push("/dashboard");
    } catch (error) {
      console.error("Cancel failed:", error);
    }
  };

  const handleCardClick = (offerId: string) => {
    console.log("Clicked Offer ID:", offerId);
    // Toggle selection: if the clicked card is already selected, unselect it
    setSelectedOfferId((prevSelectedId) =>
      prevSelectedId === offerId ? null : offerId
    );
  };

  const handleConfirmSelection = async () => {
    if (!selectedOfferId) {
      Modal.warning({
        title: "No Offer Selected",
        content: "Please select an offer before confirming.",
      });
      return;
    }

    try {
      await axios.put(
        `http://localhost:5001/api/v1/offers/${selectedOfferId}/status?status=ACCEPTED`,
      );
      Modal.success({
        title: "Success",
        content: "The offer has been successfully accepted!",
        onOk: () => router.push("/dashboard"),
      });
    } catch (error) {
      console.error("Error confirming selection:", error);
      Modal.error({
        title: "Error",
        content: "An error occurred while accepting the offer. Please try again.",
      });
    }
  };


  useEffect(() => {
    fetchContract();
    const fetchOffers = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5001/api/v1/contracts/${id}/offers`,
        );

        console.log("Offers API Response:", res.data); // Debugging the API response
        setOffers(res.data); // Store the offers in state
        console.log("Offers:", res.data); // Debugging the offers state
        setErrorOffers(false);
      } catch (error) {
        console.error("Error fetching offers:", error);
        setErrorOffers(true);
      } finally {
        setLoadingOffers(false);
      }
    };

    fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, id]);

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
                      : `http://localhost:5001${imagePaths[idx]}`}
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

        <Divider />
        <div className={styles.scrollContainer}>
          {loadingOffers
            ? <p>Loading offers...</p>
            : errorOffers
            ? <p>Error loading offers. Please try again later.</p>
            : offers.length === 0
            ? <p>No offers available for this proposal.</p>
            : (
              offers.map((offer) => (
                <OfferCard
                  key={offer.offerId} // Use a unique key for each OfferCard
                  //title={offer.title || "No Title"} // Fallback if title is missing
                  driverName={offer.driverName}
                  driverId={offer.driverId}
                  price={offer.price}
                  rating={Math.floor(offer.averageRating)}
                  isSelected={selectedOfferId === offer.offerId} 
                  onClick={() => handleCardClick(offer.offerId)}
                />
              ))
            )}
        </div>
        <br />

        <Form.Item>
          <Row justify="start" gutter={16}>
          <Col>
              <Button
                type="primary"
                onClick={handleConfirmSelection}
                disabled={!selectedOfferId} // Disable button if no offer is selected
                style={{
                  backgroundColor: selectedOfferId ? "#52c41a" : undefined, // Green if selected
                  borderColor: selectedOfferId ? "#52c41a" : undefined,
                }}
              >
                Confirm Selection
              </Button>
            </Col>
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
            )
            : null}
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

export default OfferProposal;
