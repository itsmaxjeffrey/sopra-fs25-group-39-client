"use client";
//probably best to create a new folder "ratings"
//then insert this page at root/ratings/{userId}
import React, { useEffect, useState } from "react";
import { Button, Image, Input, Rate, Spin, Result } from "antd"; // Removed unused 'message'
import { getApiDomain } from "@/utils/domain";
import { useParams, useRouter } from "next/navigation";
// Removed unused import 'parseAppSegmentConfig'

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
  fromUserId: number; // Changed from nested object
  toUserId: number;   // Changed from nested object
  contractId: number; // Changed from nested object
  ratingValue: number;
  flagIssues: boolean; // Corrected from 'false' literal type to boolean
  comment: string;
}

const RatingPage: React.FC = () => {
  const [rating, setRating] = useState<Rating | null>(null);
  const [user, setUser] = useState<User | null>(null); // This will be the 'fromUser'
  const [toUser, setToUser] = useState<User | null>(null); // New state for the 'toUser' (rated user)
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Added loading state
  const [error, setError] = useState<string | null>(null);
  const BASE_URL = getApiDomain();
  const router = useRouter();
  const params = useParams(); // params is the object from useParams()
  const ratingId = params.id as string; // 'id' is the key for the dynamic segment

  useEffect(() => {
    // Helper function to fetch user data (can be reused for fromUser and toUser)
    const fetchUserDetails = async (userId: number, token: string, requestingUserId: string, setUserState: React.Dispatch<React.SetStateAction<User | null>>) => {
      if (!userId) {
        console.warn("User ID is missing for fetching user data.");
        setUserState(null); // Ensure state is null if ID is missing
        return;
      }
      try {
        const response = await fetch(
          `${BASE_URL}/api/v1/users/${userId}`,
          {
            headers: {
              Authorization: token,
              UserId: requestingUserId,
            },
          },
        );
        if (response.ok) {
          const userData: User = await response.json();
          setUserState(userData);
        } else if (response.status === 404) {
          console.warn(`User not found: ${userId}`);
          setUserState(null);
        } else {
          console.error(`An error occurred while fetching user details for ${userId}. Status: ${response.status}`);
          setUserState(null);
        }
      } catch (err) {
        console.error("Error fetching user details for userId " + userId + ":", err);
        setUserState(null);
      }
    };

    // Helper function to fetch contract data
    const fetchContractData = async (contractId: number, token: string, requestingUserId: string) => {
      if (!contractId) {
        console.warn("Contract ID is missing for fetching contract data.");
        return;
      }
      try {
        const response = await fetch(
          `${BASE_URL}/api/v1/contracts/${contractId}`,
          {
            headers: {
              Authorization: token,
              UserId: requestingUserId,
            },
          },
        );
        if (response.ok) {
          const contractData: Contract = await response.json();
          setContract(contractData);
        } else if (response.status === 404) {
          console.warn(`Contract not found: ${contractId}`);
        } else {
          console.error(`An error occurred while fetching contract details for ${contractId}. Status: ${response.status}`);
        }
      } catch (err) {
        console.error("Error fetching contract details:", err);
      }
    };

    // Main data fetching function
    const fetchAllData = async () => {
      setLoading(true);
      setError(null); // Reset error state at the beginning
      // Reset individual states
      setRating(null);
      setUser(null);
      setToUser(null);
      setContract(null);

      if (!ratingId) {
        setError("Rating ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token") || "";
        const requestingUserId = localStorage.getItem("userId") || "";

        // Fetch Rating
        const ratingResponse = await fetch(`${BASE_URL}/api/v1/ratings/${ratingId}`, {
          headers: { Authorization: token, UserId: requestingUserId },
        });

        if (!ratingResponse.ok) {
          if (ratingResponse.status === 404) {
            setError("Rating not found.");
          } else {
            const errorData = await ratingResponse.json().catch(() => ({})); // Try to parse error
            setError(`An error occurred while fetching the rating details: ${errorData.message || ratingResponse.statusText}`);
          }
          setLoading(false); 
          return; 
        }
        
        const responseData = await ratingResponse.json();
        // According to the log, the rating object is nested
        const fetchedRatingData: Rating = responseData.rating; 
        console.log("Fetched Rating Data (actual):", fetchedRatingData);

        if (!fetchedRatingData || typeof fetchedRatingData !== 'object') {
            setError("Invalid rating data structure received from server.");
            setLoading(false);
            return;
        }
        
        setRating(fetchedRatingData);

        // Check if essential IDs exist
        if (typeof fetchedRatingData.fromUserId !== 'number') {
          console.error("Fetched rating data is missing 'fromUserId'.", fetchedRatingData);
          setError("Rating data is incomplete: missing 'fromUserId'.");
          setLoading(false);
          return;
        }
        if (typeof fetchedRatingData.toUserId !== 'number') {
          console.error("Fetched rating data is missing 'toUserId'.", fetchedRatingData);
          setError("Rating data is incomplete: missing 'toUserId'.");
          setLoading(false);
          return;
        }
        if (typeof fetchedRatingData.contractId !== 'number') {
          console.error("Fetched rating data is missing 'contractId'.", fetchedRatingData);
          setError("Rating data is incomplete: missing 'contractId'.");
          setLoading(false);
          return;
        }

        // Fetch From User, To User, and Contract data
        await Promise.all([
          fetchUserDetails(fetchedRatingData.fromUserId, token, requestingUserId, setUser),
          fetchUserDetails(fetchedRatingData.toUserId, token, requestingUserId, setToUser),
          fetchContractData(fetchedRatingData.contractId, token, requestingUserId),
        ]);

      } catch (err: any) {
        console.error("Error in fetchAllData:", err);
        setError(`An unexpected error occurred: ${err.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [ratingId, BASE_URL]); // Corrected dependencies

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title="Failed to Load Rating Details"
        subTitle={error}
        extra={
          <Button type="primary" onClick={() => router.back()}>
            Go Back
          </Button>
        }
      />
    );
  }

  if (!rating) {
    // This case handles if rating is null after loading and no error (e.g. API returned 200 with null/empty)
    // Or if the nested 'rating' object was missing from the response.
    return (
        <Result
            status="warning"
            title="No Rating Data Available"
            subTitle="The rating data could not be loaded or does not exist."
            extra={
                <Button type="primary" onClick={() => router.back()}>
                    Go Back
                </Button>
            }
        />
    );
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
      <h1>{user?.username || "Rater (Unknown)"}&apos;s Rating</h1>
      <Image
        src={user?.profilePicturePath || "/default-avatar.png"} 
        alt={`${user?.username || "Rater"}'s Profile`}
        style={{
          borderRadius: "50%",
          width: "150px",
          height: "150px",
          objectFit: "cover",
          marginBottom: "20px",
        }}
      />
      <h2>Rated Driver: {toUser?.username || "Driver (Unknown)"}</h2>
      <h3>Rating of Driver:</h3>
      <Rate value={rating.ratingValue} disabled />

      <h3>Contract Information</h3>
      <Input.TextArea
        value={contract?.contractDescription || "Contract details not available."} // Added fallback and optional chaining
        readOnly
        autoSize={{ minRows: 3, maxRows: 6 }}
        style={{
          width: "80%",
          maxWidth: "600px",
          marginBottom: "20px",
          resize: "none",
        }}
      />
      <h3>Comment</h3>
      <Input.TextArea
        value={rating.comment || "No comment provided."} // Added fallback
        readOnly
        autoSize={{ minRows: 3, maxRows: 6 }}
        style={{
          width: "80%",
          maxWidth: "600px",
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
