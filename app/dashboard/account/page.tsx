"use client";
import React, { useEffect, useState } from "react";
import { Spin, Tabs, Typography } from "antd";
import axios from "axios";
import styles from "./Account.module.css";
import UserDataTab from "./Tabs/UserData";
import VehicleDataTab from "./Tabs/VehicleData";
import ActionsTab from "./Tabs/Actions";
import { getApiDomain } from "@/utils/domain"; // Import the function
import '@ant-design/v5-patch-for-react-19';

/* eslint-disable @typescript-eslint/no-explicit-any */

const { Title } = Typography;

const BASE_URL = getApiDomain(); // Define BASE_URL

// Define the structure for Car data
interface CarData {
  carModel?: string;
  licensePlate?: string;
  weightCapacity?: number;
  volumeCapacity?: number;
  // Add other car properties if they exist
}

interface User {
  id: string;
  name: string;
  email: string;
  token: string;
  userAccountType: string;
  profilePicturePath?: string;
  carDTO?: CarData; // Add carDTO as optional
  car?: CarData; // Add car as optional (for normalized data)
}

const AccountPage = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (!userId || !token) {
        setError("No user ID or token found");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/v1/users/${userId}`, {
          headers: {
            UserId: `${userId}`,
            Authorization: `${token}`,
          },
        });
        // Use the updated User interface for type assertion
        const user = response.data as User;
        console.log("Fetched user data:", user); // Log fetched data

        // Normalize fetched data: ensure car details are under 'car' key
        // Explicitly type normalizedUser to allow for both car and carDTO initially
        const normalizedUser: User = { ...user }; 
        if (normalizedUser.carDTO) {
            normalizedUser.car = { ...normalizedUser.carDTO }; // Spread to create a new object
            delete normalizedUser.carDTO;
            console.log("Normalized user data:", normalizedUser); // Log normalized data
        }

        setUserData({ // Use normalized data for userData state
          ...normalizedUser,
          profilePicturePath: normalizedUser.profilePicturePath, // Keep this specific handling if needed
        });
        setEditedData(normalizedUser); // Use normalized data for editedData state
        localStorage.setItem("token", normalizedUser.token); // Use token from normalized data
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
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
