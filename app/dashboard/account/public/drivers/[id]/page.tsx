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

// Interface for the raw rating object from the API
interface ApiRating {
  ratingId: number;
  fromUserId: number;
  toUserId: number;
  contractId: number;
  ratingValue: number;
  flagIssues: boolean;
  comment: string;
}

// Interface for User details fetched for fromUsername
interface UserDetails {
  userId: number;
  username: string;
  // Add other fields if needed, though only username is used here
}

interface Rating {
  ratingId: number;
  fromUserId: number; // Changed from fromUser object
  fromUsername?: string; // Added to store fetched username
  toUserId: number; // Changed from toUser object
  contractId: number; // Changed from contract object
  ratingValue: number;
  flagIssues: boolean; // Changed from literal false to boolean
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
  ratings: Rating[]; // This will use the updated Rating interface
  car: Car | null;
}

export default function DriverProfilePage() {
  const router = useRouter();
  const { id } = useParams();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  // Removed error state as specific errors are handled with messages
  // and driver state being null.

  const handleRatingClick = (ratingId: number) => {
    router.push(`/dashboard/ratings/${ratingId}`);
  };

  useEffect(() => {
    if (!id || typeof id !== "string") {
      setLoading(false);
      // Optionally set an error message or redirect if ID is invalid
      message.error("Invalid driver ID.");
      return;
    }

    const fetchDriverAndRatings = async () => {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      const requestingUserId = localStorage.getItem("userId") || "";

      if (!token || !requestingUserId) {
        message.error("Authentication details missing. Please log in again.");
        setLoading(false);
        setDriver(null);
        return;
      }

      let fetchedDriverDetails: {
        userId: number;
        username: string;
        profilePicturePath: string;
        carDTO?: {
          carModel?: string;
          licensePlate?: string;
          weightCapacity?: number;
          volumeCapacity?: number;
        };
      } | null = null;

      try {
        // 1. Fetch Driver Details
        const driverRes = await axios.get<typeof fetchedDriverDetails>(
          `${BASE_URL}/api/v1/users/${id}`,
          { headers: { Authorization: token, UserId: requestingUserId } },
        );

        if (!driverRes.data || !driverRes.data.userId) {
          throw new Error("Invalid driver data received");
        }
        fetchedDriverDetails = driverRes.data;

        // Initialize driver object (without ratings yet)
        const provisionalDriver: Driver = {
          userId: fetchedDriverDetails.userId,
          username: fetchedDriverDetails.username,
          profilePicture: fetchedDriverDetails.profilePicturePath,
          ratings: [], // Initialize with empty ratings
          car: fetchedDriverDetails.carDTO
            ? {
              makeModel: fetchedDriverDetails.carDTO.carModel ||
                "Unknown Model",
              licensePlate: fetchedDriverDetails.carDTO.licensePlate ||
                "Unknown Plate",
              weightCapacity:
                (fetchedDriverDetails.carDTO.weightCapacity?.toString() ??
                  "0.0"),
              volumeCapacity:
                (fetchedDriverDetails.carDTO.volumeCapacity?.toString() ??
                  "0.0"),
            }
            : null,
        };

        // 2. Fetch Ratings
        try {
          const ratingsApiResponse = await axios.get<{ ratings: ApiRating[] }>(
            `${BASE_URL}/api/v1/ratings/users/${id}/ratings`,
            { headers: { Authorization: token, UserId: requestingUserId } },
          );

          const rawApiRatings: ApiRating[] = ratingsApiResponse.data.ratings ||
            [];

          const ratingsWithUsernames: Rating[] = await Promise.all(
            rawApiRatings.map(async (apiRating) => {
              let fromUsername = "Anonymous";
              try {
                const userRes = await axios.get<UserDetails>(
                  `${BASE_URL}/api/v1/users/${apiRating.fromUserId}`,
                  {
                    headers: { Authorization: token, UserId: requestingUserId },
                  },
                );
                if (userRes.data && userRes.data.username) {
                  fromUsername = userRes.data.username;
                }
              } catch (userError) {
                console.error(
                  `Failed to fetch username for userId ${apiRating.fromUserId}:`,
                  userError,
                );
              }
              return {
                ratingId: apiRating.ratingId,
                fromUserId: apiRating.fromUserId,
                fromUsername: fromUsername,
                toUserId: apiRating.toUserId,
                contractId: apiRating.contractId,
                ratingValue: apiRating.ratingValue,
                flagIssues: apiRating.flagIssues,
                comment: apiRating.comment,
              };
            }),
          );
          provisionalDriver.ratings = ratingsWithUsernames;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (ratingsError: any) {
          console.warn("Failed to fetch ratings:", ratingsError);
          if (ratingsError.response?.status === 404) {
            message.info(
              "Driver details loaded. No ratings found for this driver.",
            );
          } else {
            message.error("Could not load ratings for the driver.");
          }
          // provisionalDriver.ratings remains empty
        }
        setDriver(provisionalDriver);
      } catch (error: unknown) {
        const err = error as Error & {
          response?: { data?: { message?: string }; status?: number };
        };
        message.error(
          err.response?.data?.message || err.message ||
            "Failed to load driver profile.",
        );
        setDriver(null);
        console.error("Error fetching driver data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverAndRatings();
  }, [id]); // Only 'id' as dependency

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%", // Changed from calc(100vh - 120px) to fit layout
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
        subTitle="Sorry, the driver you visited does not exist or could not be loaded."
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
        padding: "24px", // Keep padding
        background: "#fff", // Keep background
        // minHeight removed, height will be managed by parent flex item (main in layout)
        // The main tag in DashboardLayout has overflowY: "auto"
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
                // Replace Carousel with a scrollable div
                <div
                  style={{
                    maxHeight: "400px",
                    overflowY: "auto",
                    paddingRight: "10px",
                  }}
                >
                  {/* Added paddingRight for scrollbar visibility */}
                  {driver.ratings.map((rating, index) => (
                    <div
                      key={rating.ratingId || index}
                      style={{ marginBottom: "16px", cursor: "pointer" }} // Added marginBottom for spacing
                      onClick={() => handleRatingClick(rating.ratingId)}
                    >
                      <Card
                        type="inner"
                        title={`Rated by: ${
                          rating.fromUsername || "Anonymous"
                        }`}
                        extra={<Rate value={rating.ratingValue} disabled />}
                        style={{ margin: "0 auto", width: "100%" }} // Changed width to 100% for better fit
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
                </div>
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
