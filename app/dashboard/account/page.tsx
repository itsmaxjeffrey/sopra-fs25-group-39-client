"use client";
import React, { useEffect, useState } from "react";
import { Spin, Tabs, Typography } from "antd";
import axios from "axios";
import styles from "./Account.module.css";
import UserDataTab from "./Tabs/UserData";
import VehicleDataTab from "./Tabs/VehicleData";
import ActionsTab from "./Tabs/Actions";

/* eslint-disable @typescript-eslint/no-explicit-any */

const { Title } = Typography;

const BASE_URL = process.env.NODE_ENV === "production"
  ? "https://sopra-fs25-group-39-client.vercel.app"
  : "http://localhost:8080";

const AccountPage = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
  
    if (!userId || !token) {
      setError("No user ID or token found");
      setLoading(false);
      return;
    }
  
    axios
      .get(`http://localhost:8080/api/v1/users/${userId}`, {
        headers: {
          UserId: `${userId}`,
          Authorization: `${token}`,
        },
      })
      .then((res) => {
        const user = res.data;
        console.log(user);
        setUserData({
          ...user,
          profilePicturePath: user.profilePicturePath,
        });
        setEditedData(user);
        localStorage.setItem("token", user.token);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (userData) setEditedData(userData);
  }, [userData]);

  if (loading) {
    return (
      <div className={styles.center}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) return <div className={styles.center}>Error: {error}</div>;
  if (!userData) return null;

  return (
    <div className={styles.container}>
      <Title level={3}>Account</Title>
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: "Personal Data",
            children: (
              <UserDataTab
                editedData={editedData}
                userData={userData}
                setEditedData={setEditedData}
                changed={changed}
                setChanged={setChanged}
              />
            ),
          },
          ...(userData.userAccountType === "DRIVER"
            ? [
              {
                key: "2",
                label: "Vehicle Info",
                children: (
                  <VehicleDataTab
                    editedData={editedData}
                    userData={userData}
                    setEditedData={setEditedData}
                    changed={changed}
                    setChanged={setChanged}
                  />
                ),
              },
            ]
            : []),
          {
            key: "3",
            label: "Actions",
            children: <ActionsTab />,
          },
        ]}
      />
    </div>
  );
};

export default AccountPage;
