//best to save this under /users/public/requesters/{id}
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface Requester {
  id: string;
  name: string;
  profilePictureUrl: string;
}

const RequesterProfilePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [requester, setRequester] = useState<Requester | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequesterProfile = async () => {
      try {
        const response = await fetch(`/api/v1/users/requesters/${id}`);
        if (response.ok) {
          const data = await response.json();
          setRequester(data);
        } else if (response.status === 404) {
          setError("Requester not found.");
        } else {
          setError("An error occurred while fetching the profile.");
        }
      } catch (err) {
        setError("An error occurred while fetching the profile.");
      }
    };

    fetchRequesterProfile();
  }, [id]);

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
        <h1>{requester.name}'s Requester Profile</h1>
        <img
          src={requester.profilePictureUrl}
          alt={`${requester.name}'s profile`}
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
