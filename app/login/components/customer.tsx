"use client";
import React, { useState } from "react";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Spin,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import styles from "../login.module.css";

/* eslint-disable @typescript-eslint/no-explicit-any */

const { Title } = Typography;

const Customer = () => {
  const [ setFormData] = useState<any>({}); // later add "formData" to use it

  const [modalVisible, setModalVisible] = useState(false);
  const [modalState, setModalState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <div className={styles.driverContainer}>
      <Form
        layout="vertical"
        onFinish={(values) => {
          setFormData(values);
          const {
            firstName,
            lastName,
            birthdate,
            email,
            phone,
            username,
            password,
          } = values;

          setModalVisible(true);
          setModalState("loading");

          fetch("http://localhost:5001/api/v1/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              firstName,
              lastName,
              birthdate,
              email,
              phone,
              username,
              password,
              accountType: "customer",
            }),
          })
            .then((res) => {
              if (!res.ok) {
                return res.json().then((data) => {
                  throw new Error(data.message || "Registration failed");
                });
              }
              return res.json();
            })
            .then(() => {
              setModalState("success");
            })
            .catch((err) => {
              setErrorMessage(err.message);
              setModalState("error");
            });
        }}
      >
        <div className={styles.formSection}>
          <div>
            <Title level={5}>Personal Information</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[
                    { required: true, message: "Please enter your first name" },
                  ]}
                >
                  <Input placeholder="Anna" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[
                    { required: true, message: "Please enter your last name" },
                  ]}
                >
                  <Input placeholder="Miller" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Username"
                  name="username"
                  rules={[
                    { required: true, message: "Please enter a username" },
                  ]}
                >
                  <Input placeholder="Anna" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Birthdate"
                  name="birthdate"
                  rules={[
                    { required: true, message: "Please select your birthdate" },
                  ]}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Email Address"
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: "Please enter an email address",
                    },
                    {
                      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Please enter a valid email address",
                    },
                  ]}
                >
                  <Input placeholder="anna.miller@uzh.ch" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Phone Number"
                  name="phone"
                  rules={[
                    {
                      required: true,
                      message: "Please enter your phone number",
                    },
                    {
                      pattern: /^\+?[0-9\s\-]{7,20}$/,
                      message:
                        "Please enter a valid phone number (e.g. +41 79 123 45 67)",
                    },
                  ]}
                >
                  <Input placeholder="e.g. +41 79 123 45 67" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: "Please enter a password",
                    },
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
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Confirm Password"
                  name="confirm"
                  dependencies={["password"]}
                  hasFeedback
                  rules={[
                    {
                      required: true,
                      message: "Please confirm your password",
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Passwords do not match"),
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>

        <Form.Item className={styles.formButtonGroup}>
          <Button
            danger
            style={{ marginRight: 12 }}
            onClick={() => window.location.reload()}
          >
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            Register
          </Button>
        </Form.Item>
      </Form>

      <Modal open={modalVisible} footer={null} closable={false} centered>
        <div className={styles.registerCenter}>
          {modalState === "loading" && (
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
              className={styles.registerSpinner}
            />
          )}

          {modalState === "success" && (
            <div className={styles.registerSuccess}>
              <CheckCircleOutlined style={{ fontSize: 48, color: "green" }} />
              <p>Account successfully created!</p>
              <Button type="primary" onClick={() => window.location.reload()}>
                Go to Login
              </Button>
            </div>
          )}

          {modalState === "error" && (
            <div className={styles.registerError}>
              <CloseCircleOutlined style={{ fontSize: 48, color: "red" }} />
              <p>{errorMessage}</p>
              <Button onClick={() => setModalVisible(false)}>OK</Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Customer;
