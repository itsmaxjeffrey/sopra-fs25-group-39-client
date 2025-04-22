"use client";
import '@ant-design/v5-patch-for-react-19';
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
  Upload,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import styles from "../login.module.css";
import { Autocomplete, LoadScript } from "@react-google-maps/api";
import { getApiDomain } from "@/utils/domain";

interface StepOneData {
  firstName: string;
  lastName: string;
  username: string;
  birthDate: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirm: string;
}

interface StepTwoData {
  vehicleModel: string;
  licensePlate: string;
  weightCapacity: string;
  volumeCapacity: string;
  preferredRange: number;
}

interface Location {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

const BASE_URL = getApiDomain();

const Driver = () => {
  const [driverLicenseFilePath, setDriverLicenseFilePath] = useState<string | null>(null);
  const [insuranceProofFilePath, setInsuranceProofFilePath] = useState<
    string | null
  >(null);

  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [formStepOneData, setFormStepOneData] = useState<StepOneData | null>(
    null,
  );
  const [step, setStep] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalState, setModalState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");

  const [preferredRange, setPreferredRange] = useState<number | null>(null);
  const [driverLicenseFile] = useState<File | null>(null);
  const [insuranceProofFile] = useState<File | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null);

  const uploadFile = async (file: File, type: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/files/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const filePath = (response.data as { filePath: string }).filePath;
      if (!filePath) {
        throw new Error("File path is missing in the response");
      }

      return filePath;
    } catch (error) {
      console.error("File upload failed:", error);
      throw new Error("Failed to upload file. Please try again.");
    }
  };

  const handleStepOneFinish = (values: StepOneData) => {
    setFormStepOneData(values);
    setStep(2);
  };

  const handleStepTwoFinish = async (values: StepTwoData) => {
    const {
      vehicleModel,
      licensePlate,
      weightCapacity,
      volumeCapacity,
    } = values;

    setModalVisible(true);
    setModalState("loading");

    try {
      const profilePicturePath = uploadedFilePath;
      let driverLicensePath = null;
      let driverInsurancePath = null;

      if (driverLicenseFile) {
        driverLicensePath = await uploadFile(driverLicenseFile, "license");
      }

      if (insuranceProofFile) {
        driverInsurancePath = await uploadFile(insuranceProofFile, "insurance");
      }

      await axios.post(`${BASE_URL}/api/v1/auth/register`, {
        user: {
          userAccountType: "DRIVER",
          ...formStepOneData,
          profilePicturePath,
          driverLicensePath: driverLicenseFilePath,
          driverInsurancePath: insuranceProofFilePath,
          preferredRange: preferredRange ?? undefined,
        },
        car: {
          carModel: vehicleModel,
          volumeCapacity: volumeCapacity,
          weightCapacity: weightCapacity,
          licensePlate,
        },
        location,
        driverLicensePath,
        driverInsurancePath,
      });

      setModalState("success");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unknown error occurred.");
      }      
      setModalState("error");
    }
  };

  return (
    <div className={styles.driverContainer}>
      {/* Step One Form */}
      {step === 1 && (
        <Form layout="vertical" onFinish={handleStepOneFinish}>
          <div className={styles.formSection}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[{
                    required: true,
                    message: "Please enter your first name",
                  }]}
                >
                  <Input placeholder="Anna" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[{
                    required: true,
                    message: "Please enter your last name",
                  }]}
                >
                  <Input placeholder="Miller" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Username"
                  name="username"
                  rules={[{
                    required: true,
                    message: "Please enter a username",
                  }]}
                >
                  <Input placeholder="Anna" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Birthdate"
                  name="birthDate"
                  rules={[{
                    required: true,
                    message: "Please select your birthdate",
                  }]}
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
                  name="phoneNumber"
                  rules={[
                    {
                      required: true,
                      message: "Please enter your phone number",
                    },
                    {
                      pattern: /^\+?[0-9\s\-]{7,20}$/,
                      message: "Invalid phone number",
                    },
                  ]}
                >
                  <Input placeholder="+41 79 123 45 67" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: "Please enter a password" },
                    {
                      pattern:
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                      message:
                        "Must include uppercase, lowercase, number, and special char",
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
                    { required: true, message: "Please confirm your password" },
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
              <Col span={12}>
                <Form.Item label="Profile Picture" name="profilePicture">
                  <Upload
                    listType="picture"
                    maxCount={1}
                    beforeUpload={() => false}
                    onChange={async ({ fileList }) => {
                      const file = fileList[0]?.originFileObj;
                      if (file) {
                        const filePath = await uploadFile(file, "profile");
                        setUploadedFilePath(filePath);
                      } else {
                        setUploadedFilePath(null);
                      }
                    }}
                    onRemove={() => {
                      setUploadedFilePath(null);
                    }}
                  >
                    <Button icon={<UploadOutlined />}>
                      Upload Profile Picture
                    </Button>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          </div>
          <Form.Item className={styles.stepControls}>
            <Button type="primary" htmlType="submit">Next</Button>
          </Form.Item>
        </Form>
      )}

      {/* Step Two Form */}
      {step === 2 && (
        <Form layout="vertical" onFinish={handleStepTwoFinish}>
          <div className={styles.formSection}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Vehicle Model"
                  name="vehicleModel"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Honda Civic 2.0" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="License Plate"
                  name="licensePlate"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="ZH 123 456" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Weight Capacity"
                  name="weightCapacity"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="5 Tons" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Volume Capacity"
                  name="volumeCapacity"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="15 Cubic" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Preferred Range (in km)"
                  name="preferredRange"
                  rules={[{ required: true }]}
                >
                  <Input
                    type="number"
                    onChange={(e) => setPreferredRange(Number(e.target.value))}
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
                          place && place.geometry && place.formatted_address
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
                    onChange={async ({ fileList }) => {
                      const file = fileList[0]?.originFileObj;
                      if (file) {
                        try {
                          const filePath = await uploadFile(file, "license");
                          setDriverLicenseFilePath(filePath);
                        } catch (error) {
                          console.error(
                            "Driver's license upload failed:",
                            error,
                          );
                        }
                      } else {
                        setDriverLicenseFilePath(null);
                      }
                    }}
                    onRemove={() => setDriverLicenseFilePath(null)}
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
                    onChange={async ({ fileList }) => {
                      const file = fileList[0]?.originFileObj;
                      if (file) {
                        try {
                          const filePath = await uploadFile(file, "insurance");
                          setInsuranceProofFilePath(filePath);
                        } catch (error) {
                          console.error(
                            "Insurance proof upload failed:",
                            error,
                          );
                        }
                      } else {
                        setInsuranceProofFilePath(null);
                      }
                    }}
                    onRemove={() => setInsuranceProofFilePath(null)}
                  >
                    <Button icon={<UploadOutlined />}>
                      Upload Picture (optional)
                    </Button>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
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

      {/* Modal */}
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
