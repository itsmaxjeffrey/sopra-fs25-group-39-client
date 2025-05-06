"use client";
import React, { useState } from "react";
import { Button, Form, Input, message, Modal, Typography } from "antd";
import styles from "../Account.module.css";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";

const { Title } = Typography;

const ActionsTab = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [form] = Form.useForm();
  const apiService = useApi();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [confirmEmail, setConfirmEmail] = useState("");

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

          await apiService.put(endpoint, body);

          message.success("Password changed successfully!");
          setIsModalOpen(false);
          form.resetFields();
        } catch (error: unknown) {
          console.error("Password change failed:", error);
          const backendMessage =
            (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message;
          message.error(
            backendMessage ||
              (error instanceof Error
                ? error.message
                : "Failed to change password. Please try again."),
          );
        } finally {
          setLoading(false);
        }
      })
      .catch((info) => {
        console.log("Validation failed:", info);
      });
  };

  const handleDelete = () => {
    setLoading(true);
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!token || !userId) {
      message.error("Authentication details missing.");
      setLoading(false);
      return;
    }

    if (!confirmEmail) {
      message.error("Please enter your email to confirm deletion.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        await apiService.post(`/api/v1/auth/users/${userId}`, { email: confirmEmail });
        message.success("Account deleted successfully.");
        localStorage.clear();
        router.push("/login");
        setDeleteModalOpen(false);
        setConfirmEmail("");
      } catch (error: unknown) {
        console.error("Account deletion failed:", error);
        const backendMessage =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message;
        message.error(
          backendMessage ||
            (error instanceof Error
              ? error.message
              : "Failed to delete account. Please try again."),
        );
      } finally {
        setLoading(false);
      }
    })();
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
          setConfirmEmail("");
        }}
        okText="Delete Account"
        okType="danger"
        cancelText="Cancel"
        centered
        confirmLoading={loading}
      >
        <p>
          Are you sure you want to delete your account? This action cannot be
          undone. Please enter your email address to confirm.
        </p>
        <Input
          placeholder="Enter your email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  );
};

export default ActionsTab;
