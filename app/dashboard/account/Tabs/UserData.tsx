"use client";
import React, { useEffect, useState } from "react";
import { Button, DatePicker, Image, Input, Typography, Upload } from "antd";
import { CameraOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import styles from "../Account.module.css";

const BASE_URL = process.env.NODE_ENV === "production"
  ? "https://sopra-fs25-group-39-client.vercel.app"
  : "http://localhost:8080";

const { Title } = Typography;

interface UserData {
  firstName: string;
  lastName: string;
  username: string;
  birthDate: string | null;
  email: string;
  phoneNumber: string;
  profilePicturePath?: string;
}

interface UserDataTabProps {
  editedData: UserData;
  userData: UserData;
  setEditedData: React.Dispatch<React.SetStateAction<UserData>>;
  changed: boolean;
  setChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

const UserDataTab: React.FC<UserDataTabProps> = ({
  editedData,
  userData,
  setEditedData,
  changed,
  setChanged,
}) => {
  const [, setImageKey] = useState(0); // State to force re-render of the image

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
  }, [setEditedData]);

  const handleUpload = async (file: File) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "profile");

    if (!token || !userId) return;

    try {
      const response = await fetch(`${BASE_URL}/api/v1/files/upload`, {
        method: "POST",
        headers: {
          UserId: `${userId}`,
          Authorization: `${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      console.log("Upload response:", data);

      if (data.filePath) {
        setEditedData({
          ...editedData,
          profilePicturePath: data.filePath,
        });
        setImageKey((prev) => prev + 1); // Force re-render of the image
      } else {
        throw new Error("File path is missing in the response");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }

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
        {editedData?.profilePicturePath
          ? (
            <Image
              width={100}
              height={100}
              src={`${BASE_URL}/api/v1/files/download?filePath=${editedData.profilePicturePath}`}
              alt="Profile"
              style={{ borderRadius: "50%", objectFit: "cover" }}
              // fallback="/placeholder-profile.png"
            />
          )
          : (
            <div className={styles.profilePicPlaceholder}>
              <CameraOutlined style={{ fontSize: 28, color: "#999" }} />
            </div>
          )}
        <Upload showUploadList={false} beforeUpload={handleUpload}>
          <Button icon={<UploadOutlined />}>
            {editedData?.profilePicturePath
              ? "Replace Picture"
              : "Upload Picture"}
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
    </div>
  );
};

export default UserDataTab;
