//best to save this under /users/public/drivers/{id}

// pages/driver/[id].tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
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
  const { id } = router.query;

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchDriver = async () => {
      try {
        const res = await axios.get(`/api/v1/users/drivers/${id}`);
        setDriver(res.data);
      } catch (error) {
        message.error("Could not fetch driver profile.");
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

  return (
    <div className="flex h-screen bg-white">
      {/* Main Content */}
      <div className="flex-1 p-8">
        {loading ? <Spin size="large" /> : driver
          ? (
            <div>
              <h1 className="text-3xl font-semibold mb-2">
                {driver.username}'s Driver Profile
              </h1>
              <div className="text-lg mb-4">Avg. Rating of Driver:</div>
              <Rate disabled allowHalf value={averageRating} className="mb-6" />

              <div className="flex gap-8 mb-8 items-start">
                {/* Profile Picture */}
                <Image
                  src={driver.profilePicture}
                  alt="Driver"
                  width={150}
                  height={150}
                  className="rounded-full object-cover"
                />

                {/* Vehicle Info */}
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
              </div>

              {/* Comments Section */}
              <div style={{ marginTop: "20px", width: "80%" }}>
                <h3>Comments</h3>
                <Carousel autoplay>
                  {driver.comments.map((comment) => (
                    <Card
                      key={comment.id}
                      title={comment.commenterName}
                      extra={<Rate value={comment.rating} disabled />}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        router.push(`/ratings/${rating.contract.id}`)}
                    >
                      <p>{comment.comment}</p>
                    </Card>
                  ))}
                </Carousel>
              </div>

              {/* Return Button */}
              <div className="mt-8">
                <Button type="primary" onClick={() => router.back()}>
                  Return
                </Button>
              </div>
            </div>
          )
          : <div>Driver not found.</div>}
      </div>
    </div>
  );
}
