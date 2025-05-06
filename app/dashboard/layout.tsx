"use client";

import "@ant-design/v5-patch-for-react-19";
import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios"; // Import AxiosError
import { Spin } from "antd";
import Sidebar from "@/components/sidebar/sidebar";
import LayoutWrapper from "./layout-wrapper";
import AccountTypeContext from "./AccountTypeContext";
import { Libraries, LoadScript } from "@react-google-maps/api";
import { getApiDomain } from "@/utils/domain"; // Import the function
import { useRouter } from "next/navigation"; // Import useRouter

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
        router.push("/login"); // Redirect to login
        return; // Stop execution here
      }

      try {
        const response = await axios.get<User>(
          `${BASE_URL}/api/v1/users/${userId}`,
          {
            headers: {
              UserId: `${userId}`,
              Authorization: `${token}`,
            },
            withCredentials: true,
          },
        );
        console.log("API Response:", response.data);
        setAccountType(response.data.userAccountType);
        setLoading(false); // Stop loading on success
      } catch (error) {
        console.error("Failed to fetch user in layout:", error);
        // Check if it's an Axios error and specifically an auth error (401 or 403)
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          if (
            axiosError.response?.status === 401 ||
            axiosError.response?.status === 403
          ) {
            console.log(
              "Authentication error detected, clearing storage and redirecting to login.",
            );
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            router.push("/login"); // Redirect to login on auth error
            setLoading(false); // Ensure loading state is updated before returning
            return; // Stop further execution in this effect
          }
        }
        // Handle other errors (e.g., network error) - maybe show an error message or retry
        // For now, just stop loading and potentially leave the user on a broken dashboard state or redirect
        setLoading(false); // Stop loading on other errors too
      }
      // Removed the finally block as setLoading(false) is handled in try/catch
    };

    fetchUserAccountType();
  }, [router]); // Add router to dependency array

  // Render loading spinner while loading OR if redirecting (accountType might still be null briefly)
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // If not loading and accountType is still null (e.g., fetch failed without redirect, or redirect is in progress),
  // render null or a minimal layout. Redirect should handle the final navigation.
  if (!accountType) {
    // This state might be reached briefly during redirect or if a non-auth error occurred.
    // Returning null or a minimal component is safer than rendering the full dashboard.
    return null; // Or return a specific error/fallback component
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
