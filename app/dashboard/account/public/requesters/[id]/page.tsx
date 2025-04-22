"use client";
//best to save this under /users/public/requesters/{userId}
import '@ant-design/v5-patch-for-react-19';
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Image } from "antd";
import { getApiDomain } from "@/utils/domain"; // Import the function

const BASE_URL = getApiDomain(); // Define BASE_URL

interface Requester {
  username: string;
  userId: string;
  name: string;
  profilePictureUrl: string;
}

const RequesterProfilePage: React.FC = () => {
  const { userId } = useParams();
  const [requester, setRequester] = useState<Requester | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequesterProfile = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/v1/users/${userId}`, // Use BASE_URL
        );
        if (response.ok) {
          const data = await response.json();
          setRequester(data.user);
        } else if (response.status === 404) {
          setError("Requester not found.");
        } else {
          setError("An error occurred while fetching the profile.");
        }
      } catch (err) {
        console.error("Error fetching the requester profile:", err);
        setError("An error occurred while fetching the profile.");
      }
    };

    fetchRequesterProfile();
  }, [userId]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!requester) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1>{requester.username}&apos;s Requester Profile</h1>
        <Image
          src={requester.profilePictureUrl}
          alt={`${requester.username}'s profile`}
          style={{
            borderRadius: "50%",
            width: "150px",
            height: "150px",
            objectFit: "cover",
          }}
        />
        <button
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Return
        </button>
      </main>
    </div>
  );
};

export default RequesterProfilePage;
