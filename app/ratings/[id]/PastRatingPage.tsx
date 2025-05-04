//probably best to create a new folder "ratings"
//then insert this page at root/ratings/{userId}
import React, { useEffect, useState } from "react";
import { Button, Image, Input, Rate } from "antd";
import "antd/dist/antd.css";
import { getApiDomain } from "@/utils/domain";
import { useRouter } from "next/router";

interface User {
  userId: number;
  username: string;
  profilePicturePath: string;
}

interface Contract {
  contractId: number;
  title: string;
  contractDescription: string;
  // Extend as needed
}

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

const RatingPage: React.FC = () => {
  const [rating, setRating] = useState<Rating | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const BASE_URL = getApiDomain();
  const router = useRouter();
  const { ratingId } = router.query;

  useEffect(() => {
    const fetchRating = async () => {
      if (!ratingId) {
        // ratingId might be undefined during the initial render
        setError("Rating ID is missing.");
        return;
      }

      try {
        const token = localStorage.getItem("token") || "";
        const requestingUserId = localStorage.getItem("userId") || "";
        // Perform an actual API call
        const response = await fetch(`${BASE_URL}/api/v1/ratings/${ratingId}`, { // Pass options object as second argument
          headers: {
            Authorization: token,
            UserId: requestingUserId,
          },
        });
        if (response.ok) {
          const data: Rating = await response.json();
          setRating(data);
        } else if (response.status === 404) {
          setError("Rating not found.");
        } else {
          setError("An error occurred while fetching the rating details.");
        }
      } catch (err) {
        console.error("Error fetching the rating details:", err);
        setError("An error occurred while fetching the rating details.");
      }
    };

    const fetchUser = async () => {
      if (!rating.fromUser.userId) {
        setError("User ID is missing.");
        return;
      }
      try {
        const token = localStorage.getItem("token") || "";
        const requestingUserId = localStorage.getItem("userId") || "";

        const response = await fetch(
          `${BASE_URL}/api/v1/users/${rating.fromUser.userId}`,
          { // Pass options object as second argument
            headers: {
              Authorization: token,
              UserId: requestingUserId,
            },
          },
        );
        if (response.ok) {
          const data: User = await response.json();
          setUser(data);
        } else if (response.status === 404) {
          setError("User not found.");
        } else {
          setError("An error occurred while fetching the user details.");
        }
      } catch (err) {
        console.error("Error fetching the user details:", err);
        setError("An error occurred while fetching the user details.");
      }
    };

    const fetchContract = async () => {
      if (!rating.contract.contractId) {
        setError("Contract ID is missing.");
        return;
      }
      try {
        const token = localStorage.getItem("token") || "";
        const requestingUserId = localStorage.getItem("userId") || "";

        const response = await fetch(
          `${BASE_URL}/api/v1/contracts/${rating.contract.contractId}`,
          { // Pass options object as second argument
            headers: {
              Authorization: token,
              UserId: requestingUserId,
            },
          },
        );
        if (response.ok) {
          const data: Contract = await response.json();
          setContract(data);
        } else if (response.status === 404) {
          setError("Contract not found.");
        } else {
          setError("An error occurred while fetching the contract details.");
        }
      } catch (err) {
        console.error("Error fetching the contract details:", err);
        setError("An error occurred while fetching the contract details.");
      }
    };

    fetchRating();
    fetchUser();
    fetchContract();
  }, [ratingId, BASE_URL, rating.contract.contractId, rating.fromUser.userId]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!rating) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <h1>{rating.fromUser.username}&apos;s Rating</h1>
      <Image
        src={user.profilePicturePath}
        alt="Requester Profile"
        style={{
          borderRadius: "50%",
          width: "150px",
          height: "150px",
          objectFit: "cover",
        }}
      />
      <h2>Rated Driver: {rating.toUser.username}</h2>
      <h3>Rating of Driver:</h3>
      <Rate value={rating.ratingValue} disabled />

      <h3>Contract Information</h3>
      <Input.TextArea
        value={contract.contractDescription}
        readOnly
        style={{
          width: "80%",
          marginBottom: "20px",
          resize: "none",
        }}
      />
      <h3>Comment</h3>
      <Input.TextArea
        value={rating.comment}
        readOnly
        style={{
          width: "80%",
          marginBottom: "20px",
          resize: "none",
        }}
      />
      <Button
        type="primary"
        onClick={() => router.back()}
        style={{ marginTop: "20px" }}
      >
        Return
      </Button>
    </div>
  );
};

export default RatingPage;
