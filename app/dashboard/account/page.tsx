"use client";
import React, { useEffect, useState } from "react";
import { Tabs, Spin, Typography, Input, DatePicker, Button } from "antd";
import dayjs from "dayjs";
import axios from "axios";
import styles from "./Account.module.css";

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
              <div className={styles.tabContent}>
                <Title level={5}>Personal Information</Title>
                <div className={styles.formGrid}>
                  <div>
                    <label>First Name</label>
                    <Input
                      value={editedData?.firstName}
                      onChange={(e) => {
                        setChanged(true);
                        setEditedData({
                          ...editedData,
                          firstName: e.target.value,
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label>Last Name</label>
                    <Input
                      value={editedData?.lastName}
                      onChange={(e) => {
                        setChanged(true);
                        setEditedData({
                          ...editedData,
                          lastName: e.target.value,
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label>Username</label>
                    <Input
                      value={editedData?.username}
                      onChange={(e) => {
                        setChanged(true);
                        setEditedData({
                          ...editedData,
                          username: e.target.value,
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label>Birthdate</label>
                    <DatePicker
                      style={{ width: "100%" }}
                      value={
                        editedData?.birthdate
                          ? dayjs(editedData.birthdate)
                          : null
                      }
                      onChange={(date) => {
                        setChanged(true);
                        setEditedData({
                          ...editedData,
                          birthdate: date?.toISOString(),
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label>Email</label>
                    <Input
                      value={editedData?.email}
                      onChange={(e) => {
                        setChanged(true);
                        setEditedData({ ...editedData, email: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <label>Phone</label>
                    <Input
                      value={editedData?.phone}
                      onChange={(e) => {
                        setChanged(true);
                        setEditedData({ ...editedData, phone: e.target.value });
                      }}
                    />
                  </div>
                </div>

                <div className={styles.actions}>
                  <Button type="primary" disabled={!changed}>
                    Save Changes
                  </Button>
                  {changed && (
                    <Button
                      onClick={() => {
                        setEditedData(userData);
                        setChanged(false);
                      }}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            ),
          },
          ...(userData.accountType === "driver"
            ? [
                {
                  key: "2",
                  label: "Vehicle Info",
                  children: (
                    <div className={styles.tabContent}>
                      <Title level={5}>Vehicle Information</Title>
                      <div className={styles.formGrid}>
                        <div>
                          <label>Vehicle Model</label>
                          <Input
                            value={editedData?.vehicleModel}
                            onChange={(e) => {
                              setChanged(true);
                              setEditedData({
                                ...editedData,
                                vehicleModel: e.target.value,
                              });
                            }}
                          />
                        </div>
                        <div>
                          <label>License Plate</label>
                          <Input
                            value={editedData?.licensePlate}
                            onChange={(e) => {
                              setChanged(true);
                              setEditedData({
                                ...editedData,
                                licensePlate: e.target.value,
                              });
                            }}
                          />
                        </div>
                        <div>
                          <label>Weight Capacity</label>
                          <Input
                            value={editedData?.weightCapacity}
                            onChange={(e) => {
                              setChanged(true);
                              setEditedData({
                                ...editedData,
                                weightCapacity: e.target.value,
                              });
                            }}
                          />
                        </div>
                        <div>
                          <label>Volume Capacity</label>
                          <Input
                            value={editedData?.volumeCapacity}
                            onChange={(e) => {
                              setChanged(true);
                              setEditedData({
                                ...editedData,
                                volumeCapacity: e.target.value,
                              });
                            }}
                          />
                        </div>
                      </div>

                      <div className={styles.actions}>
                        <Button type="primary" disabled={!changed}>
                          Save Changes
                        </Button>
                        {changed && (
                          <Button
                            onClick={() => {
                              setEditedData(userData);
                              setChanged(false);
                            }}
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
};

export default AccountPage;
