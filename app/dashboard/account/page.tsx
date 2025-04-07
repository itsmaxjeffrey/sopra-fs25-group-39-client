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

const AccountPage = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("id");
    const token = localStorage.getItem("token");

    if (!id || !token) {
      setError("No user ID or token found");
      setLoading(false);
      return;
    }

    axios
      .get(`http://localhost:5001/api/v1/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setUserData(res.data.user);
        setEditedData(res.data.user);
        localStorage.setItem("token", res.data.token);
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
          ...(userData.accountType === "driver"
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
