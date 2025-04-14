//probably best to create a new folder "ratings"
//then insert this page at root/ratings/{id}
import React, { useEffect, useState } from "react";
import { Button, Image, Input, Rate } from "antd";
import "antd/dist/antd.css";

interface User {
  username: string;
  profilePictureUrl: string;
}

interface Contract {
  id: number;
  description: string;
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

const RatingPage: React.FC = () => {
  const [rating, setRating] = useState<Rating | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        // Perform an actual API call
        const response = await fetch(`/api/v1/ratings/TODO`); // Update to your actual API endpoint
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

    fetchRating();
  }, [rating?.contract.id]);

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
        src={rating.fromUser.profilePictureUrl}
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
        value={rating.contract.description}
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
      <Button type="primary" style={{ marginTop: "20px" }}>
        Return
      </Button>
    </div>
  );
};

export default RatingPage;
