"use client";
import React from "react";
import { Button, DatePicker, Image, Input, Typography, Upload } from "antd";
import { CameraOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import styles from "../Account.module.css";
//import axios from "axios";

/* eslint-disable @typescript-eslint/no-explicit-any */

const { Title } = Typography;

const UserDataTab = ({
  editedData,
  userData,
  setEditedData,
  changed,
  setChanged,
}: any) => {
  const handleSave = () => {
    const token = localStorage.getItem("token");
    const id = localStorage.getItem("id");

    if (!token || !id) return;

    console.log("Would send data:", editedData);
  };

  return (
    <div className={styles.tabContent}>
      <Title level={5}>Personal Information</Title>
      <div className={styles.profilePicSection}>
        {editedData?.profilePicture
          ? (
            <Image
              width={100}
              height={100}
              src={editedData.profilePicture}
              alt="Profile"
              style={{ borderRadius: "50%", objectFit: "cover" }}
              fallback="/placeholder-profile.png"
            />
          )
          : (
            <div className={styles.profilePicPlaceholder}>
              <CameraOutlined style={{ fontSize: 28, color: "#999" }} />
            </div>
          )}
        <Upload
          showUploadList={false}
          beforeUpload={(file) => {
            console.log("Would upload:", file);
            // Placeholder upload handler
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>
            {editedData?.profilePicture ? "Replace Picture" : "Upload Picture"}
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
            value={editedData?.birthdate ? dayjs(editedData.birthdate) : null}
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
        <Button
          type="primary"
          disabled={!changed}
          onClick={handleSave}
        >
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
