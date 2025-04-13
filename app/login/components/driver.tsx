"use client";
import React, { useRef, useState } from "react";
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
  Upload,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Autocomplete, LoadScript } from "@react-google-maps/api";
import styles from "../login.module.css";
import axios from "axios";

const { Title } = Typography;

/* eslint-disable @typescript-eslint/no-explicit-any */

const Driver = () => {
  const [formStepOneData, setFormStepOneData] = useState<any>({});
  const [step, setStep] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalState, setModalState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [preferredRange, setPreferredRange] = useState("");
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    formattedAddress: "",
  });
  const autoRef = useRef<any>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );
  const [driverLicenseFile, setDriverLicenseFile] = useState<File | null>(null);

  const [insuranceProofFile, setInsuranceProofFile] = useState<File | null>(
    null,
  );

  const handleStepOneFinish = (values: any) => {
    setFormStepOneData(values);
    setStep(2);
  };

  const handleStepTwoFinish = async (values: any) => {
    const { vehicleModel, licensePlate, weightCapacity, volumeCapacity } =
      values;

    setModalVisible(true);
    setModalState("loading");

    let profilePicturePath = null;
    let insurancePicturePath = null;
    let licensePicturePath = null;

    try {
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append("file", profilePictureFile);
        formData.append("type", "profileimage");

        const response = await axios.post(
          `${
            process.env.NODE_ENV === "production"
              ? "https://sopra-fs25-group-39-client.vercel.app"
              : "http://localhost:5001"
          }/api/v1/files/upload/profileimage`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        profilePicturePath = response.data.filePath;
      }

      if (driverLicenseFile) {
        const formData = new FormData();
        formData.append("file", driverLicenseFile);
        formData.append("type", "license");

        const response = await axios.post(
          `${
            process.env.NODE_ENV === "production"
              ? "https://sopra-fs25-group-39-client.vercel.app"
              : "http://localhost:5001"
          }/api/v1/files/upload/license`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        licensePicturePath = response.data.filePath;
      }

      if (insuranceProofFile) {
        const formData = new FormData();
        formData.append("file", insuranceProofFile);
        formData.append("type", "insurance");

        const response = await axios.post(
          `${
            process.env.NODE_ENV === "production"
              ? "https://sopra-fs25-group-39-client.vercel.app"
              : "http://localhost:5001"
          }/api/v1/files/upload/insurance`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        insurancePicturePath = response.data.filePath;
      }
    } catch (uploadError) {
      console.error(uploadError);
      setErrorMessage("Image upload failed");
      setModalState("error");
      return;
    }

    axios
      .post(
        `${
          process.env.NODE_ENV === "production"
            ? "https://sopra-fs25-group-39-client.vercel.app"
            : "http://localhost:5001"
        }/api/v1/auth/register/driver`,
        {
          user: {
            userAccountType: "DRIVER",
            username: formStepOneData.username,
            password: formStepOneData.password,
            email: formStepOneData.email,
            firstName: formStepOneData.firstName,
            lastName: formStepOneData.lastName,
            phoneNumber: formStepOneData.phone,
            birthDate: formStepOneData.birthdate,
            driverLicensePath: licensePicturePath,
            driverInsurancePath: insurancePicturePath,
            profilePicturePath: profilePicturePath,
          },
          car: {
            carModel: vehicleModel,
            licensePlate: licensePlate,
            supportedWeight: weightCapacity,
            space: volumeCapacity,
            electric: null,
          },
          preferredRange: parseFloat(preferredRange),
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            formattedAddress: location.formattedAddress,
          },
        },
      )
      .then(() => {
        setModalState("success");
      })
      .catch((err) => {
        setErrorMessage(err.response?.data?.message || err.message);
        setModalState("error");
      });
  };

  return (
    <div className={styles.driverContainer}>
      {step === 1 && (
        <Form layout="vertical" onFinish={handleStepOneFinish}>
          <div className={styles.formSection}>
            <div>
              <Title level={5}>Personal Information</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="First Name"
                    name="firstName"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your first name",
                      },
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
                      {
                        required: true,
                        message: "Please enter your last name",
                      },
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
                      {
                        required: true,
                        message: "Please select your birthdate",
                      },
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
                <Col span={24}>
                  <Form.Item label="Profile Picture" name="profilePicture">
                    <Upload
                      listType="picture"
                      maxCount={1}
                      beforeUpload={() => false}
                      onChange={({ fileList }) => {
                        const file = fileList[0]?.originFileObj;
                        if (file) {
                          setProfilePictureFile(file);
                        } else {
                          setProfilePictureFile(null);
                        }
                      }}
                      onRemove={() => setProfilePictureFile(null)}
                    >
                      <Button>Upload Profile Picture</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>

          <Form.Item className={styles.stepControls}>
            <Button type="primary" htmlType="submit">
              Next
            </Button>
          </Form.Item>
        </Form>
      )}

      {step === 2 && (
        <Form layout="vertical" onFinish={handleStepTwoFinish}>
          <div className={styles.formSection}>
            <div>
              <Title level={5}>Vehicle Information</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Vehicle Make & Model"
                    name="vehicleModel"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your vehicle model",
                      },
                    ]}
                  >
                    <Input placeholder="Honda Civic 2.0" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="License Plate"
                    name="licensePlate"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your license plate",
                      },
                    ]}
                  >
                    <Input placeholder="ZH 123 456" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Weight Capacity"
                    name="weightCapacity"
                    rules={[
                      {
                        required: true,
                        message: "Please enter the weight capacity",
                      },
                    ]}
                  >
                    <Input placeholder="5 Tons" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Volume Capacity"
                    name="volumeCapacity"
                    rules={[
                      {
                        required: true,
                        message: "Please enter the volume capacity",
                      },
                    ]}
                  >
                    <Input placeholder="15 Cubic" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Preferred Range (in km)"
                    name="preferredRange"
                    rules={[
                      {
                        required: true,
                        message: "Please enter preferred range",
                      },
                    ]}
                  >
                    <Input
                      type="number"
                      placeholder="e.g. 50"
                      onChange={(e) => setPreferredRange(e.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Location" name="address">
                    <LoadScript
                      googleMapsApiKey={process.env
                        .NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
                      libraries={["places"]}
                    >
                      <Autocomplete
                        onLoad={(ref) => (autoRef.current = ref)}
                        onPlaceChanged={() => {
                          const place = autoRef.current?.getPlace();
                          if (
                            place &&
                            place.geometry &&
                            place.formatted_address
                          ) {
                            setLocation({
                              latitude: place.geometry.location.lat(),
                              longitude: place.geometry.location.lng(),
                              formattedAddress: place.formatted_address,
                            });
                          }
                        }}
                      >
                        <Input placeholder="Enter your address" />
                      </Autocomplete>
                    </LoadScript>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Driver’s License" name="driversLicense">
                    <Upload
                      listType="picture"
                      maxCount={1}
                      beforeUpload={() => false}
                      onChange={({ fileList }) => {
                        const file = fileList[0]?.originFileObj;
                        if (file) {
                          setDriverLicenseFile(file);
                        } else {
                          setDriverLicenseFile(null);
                        }
                      }}
                      onRemove={() => setDriverLicenseFile(null)}
                    >
                      <Button icon={<UploadOutlined />}>
                        Upload Picture (optional)
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Proof of Insurance" name="insuranceProof">
                    <Upload
                      listType="picture"
                      maxCount={1}
                      beforeUpload={() => false}
                      onChange={({ fileList }) => {
                        const file = fileList[0]?.originFileObj;
                        if (file) {
                          setInsuranceProofFile(file);
                        } else {
                          setInsuranceProofFile(null);
                        }
                      }}
                      onRemove={() => setInsuranceProofFile(null)}
                    >
                      <Button icon={<UploadOutlined />}>
                        Upload Picture (optional)
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>

          <Form.Item className={styles.stepControls}>
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
      )}

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

export default Driver;
