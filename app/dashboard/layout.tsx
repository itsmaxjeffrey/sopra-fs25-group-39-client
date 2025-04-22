"use client";

import '@ant-design/v5-patch-for-react-19';
import { useEffect, useState } from "react";
import axios from "axios";
import { Spin } from "antd";
import Sidebar from "@/components/sidebar/sidebar";
import LayoutWrapper from "./layout-wrapper";
import AccountTypeContext from "./AccountTypeContext";
import { Libraries, LoadScript } from "@react-google-maps/api";
import { getApiDomain } from "@/utils/domain"; // Import the function
import { useRouter } from 'next/navigation'; // Import useRouter

const MAP_LIBRARIES: Libraries = ["places"];
const BASE_URL = getApiDomain(); // Define BASE_URL

interface User {
  id: string;
  name: string;
  email: string;
  token: string;
  userAccountType: string;
  profilePicturePath?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accountType, setAccountType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Get router instance

  useEffect(() => {
    const fetchUserAccountType = async () => {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      console.log("UserId:", userId, "Token:", token); // Debugging log

      // Check for token/userId first and redirect if missing
      if (!userId || !token) {
        setLoading(false); // Stop loading
        router.push('/login'); // Redirect to login
        return; // Stop execution here
      }

      try {
        const response = await axios.get<User>(`${BASE_URL}/api/v1/users/${userId}`, {
          headers: {
            UserId: `${userId}`,
            Authorization: `${token}`,
          },
          withCredentials: true,
        });
        console.log("API Response:", response.data);
        setAccountType(response.data.userAccountType);
      } catch (error) {
        console.error("Failed to fetch user in layout:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAccountType();
  }, [router]); // Add router to dependency array

  // Render loading spinner while loading OR if redirecting (accountType might still be null briefly)
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // If not loading and accountType is still null (e.g., fetch failed or redirect happened),
  // render null or a minimal layout to avoid rendering the full dashboard momentarily before redirect completes.
  if (!accountType) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={MAP_LIBRARIES}
    >
      <AccountTypeContext.Provider value={accountType}>
        <LayoutWrapper>
          <div
            style={{
              display: "flex",
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <Sidebar accountType={accountType} />
            <main
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              {children}
            </main>
          </div>
        </LayoutWrapper>
      </AccountTypeContext.Provider>
    </LoadScript>
  );
}
