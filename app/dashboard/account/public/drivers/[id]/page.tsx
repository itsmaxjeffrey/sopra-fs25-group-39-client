//best to save this under /users/public/drivers/{userId}
"use client";
// pages/driver/[userId].tsx
import "@ant-design/v5-patch-for-react-19";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Card,
  Carousel,
  Col,
  Divider,
  Empty,
  message,
  Rate,
  Result,
  Row,
  Spin,
  Typography,
} from "antd";
import { UserOutlined } from "@ant-design/icons"; // Import UserOutlined for default avatar
import axios from "axios";
import { getApiDomain } from "@/utils/domain"; // Import the function

const BASE_URL = getApiDomain(); // Define BASE_URL

interface Rating {
  ratingId: number;
  fromUser: {
    userId: number;
    username: string;
  };
  toUser: {
    userId: number;
    username: string;
  };
  contract: {
    contractId: number;
  };
  ratingValue: number;
  flagIssues: false;
  comment: string;
}

interface Car {
  makeModel: string;
  licensePlate: string;
  weightCapacity: string;
  volumeCapacity: string;
}

interface Driver {
  userId: number;
  username: string;
  profilePicture: string;
  ratings: Rating[];
  car: Car | null;
}

export default function DriverProfilePage() {
  const router = useRouter();
  const { id } = useParams();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  const handleRatingClick = (ratingId: number) => {
    router.push(`${BASE_URL}/app/ratings/${ratingId}`);
  };

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    console.log("Driver ID:", id, typeof id); // Debugging the ID

    const fetchDriverAndRatings = async () => {
      setLoading(true);
      console.log(`Fetching data for driver ID: ${id}`); // Log start
      try {
        const token = localStorage.getItem("token") || "";
        const requestingUserId = localStorage.getItem("userId") || "";

        if (!token || !requestingUserId) {
          message.error("Authentication details missing. Please log in again.");
          setLoading(false);
          console.error("Auth details missing in localStorage"); // Log auth error
          return;
        }

        console.log("Fetching driver details...");
        const driverRes = await axios.get<{
          userId: number;
          username: string;
          profilePicturePath: string;
          carDTO?: {
            carModel?: string;
            licensePlate?: string;
            weightCapacity?: number;
            volumeCapacity?: number;
          };
        }>(
          `${BASE_URL}/api/v1/users/${id}`,
          {
            headers: {
              Authorization: token,
              UserId: requestingUserId,
            },
          },
        );
        console.log("Received driver details response:", driverRes.data); // Log driver response

        if (!driverRes.data || !driverRes.data.userId) {
          console.error("Invalid driver data received:", driverRes.data); // Log invalid data
          throw new Error("Invalid driver data received");
        }

        console.log("Fetching ratings...");
        const ratingsRes = await axios.get<{ ratings: Rating[] } | Rating[]>(
          `${BASE_URL}/api/v1/ratings/users/${id}/ratings`,
          {
            headers: {
              Authorization: token,
              UserId: requestingUserId,
            },
          },
        );
        console.log("Received ratings response:", ratingsRes.data); // Log ratings response

        let fetchedRatings: Rating[] = [];
        if (Array.isArray(ratingsRes.data)) {
          fetchedRatings = ratingsRes.data;
        } else if (ratingsRes.data && Array.isArray(ratingsRes.data.ratings)) {
          fetchedRatings = ratingsRes.data.ratings;
        }
        console.log("Processed ratings:", fetchedRatings); // Log processed ratings

        const driverData: Driver = {
          userId: driverRes.data.userId,
          username: driverRes.data.username,
          profilePicture: driverRes.data.profilePicturePath,
          ratings: fetchedRatings,
          car: driverRes.data.carDTO
            ? {
              makeModel: driverRes.data.carDTO.carModel || "Unknown Model",
              licensePlate: driverRes.data.carDTO.licensePlate ||
                "Unknown Plate",
              weightCapacity:
                (driverRes.data.carDTO.weightCapacity?.toString() ?? "0.0"),
              volumeCapacity:
                (driverRes.data.carDTO.volumeCapacity?.toString() ?? "0.0"),
            }
            : null,
        };
        console.log("Final driver data state:", driverData); // Log final state object

        setDriver(driverData);
      } catch (error: unknown) {
        const err = error as Error & {
          response?: { data?: { message?: string }; status?: number };
        };
        if (err.response?.status === 404) {
          message.error(
            `Driver details might be available, but ratings could not be found.`,
          );
          // Log specific 404 case
          console.warn(
            "404 Error fetching ratings, driver data might be partial.",
          );
          // Check if driver exists but ratings are empty (due to 404 on ratings fetch)
          if (driver && !driver.ratings.length) {
            // Keep existing driver data if ratings fetch failed but driver exists
          } else {
            setDriver(null);
          }
        } else {
          message.error(
            err.response?.data?.message || err.message ||
              "Failed to load driver profile.",
          );
          setDriver(null);
        }
        console.error("Error fetching driver data or ratings:", error); // Log general error
      } finally {
        setLoading(false);
      }
    };

    fetchDriverAndRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Keep only 'id' as dependency, disable warning for driver dependency

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 120px)",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!driver) {
    return (
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the driver you visited does not exist."
        extra={
          <Button type="primary" onClick={() => router.back()}>Go Back</Button>
        }
      />
    );
  }

  const averageRating = driver?.ratings && driver.ratings.length > 0
    ? driver.ratings.reduce((acc, r) => acc + r.ratingValue, 0) /
      driver.ratings.length
    : 0;

  const ratingsCount = driver?.ratings?.length || 0;

  return (
    <div
      style={{
        padding: "24px",
        background: "#fff",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={24} md={8} lg={6} style={{ textAlign: "center" }}>
          <Avatar
            size={150}
            src={driver.profilePicture
              ? `${BASE_URL}/api/v1/files/download?filePath=${driver.profilePicture}`
              : undefined}
            icon={!driver.profilePicture ? <UserOutlined /> : undefined}
            alt={`${driver.username}'s profile picture`}
            style={{ marginBottom: "16px", border: "4px solid #f0f0f0" }}
          />
          <Typography.Title level={3} style={{ marginBottom: "4px" }}>
            {driver.username}
          </Typography.Title>
          <Typography.Text type="secondary">Driver</Typography.Text>
          <Divider />
          <Typography.Text>Average Rating:</Typography.Text>
          <br />
          <Rate
            disabled
            allowHalf
            value={averageRating}
            style={{ marginTop: "8px", fontSize: "18px" }}
          />
          <Typography.Text style={{ marginLeft: "8px" }}>
            ({ratingsCount} ratings)
          </Typography.Text>
        </Col>

        <Col xs={24} sm={24} md={16} lg={18}>
          <Card
            title="Ratings & Comments"
            variant="borderless"
            style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.09)" }}
          >
            {driver?.ratings && driver.ratings.length > 0
              ? (
                <Carousel autoplay dotPosition="bottom">
                  {driver.ratings.map((rating, index) => (
                    <div
                      key={rating.ratingId || index}
                      style={{ padding: "10px" }}
                      onClick={() => handleRatingClick(rating.ratingId)}
                    >
                      <Card
                        type="inner"
                        title={`Rated by: ${rating.fromUser?.username || "Anonymous"}`}
                        extra={<Rate value={rating.ratingValue} disabled />}
                        style={{ margin: "0 auto", width: "95%" }}
                      >
                        <Typography.Paragraph
                          ellipsis={{
                            rows: 2,
                            expandable: true,
                            symbol: "more",
                          }}
                          style={{ marginBottom: 0 }}
                        >
                          {rating.comment || "No comment provided."}
                        </Typography.Paragraph>
                      </Card>
                    </div>
                  ))}
                </Carousel>
              )
              : <Empty description="No ratings yet." />}
          </Card>
        </Col>
      </Row>

      <Row justify="center" style={{ marginTop: "32px" }}>
        <Col>
          <Button
            type="default"
            onClick={() => router.back()}
            size="large"
          >
            Return
          </Button>
        </Col>
      </Row>
    </div>
  );
}
