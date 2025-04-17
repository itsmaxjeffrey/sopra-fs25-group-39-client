//best to save this under /users/public/drivers/{id}
"use client";
// pages/driver/[id].tsx
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Card, Carousel, Input, message, Rate, Spin } from "antd";
import axios from "axios";
import Image from "next/image";

interface User {
  username: string;
}

interface Contract {
  id: number;
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
  car: Car;
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
        const res = await axios.get(`http://localhost:5001/api/v1/users/${id}`);
        if (!res.data || !res.data.user || !res.data.user.id) {
          throw new Error("Invalid driver data");
        }
        setDriver(res.data.user);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          message.error(
            error.response?.data?.message || "Could not fetch driver profile.",
          );
        } else {
          message.error("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, [id]);

  const averageRating = driver?.ratings && driver.ratings.length > 0
    ? driver.ratings.reduce((acc, r) => acc + r.ratingValue, 0) /
      driver.ratings.length
    : 0;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex h-screen items-center justify-center">
        <h1>Driver not found.</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white p-10 gap-10">
      {/* Header Row */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold mb-2">
            {driver.username}&apos;s Driver Profile
          </h1>
          <div className="text-lg mb-2">Avg. Rating of Driver:</div>
          <Rate disabled allowHalf value={averageRating} className="text-yellow-500 text-2xl" />

          <div>
            {/* Profile Picture */}
            {driver.profilePicture ? (
              <Image
                src={driver.profilePicture}
                alt="Driver"
                width={150}
                height={150}
                className="rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  backgroundColor: "gray",
                }}
              />
            )}

            {/* Vehicle Info */}
            {driver.car
              ? (
                <div className="flex flex-col gap-4">
                  <Input
                    addonBefore="Vehicle Make & Model"
                    value={driver.car.makeModel}
                    disabled
                  />
                  <Input
                    addonBefore="License Plate"
                    value={driver.car.licensePlate}
                    disabled
                  />
                  <Input
                    addonBefore="Weight Capacity"
                    value={driver.car.weightCapacity}
                    disabled
                  />
                  <Input
                    addonBefore="Volume Capacity"
                    value={driver.car.volumeCapacity}
                    disabled
                  />
                </div>
              )
              : <div>No vehicle information available.</div>}
          </div>

          {/* Ratings Section */}
          <div className="mt-4">
        <h3 className="text-xl font-semibold mb-4">Comments</h3>
            {driver.ratings && driver.ratings.length > 0 ? (
              <Carousel autoplay>
                {driver.ratings.map((rating) => (
                  <Card
                    key={rating.contract.id}
                    title={`Rated by: ${rating.fromUser.username}`}
                    extra={<Rate value={rating.ratingValue} disabled />}
                    style={{
                      cursor: "pointer",
                      border: "1px solid #f0f0f0",
                      borderRadius: "8px",
                      margin: "0 auto",
                      width: "80%",
                    }}
                    onClick={() => router.push(`/ratings/${rating.contract.id}`)}
                  >
                    <p>{rating.comment || "No comment provided."}</p>
                  </Card>
                ))}
              </Carousel>
            ) : (
              <p>No ratings yet.</p>
            )}
          </div>

          {/* Return Button */}
          <div className="flex justify-center mt-4">
            <Button
              type="primary"
              className="bg-black text-white px-8 py-2 text-lg rounded hover:bg-gray-800"
              onClick={() => router.back()}
            >
              Return
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
