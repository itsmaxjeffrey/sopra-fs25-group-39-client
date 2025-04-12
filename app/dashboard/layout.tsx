"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Spin } from "antd";
import Sidebar from "@/components/sidebar/sidebar";
import LayoutWrapper from "./layout-wrapper";
import { createContext } from "react";
import { Libraries, LoadScript } from "@react-google-maps/api";

export const AccountTypeContext = createContext<string | null>(null);
const MAP_LIBRARIES: Libraries = ["places"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accountType, setAccountType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("id");
    const token = localStorage.getItem("token");

    if (!id || !token) return;

    axios
      .get(`http://localhost:5001/api/v1/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setAccountType(res.data.user.accountType);
      })
      .catch((err) => {
        console.error("Failed to fetch user in layout:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
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
