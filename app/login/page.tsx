"use client";

import "@ant-design/v5-patch-for-react-19";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Segmented, Typography } from "antd";
import Login from "./components/login";
import Driver from "./components/driver";
import styles from "./login.module.css";
import Requester from "./components/requester";

const { Title } = Typography;

const AuthPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Removed token refresh logic as the endpoint doesn't exist
    const token = localStorage.getItem("token");
    if (token) {
      // If a token exists, assume it's valid for now and redirect to dashboard
      // Proper validation should happen on API calls within the dashboard
      router.push("/dashboard");
    }
  }, [router]);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<
    "driver" | "requester" | null
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
                onClick={() => setSelectedRole("requester")}
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

        {mode === "register" && selectedRole === "requester" && (
          <>
            <Button
              type="default"
              onClick={() => setSelectedRole(null)}
              style={{ marginBottom: 24 }}
            >
              ← Back to the selection
            </Button>
            <Requester />
          </>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
