"use client";
import React, { useEffect } from "react";
import { Button, DatePicker, Input, message, Typography, Upload } from "antd"; // Import message
import { CameraOutlined } from "@ant-design/icons"; // Added DeleteOutlined and EyeOutlined
import dayjs from "dayjs";
import styles from "../Account.module.css";
import { getApiDomain } from "@/utils/domain";
import { useApi } from "@/hooks/useApi"; // Import useApi
import type { UploadFile } from "antd/es/upload/interface"; // Import UploadFile type
import axios from "axios"; // Import axios for delete operation

const BASE_URL = getApiDomain();

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
  const apiService = useApi(); // Use the hook

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
        setChanged(true);
      } else {
        throw new Error("File path is missing in the response");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }

    return false; // Prevent default upload behavior
  };

  const handleDeleteProfilePicture = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const pathToDelete = editedData?.profilePicturePath;

    setEditedData((prevData) => ({
      ...prevData,
      profilePicturePath: undefined, // Clear the path in UI
    }));
    setChanged(true);

    if (pathToDelete && token && userId) {
      try {
        await axios.delete(
          `${BASE_URL}/api/v1/files/delete?filePath=${pathToDelete}`,
          {
            headers: {
              UserId: `${userId}`,
              Authorization: `${token}`,
            },
          }
        );
        message.success("Profile picture deleted successfully.");
        console.log("File deleted from server:", pathToDelete);
      } catch (error) {
        console.error(
          "Error deleting profile picture from server:",
          pathToDelete,
          error
        );
        message.error("Error deleting profile picture from server.");
        // Optionally revert UI: setEditedData back to include pathToDelete if server fails
      }
    } else if (pathToDelete) {
      console.error(
        "Authentication details missing, cannot delete profile picture from server."
      );
      message.error(
        "Authentication details missing. Cannot delete profile picture from server."
      );
    }
  };

  const handleSave = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      message.error("User ID not found. Cannot save.");
      return;
    }

    // Prepare data for saving. Ensure profilePicturePath is null if undefined or empty.
    const dataToSave: UserData = {
      ...editedData,
      profilePicturePath: editedData.profilePicturePath || null,
    };

    try {
      // Assuming apiService.put returns the updated user data
      const responseData = await apiService.put<UserData>(
        `/api/v1/users/${userId}`,
        dataToSave // Send the modified dataToSave
      );

      console.log("User data saved successfully:", responseData); // Log the response data
      setChanged(false);
      // Optionally, update editedData with responseData if it contains the full updated user object
      // setEditedData(responseData);
      message.success("User data saved successfully!");
    } catch (error: unknown) {
      // Use unknown for caught errors
      console.error("Error saving user data:", error);
      // Add type check for error properties
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error instanceof Error ? error.message : "Error saving user data.");
      message.error(errorMessage);
    }
  };

  const profilePictureFileList: UploadFile[] = editedData?.profilePicturePath
    ? [
        {
          uid: `profile-${editedData.profilePicturePath}`,
          name:
            editedData.profilePicturePath.substring(
              editedData.profilePicturePath.lastIndexOf("/") + 1
            ) || "profile.png",
          status: "done",
          url: `${BASE_URL}/api/v1/files/download?filePath=${editedData.profilePicturePath}`,
          thumbUrl: `${BASE_URL}/api/v1/files/download?filePath=${editedData.profilePicturePath}`,
        },
      ]
    : [];

  return (
    <div className={styles.tabContent}>
      <Title level={5}>Personal Information</Title>
      <div className={styles.profilePicSection}>
        <Upload
          listType="picture-card"
          fileList={profilePictureFileList}
          maxCount={1}
          beforeUpload={handleUpload}
          onRemove={handleDeleteProfilePicture}
          // Ant Design's default preview will use the 'url' from fileList
        >
          {profilePictureFileList.length === 0 ? (
            <div>
              <CameraOutlined />
              <div style={{ marginTop: 8 }}>Upload Picture</div>
            </div>
          ) : null}
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
                birthDate: date?.format("YYYY-MM-DD"),
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
