"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Switch,
} from "antd";
import { CameraOutlined, CloseCircleOutlined } from "@ant-design/icons";
import styles from "./Edit.module.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import dayjs from "dayjs";
import { Autocomplete } from "@react-google-maps/api";
import OfferCard from "./OfferCard";
import { getApiDomain } from "@/utils/domain";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  proposalId: string;
}

const OfferProposal = ({ proposalId }: Props) => {
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

  const BASE_URL = getApiDomain();

  interface Offer {
    offerId: number;
    contract: {
      price: number;
    };
    driver: {
      userId: number;
      firstName: string;
      lastName: string;
      phoneNumber?: string; // Added phoneNumber
    };
    averageRating?: number; // Added to store fetched rating
  }

  interface Rating {
    ratingId: number;
    fromUser: { userId: number; username: string };
    toUser: { userId: number; username: string };
    contract: { contractId: number };
    ratingValue: number;
    flagIssues: boolean;
    comment: string;
  }

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [errorOffers, setErrorOffers] = useState(false);

  const fetchDriverAverageRating = async (
    driverId: number,
  ): Promise<number> => {
    try {
      const token = localStorage.getItem("token") || "";
      const requestingUserId = localStorage.getItem("userId") || "";

      if (!token || !requestingUserId) {
        console.warn(
          `Authentication details missing for fetching ratings for driver ${driverId}.`,
        );
        return 0; // Default to 0 if auth details are missing
      }

      const ratingsRes = await axios.get<{ ratings: Rating[] } | Rating[]>(
        `${BASE_URL}/api/v1/ratings/users/${driverId}/ratings`,
        {
          headers: {
            Authorization: token,
            UserId: requestingUserId,
          },
        },
      );

      let fetchedRatings: Rating[] = [];
      if (Array.isArray(ratingsRes.data)) {
        fetchedRatings = ratingsRes.data;
      } else if (
        ratingsRes.data &&
        Array.isArray((ratingsRes.data as { ratings: Rating[] }).ratings)
      ) {
        fetchedRatings = (ratingsRes.data as { ratings: Rating[] }).ratings;
      }

      if (fetchedRatings.length === 0) {
        return 0; // No ratings found
      }

      const totalRating = fetchedRatings.reduce(
        (acc, r) => acc + r.ratingValue,
        0,
      );
      const average = totalRating / fetchedRatings.length;
      return parseFloat(average.toFixed(1)); // Return average rounded to one decimal place
    } catch (error: any) {
      // Check if the error is a 404, meaning no ratings exist for the user
      if (error.response && error.response.status === 404) {
        console.log(`No ratings found for driver ${driverId}.`);
        return 0; // Return 0 if no ratings are found (404)
      }
      console.error(`Error fetching ratings for driver ${driverId}:`, error);
      return 0; // Default to 0 in case of other errors
    }
  };

  const fetchContract = useCallback(async () => {
    try {
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
        fragile: data.fragile,
        cooling: data.coolingRequired,
        rideAlong: data.rideAlong,
        manPower: data.manPower,
        price: data.price,
        weight: data.weight,
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
    } catch (err: any) {
      setError(true);
      const backendMessage = err.response?.data?.message;
      Modal.error({
        title: "Error fetching contract details",
        content: backendMessage || err.message || "An unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, form, proposalId]);

  const handleCancelProposal = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const userId = localStorage.getItem("userId") || "";

      if (!token || !userId) {
        console.error("Authentication details missing for cancel.");
        message.error("Authentication details missing. Please log in again.");
        return;
      }

      await axios.delete(`${BASE_URL}/api/v1/contracts/${proposalId}`, {
        headers: {
          Authorization: token,
          UserId: userId,
        },
      });
      message.success("Proposal cancelled successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Cancel failed:", error);
      const backendMessage = error.response?.data?.message;
      message.error(
        backendMessage ||
          (error.message || "Failed to cancel the proposal. Please try again."),
      );
    }
  };

  const handleAcceptOffer = async (offerId: number) => {
    try {
      const token = localStorage.getItem("token") || "";
      const userId = localStorage.getItem("userId") || "";

      if (!token || !userId) {
        message.error("Authentication details missing. Please log in again.");
        return;
      }

      await axios.put(
        `${BASE_URL}/api/v1/offers/${offerId}/status?status=ACCEPTED`,
        {},
        {
          headers: {
            Authorization: token,
            UserId: userId,
          },
        },
      );

      message.success("Offer accepted successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Error accepting offer:", err);
      const backendMessage = err.response?.data?.message;
      message.error(
        backendMessage ||
          (err.message || "Failed to accept the offer. Please try again."),
      );
    }
  };

  useEffect(() => {
    fetchContract();
    const fetchOffers = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const requestingUserId = localStorage.getItem("userId") || "";

        if (!token || !requestingUserId) {
          console.error("Authentication details missing for fetching offers.");
          setErrorOffers(true);
          setLoadingOffers(false);
          return;
        }

        const res = await axios.get<{ offers: any[] }>( // Use any[] for base offers initially
          `${BASE_URL}/api/v1/contracts/${proposalId}/offers`,
          {
            headers: {
              Authorization: token,
              UserId: requestingUserId,
            },
          },
        );

        console.log("Offers API Response:", res.data);
        if (Array.isArray(res.data.offers)) {
          const offersWithDetails = await Promise.all(
            res.data.offers.map(async (baseOffer) => {
              const rating = await fetchDriverAverageRating(
                baseOffer.driver.userId,
              );

              let phoneNumber: string | undefined;
              try {
                // Fetch full user details to get phone number
                const userDetailsResponse = await axios.get<any>( // Define a more specific type if API contract is known
                  `${BASE_URL}/api/v1/users/${baseOffer.driver.userId}`,
                  {
                    headers: {
                      Authorization: token,
                      UserId: requestingUserId,
                    },
                  },
                );
                // Assuming the user details endpoint returns phoneNumber directly on the response data
                phoneNumber = userDetailsResponse.data?.phoneNumber;
              } catch (userError) {
                console.error(
                  `Error fetching user details for driver ${baseOffer.driver.userId}:`,
                  userError,
                );
              }

              return {
                ...baseOffer,
                driver: {
                  ...baseOffer.driver,
                  phoneNumber: phoneNumber, // Add phoneNumber to the driver object
                },
                averageRating: rating,
              };
            }),
          );
          setOffers(offersWithDetails as Offer[]); // Cast to Offer[] after enrichment
        } else {
          console.error("API response for offers is not an array:", res.data);
          setOffers([]);
        }
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
  }, [form, proposalId, BASE_URL, fetchContract]);

  return (
    <div className={styles.wrapper}>
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
                  key={offer.offerId}
                  offerId={offer.offerId}
                  driverName={`${offer.driver.firstName} ${offer.driver.lastName}`}
                  driverId={String(offer.driver.userId)}
                  price={offer.contract.price}
                  rating={offer.averageRating || 0}
                  driverPhoneNumber={offer.driver.phoneNumber}
                  onAccept={handleAcceptOffer}
                />
              ))
            )}
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
          {loading
            ? null // Changed: Removed Spin component
            : error
            ? (
              <div className={styles.registerError}>
                <CloseCircleOutlined style={{ fontSize: 48, color: "red" }} />
                <p>
                  OfferProposal: Something went wrong while fetching the
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
