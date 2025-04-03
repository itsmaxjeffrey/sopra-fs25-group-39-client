"use client";
import React, { useState } from "react";
import { Button, Typography, Modal, Form, Input } from "antd";
import styles from "../Account.module.css";

const { Title } = Typography;

const ActionsTab = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [deleteForm] = Form.useForm();

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        console.log("Submitted password change:", values);

        setIsModalOpen(false);
        form.resetFields();
      })
      .catch((info) => {
        console.log("Validation failed:", info);
      });
  };

  const handleDelete = () => {
    deleteForm
      .validateFields()
      .then((values) => {
        console.log("Confirmed account deletion for:", values.email);
        
        setDeleteModalOpen(false);
        deleteForm.resetFields();
      })
      .catch((info) => {
        console.log("Delete validation failed:", info);
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
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[{ required: true, message: "Please enter your current password" }]}
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
        okText="Delete"
        cancelText="Cancel"
        centered
      >
        <p>To confirm, please enter your email address associated with this account:</p>
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
