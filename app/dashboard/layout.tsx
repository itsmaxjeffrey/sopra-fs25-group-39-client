"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Spin } from "antd";
import Sidebar from "@/components/sidebar/sidebar";
import LayoutWrapper from "./layout-wrapper";
import { createContext } from "react";

export const AccountTypeContext = createContext<string | null>(null);

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
    <AccountTypeContext.Provider value={accountType}>
      <LayoutWrapper>
        <div style={{ display: "flex" }}>
          <Sidebar accountType={accountType} />
          <main style={{ flex: 1, overflowX: "hidden" }}>{children}</main>
        </div>
      </LayoutWrapper>
    </AccountTypeContext.Provider>
  );
}
