"use client";
import React, { useEffect } from "react";
import { Button, DatePicker, Image, Input, Typography, Upload } from "antd";
import { CameraOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import styles from "../Account.module.css";

const BASE_URL = process.env.NODE_ENV === "production"
  ? "https://sopra-fs25-group-39-client.vercel.app"
  : "http://localhost:8080";

const { Title } = Typography;

const UserDataTab = ({
  editedData,
  userData,
  setEditedData,
  changed,
  setChanged,
}: any) => {
  const [imageKey, setImageKey] = React.useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) return;

    fetch(`${BASE_URL}/api/v1/users/${userId}`, {
      method: "GET",
      headers: {
        UserId: `${userId}`,
        Authorization: `${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched user instance from backend:", data); 
        setEditedData(data);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, []);

  const handleUpload = (file: any) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const formData = new FormData();
    formData.append("file", file);

    if (!token || !userId) return;

    fetch(
      `${BASE_URL}/api/v1/files/update/profile/${
        editedData.profilePicturePath.split("/").pop()
      }`,
      {
        method: "PUT",
        headers: {
          UserId: `${userId}`,
          Authorization: `${token}`,
        },
        body: formData,
      },
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setEditedData({
          ...editedData,
          profilePicturePath: data.profilePicturePath,
        });
        setImageKey((prev) => prev + 1); // Trigger re-render of image
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
      });

    return false; // Prevent default upload behavior
  };

  const handleSave = () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) return;

    fetch(`${BASE_URL}/api/v1/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        UserId: `${userId}`,
        Authorization: `${token}`,
      },
      body: JSON.stringify(editedData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("User data saved successfully:", data);
        setChanged(false);
      })
      .catch((error) => {
        console.error("Error saving user data:", error);
      });
  };

  return (
    <div className={styles.tabContent}>
      <Title level={5}>Personal Information</Title>
      <div className={styles.profilePicSection}>
        {editedData?.profilePicturePath ? (
          <Image
            width={100}
            height={100}
            src={`${BASE_URL}/api/v1/files/download?filePath=${editedData.profilePicturePath}`}
            // src={`${BASE_URL}/api/v1/files/download`}
            alt="Profile"
            style={{ borderRadius: "50%", objectFit: "cover" }}
            // fallback="/placeholder-profile.png"
          />
        ) : (
          <div className={styles.profilePicPlaceholder}>
            <CameraOutlined style={{ fontSize: 28, color: "#999" }} />
          </div>
        )}
        <Upload showUploadList={false} beforeUpload={handleUpload}>
          <Button icon={<UploadOutlined />}>
            {editedData?.profilePicturePath ? "Replace Picture" : "Upload Picture"}
          </Button>
        </Upload>
      </div>
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
            value={editedData?.birthDate ? dayjs(editedData.birthDate) : null}
            onChange={(date) => {
              setChanged(true);
              setEditedData({
                ...editedData,
                birthDate: date?.toISOString(),
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
            value={editedData?.phoneNumber}
            onChange={(e) => {
              setChanged(true);
              setEditedData({ ...editedData, phoneNumber: e.target.value });
            }}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="primary" disabled={!changed} onClick={handleSave}>
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

      {/* Debug Section */}
      <div style={{ marginTop: "20px" }}>
        <Title level={5}>Debug: User Instance</Title>
        <pre
          style={{
            backgroundColor: "#f5f5f5",
            padding: "10px",
            borderRadius: "5px",
          }}
        >
          {JSON.stringify(editedData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default UserDataTab;