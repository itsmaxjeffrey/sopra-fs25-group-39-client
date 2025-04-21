//best to save this under /users/public/drivers/{userId}
"use client";
// pages/driver/[userId].tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  Carousel,
  Input,
  message,
  Rate,
  Spin,
  Row,
  Col,
  Avatar,
  Typography,
  Descriptions,
  Divider,
  Empty,
  Result,
} from "antd";
import { UserOutlined } from "@ant-design/icons"; // Import UserOutlined for default avatar
import axios from "axios";
import { getApiDomain } from "@/utils/domain"; // Import the function

const BASE_URL = getApiDomain(); // Define BASE_URL

interface User {
  username: string;
}

interface Contract {
  userId: number;
  // Extend as needed
}

interface Rating {
  fromUser: User;
  toUser: User;
  contract: Contract;
  ratingValue: number;
  flagIssues: boolean;
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

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    console.log("Driver ID:", id, typeof id); // Debugging the ID

    const fetchDriver = async () => {
      try {
        // Retrieve auth details from localStorage
        const token = localStorage.getItem("token") || "";
        const requestingUserId = localStorage.getItem("userId") || "";

        if (!token || !requestingUserId) {
          message.error("Authentication details missing. Please log in again.");
          setLoading(false);
          return;
        }

        const res = await axios.get<
          {
            userId: number;
            username: string;
            profilePicturePath: string;
            carDTO?: {
              carModel?: string;
              licensePlate?: string;
              weightCapacity?: number;
              volumeCapacity?: number;
            };
          }
        >(
          `${BASE_URL}/api/v1/users/${id}`, // Use BASE_URL
          {
            headers: {
              Authorization: token,
              UserId: requestingUserId, // Add UserId header
            },
          },
        );
        if (!res.data || !res.data.userId) {
          throw new Error("Invalid driver data");
        }

        // Map backend response to match frontend expectations
        const driverData: Driver = {
          userId: res.data.userId,
          username: res.data.username,
          profilePicture: res.data.profilePicturePath, // Map profilePicturePath to profilePicture
          ratings: [], // Assuming ratings are not provided in the backend response
          car: res.data.carDTO
            ? {
              makeModel: res.data.carDTO.carModel || "Unknown Model",
              licensePlate: res.data.carDTO.licensePlate || "Unknown Plate",
              weightCapacity:
                (res.data.carDTO.weightCapacity?.toString() ?? "0.0"),
              volumeCapacity:
                (res.data.carDTO.volumeCapacity?.toString() ?? "0.0"),
            }
            : null,
        };

        setDriver(driverData);
      } catch (error: unknown) {
        const err = error as Error & { response?: { data?: { message?: string } } };
        message.error(err.response?.data?.message || err.message || "Unknown error.");
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 120px)' }}> 
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
        extra={<Button type="primary" onClick={() => router.back()}>Go Back</Button>}
      />
    );
  }

  const averageRating = driver.ratings && driver.ratings.length > 0
    ? driver.ratings.reduce((acc, r) => acc + r.ratingValue, 0) / driver.ratings.length
    : 0;

  return (
    <div style={{ padding: '24px', background: '#fff', minHeight: 'calc(100vh - 64px)' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={24} md={8} lg={6} style={{ textAlign: 'center' }}>
          <Avatar
            size={150}
            src={driver.profilePicture && !driver.profilePicture.startsWith('http') ? `${BASE_URL}${driver.profilePicture}` : driver.profilePicture} 
            icon={!driver.profilePicture ? <UserOutlined /> : undefined}
            alt={`${driver.username}'s profile picture`}
            style={{ marginBottom: '16px', border: '4px solid #f0f0f0' }}
          />
          <Typography.Title level={3} style={{ marginBottom: '4px' }}>{driver.username}</Typography.Title>
          <Typography.Text type="secondary">Driver</Typography.Text>
          <Divider />
          <Typography.Text>Average Rating:</Typography.Text>
          <br />
          <Rate disabled allowHalf value={averageRating} style={{ marginTop: '8px', fontSize: '18px' }} />
          <Typography.Text style={{ marginLeft: '8px' }}> ({driver.ratings?.length || 0} ratings)</Typography.Text>
        </Col>

        <Col xs={24} sm={24} md={16} lg={18}>
          <Card title="Vehicle Information" bordered={false} style={{ marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
            {driver.car ? (
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Make & Model">{driver.car.makeModel}</Descriptions.Item>
                <Descriptions.Item label="License Plate">{driver.car.licensePlate}</Descriptions.Item>
                <Descriptions.Item label="Weight Capacity (kg)">{driver.car.weightCapacity}</Descriptions.Item>
                <Descriptions.Item label="Volume Capacity (m³)">{driver.car.volumeCapacity}</Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty description="No vehicle information available." />
            )}
          </Card>

          <Card title="Ratings & Comments" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
            {driver.ratings && driver.ratings.length > 0 ? (
              <Carousel autoplay dotPosition="bottom">
                {driver.ratings.map((rating, index) => ( 
                  <div key={rating.contract?.userId || index} style={{ padding: '10px' }}>
                    <Card
                      type="inner"
                      title={`Rated by: ${rating.fromUser?.username || 'Anonymous'}`} 
                      extra={<Rate value={rating.ratingValue} disabled size="small" />}
                      style={{ margin: '0 auto', width: '95%' }}
                    >
                      <Typography.Paragraph 
                        ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}
                        style={{ marginBottom: 0 }}
                      >
                        {rating.comment || "No comment provided."}
                      </Typography.Paragraph>
                    </Card>
                  </div>
                ))}
              </Carousel>
            ) : (
              <Empty description="No ratings yet." />
            )}
          </Card>
        </Col>
      </Row>

      <Row justify="center" style={{ marginTop: '32px' }}>
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
