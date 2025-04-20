"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Segmented, Typography } from "antd";
import Login from "./components/login";
import Driver from "./components/driver";
import styles from "./login.module.css";
import Customer from "./components/customer";

// const BASE_URL = process.env.NODE_ENV === "production"
//   ? "https://sopra-fs25-group-39-client.vercel.app"
//   : "http://localhost:8080";

const BASE_URL = "http://localhost:8080";

const { Title } = Typography;

const AuthPage = () => {
  const router = useRouter();

  useEffect(() => {
    const refreshAuthToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          throw new Error("Failed to refresh token");
        }

        router.push("/dashboard");
      } catch (error) {
        console.error("Error refreshing token:", error);
        localStorage.removeItem("token");
      }
    };

    refreshAuthToken();
  }, [router]);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<
    "driver" | "customer" | null
  >(null);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContainer}>
        <Segmented
          block
          options={[
            { label: "Login", value: "login" },
            { label: "Register", value: "register" },
          ]}
          value={mode}
          onChange={(val) => setMode(val as "login" | "register")}
          className={styles.segment}
        />

        {mode === "login" && <Login />}

        {mode === "register" && !selectedRole && (
          <div style={{ textAlign: "center" }}>
            <Title level={4}>What would you like to register for?</Title>
            <div
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                marginTop: 24,
              }}
            >
              <Button
                type="default"
                size="large"
                style={{ padding: "12px 24px" }}
                onClick={() =>
                  setSelectedRole("driver")}
              >
                I am a driver 🚚
              </Button>
              <Button
                type="default"
                size="large"
                style={{ padding: "12px 24px" }}
                onClick={() => setSelectedRole("customer")}
              >
                I am a requester 🏠
              </Button>
            </div>
          </div>
        )}

        {mode === "register" && selectedRole === "driver" && (
          <>
            <Button
              type="default"
              onClick={() => setSelectedRole(null)}
              style={{ marginBottom: 24 }}
            >
              ← Back to the selection
            </Button>
            <Driver />
          </>
        )}

        {mode === "register" && selectedRole === "customer" && (
          <>
            <Button
              type="default"
              onClick={() => setSelectedRole(null)}
              style={{ marginBottom: 24 }}
            >
              ← Back to the selection
            </Button>
            <Customer />
          </>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
