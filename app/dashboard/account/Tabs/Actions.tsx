"use client";
import React, { useState } from "react";
import { Button, Form, Input, Modal, Typography, message } from "antd";
import styles from "../Account.module.css";
import { useApi } from "@/hooks/useApi";
import { getApiDomain } from "@/utils/domain"; // Corrected function name
import { useRouter } from "next/navigation"; // Import useRouter


const { Title } = Typography;

const ActionsTab = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [deleteForm] = Form.useForm();
  const apiService = useApi(); // Get the full service instance
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Initialize router

  const handleOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        setLoading(true);
        console.log("Submitting password change:", values);

        try {
          const endpoint = `/api/v1/auth/change-password`;
          const body = {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          };

          // Call put on the apiService instance
          await apiService.put(endpoint, body);

          message.success("Password changed successfully!");
          setIsModalOpen(false);
          form.resetFields();
        } catch (error: any) {
          console.error("Password change failed:", error);
          const errorMessage = error?.response?.data?.message || error?.message || "Failed to change password. Please try again.";
          message.error(errorMessage);
        } finally {
          setLoading(false);
        }
      })
      .catch((info) => {
        console.log("Validation failed:", info);
      });
  };

  const handleDelete = () => {
    deleteForm
      .validateFields()
      .then(async (values) => {
        setLoading(true); // Add loading state
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");
        const userEmail = localStorage.getItem("userEmail"); // Assuming email is stored

        if (!token || !userId) {
          message.error("Authentication details missing.");
          setLoading(false);
          return;
        }

        // Basic check if entered email matches stored email (optional, backend should verify)
        if (values.email !== userEmail) {
          message.error("Entered email does not match account email.");
          setLoading(false);
          return;
        }

        try {
          await apiService.delete(`/api/v1/users/${userId}`);
          message.success("Account deleted successfully.");
          // Clear local storage and redirect to login
          localStorage.clear();
          router.push("/login");
          setDeleteModalOpen(false);
          deleteForm.resetFields();
        } catch (error: any) {
          console.error("Account deletion failed:", error);
          const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete account. Please try again.";
          message.error(errorMessage);
        } finally {
          setLoading(false);
        }
      })
      .catch((info) => {
        console.log("Delete validation failed:", info);
        // Optionally add a message here if validation fails
        // message.warning("Please correct the errors before submitting.");
      });
  };

  return (
    <div className={styles.tabContent}>
      <Title level={5}>Security</Title>
      <div className={styles.formGrid}>
        <div>
          <label>Password</label>
          <Button type="default" onClick={() => setIsModalOpen(true)}>
            Change Password
          </Button>
        </div>
        <div>
          <label>Delete Account</label>
          <Button danger onClick={() => setDeleteModalOpen(true)}>
            Delete my account
          </Button>
        </div>
      </div>

      <Modal
        title="Change Password"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText="Save"
        cancelText="Cancel"
        centered
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[{
              required: true,
              message: "Please enter your current password",
            }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: "Please enter a new password" },
              {
                pattern:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message:
                  "At least 8 characters, uppercase & lowercase letters, a number and a special character",
              },
            ]}
            hasFeedback
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirm"
            dependencies={["newPassword"]}
            hasFeedback
            rules={[
              { required: true, message: "Please confirm your new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Confirm Account Deletion"
        open={deleteModalOpen}
        onOk={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          deleteForm.resetFields();
        }}
        okText="Delete Account"
        okType="danger"
        cancelText="Cancel"
        centered
        confirmLoading={loading} // Add confirmLoading to delete modal
      >
        <p>
          To confirm, please enter your email address associated with this
          account:
        </p>
        <Form form={deleteForm} layout="vertical">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              {
                type: "email",
                message: "Please enter a valid email address",
              },
            ]}
          >
            <Input placeholder="e.g. anna.miller@uzh.ch" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ActionsTab;
