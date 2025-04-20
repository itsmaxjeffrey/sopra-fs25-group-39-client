"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Spin } from "antd";
import Sidebar from "@/components/sidebar/sidebar";
import LayoutWrapper from "./layout-wrapper";
import AccountTypeContext from "./AccountTypeContext";
import { Libraries, LoadScript } from "@react-google-maps/api";

const MAP_LIBRARIES: Libraries = ["places"];

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

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    console.log("UserId:", userId, "Token:", token); // Debugging log

    if (!userId || !token) return;

    axios
      .get<User>(`http://localhost:8080/api/v1/users/${userId}`, {
        headers: {
          UserId: `${userId}`,
          Authorization: `${token}`,
        },
      })
      .then((res) => {
        console.log("API Response:", res.data);
        setAccountType(res.data.userAccountType);
      })
      .catch((err) => {
        console.error("Failed to fetch user in layout:", err);
      })
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, []);

  if (loading || !accountType) {
    return (
      <div style={{ padding: 64 }}>
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
