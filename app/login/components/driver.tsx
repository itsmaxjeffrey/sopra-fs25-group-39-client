"use client";
import "@ant-design/v5-patch-for-react-19";
import React, { useEffect, useRef, useState } from "react";
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
import { UploadChangeParam } from "antd/es/upload";
import { UploadFile } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import styles from "../login.module.css";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { getApiDomain } from "@/utils/domain";
import dayjs from "dayjs"; // Import dayjs

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
const libraries: "places"[] = ["places"];

interface LocationInputProps {
  value?: Location | null; // Value passed from Form.Item (should be the Location object)
  onChange?: (value: Location | null) => void; // Function to notify Form.Item of changes
}

const LocationInput: React.FC<LocationInputProps> = ({ value, onChange }) => {
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value?.formattedAddress || "");
  // console.log(
  //   "LocationInput rendered. Initial value:",
  //   value,
  //   "Initial inputValue:",
  //   inputValue,
  // );

  useEffect(() => {
    // This effect synchronizes the local inputValue with the external `value` prop.
    // It runs ONLY when the `value` prop changes.
    if (value && value.formattedAddress) {
      setInputValue(value.formattedAddress);
    } else {
      setInputValue("");
    }
  }, [value]); // Dependency array is still [value]

  const handlePlaceChanged = () => {
    // console.log("handlePlaceChanged triggered");
    const place = autoRef.current?.getPlace();
    // console.log("Place selected:", place);

    if (place && place.geometry?.location && place.formatted_address) {
      const newLocation: Location = {
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        formattedAddress: place.formatted_address,
      };
      // console.log(
      //   "Valid place selected. Updating input and calling onChange with:",
      //   newLocation,
      // );
      setInputValue(newLocation.formattedAddress);
      onChange?.(newLocation);
    } else {
      // console.log(
      //   "Invalid place or place cleared. Clearing input and calling onChange(null).",
      // );
      setInputValue("");
      onChange?.(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentInputText = e.target.value;
    // console.log("handleInputChange triggered. New text:", currentInputText);
    setInputValue(currentInputText);
  };

  const handleAutocompleteLoad = (
    autocomplete: google.maps.places.Autocomplete,
  ) => {
    // console.log("Autocomplete loaded:", autocomplete);
    autoRef.current = autocomplete;
  };

  return (
    <Autocomplete
      onLoad={handleAutocompleteLoad} // Use specific handler
      onPlaceChanged={handlePlaceChanged}
      fields={["geometry", "formatted_address"]}
    >
      <Input
        placeholder="Enter address and select from suggestions"
        value={inputValue}
        onChange={handleInputChange}
      />
    </Autocomplete>
  );
};

// Helper function to normalize the event object for Form.Item
const normFile = (e: UploadChangeParam<UploadFile>) => {
  // Use UploadChangeParam<UploadFile>
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

const Driver = () => {
  const [driverLicenseFilePath, setDriverLicenseFilePath] = useState<
    string | null
  >(null);
  const [insuranceProofFilePath, setInsuranceProofFilePath] = useState<
    string | null
  >(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [profileFileList, setProfileFileList] = useState<UploadFile[]>([]);
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
  const [formStepTwo] = Form.useForm();
  const [formStepOne] = Form.useForm<StepOneData>(); // Create form instance for Step 1

  // Username availability check states and function
  const [usernameStatus, setUsernameStatus] = useState<
    "" | "success" | "error"
  >("");
  const [usernameHelp, setUsernameHelp] = useState<string | null>(null);

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 4) {
      setUsernameStatus("");
      setUsernameHelp(null);
      return;
    }

    try {
      const response = await axios.get(
        `${BASE_URL}//api/v1/auth/check-username/${username}`,
      );

      if (response.data.isTaken == false) {
        setUsernameStatus("success");
        setUsernameHelp("Username is available");
      } else {
        setUsernameStatus("error");
        setUsernameHelp("Username is already taken");
      }
    } catch (error) {
      console.error("Username check failed", error);
      setUsernameStatus("error");
      setUsernameHelp("Could not check username. Try again.");
    }
  };

  const [emailStatus, setEmailStatus] = useState<"" | "success" | "error">("");
  const [emailHelp, setEmailHelp] = useState<string | null>(null);

  const checkEmailAvailability = async (email: string) => {
    if (!email.includes("@")) {
      setEmailStatus("");
      setEmailHelp(null);
      return;
    }

    try {
      const response = await axios.get(
        `${BASE_URL}//api/v1/auth/check-email/${email}`,
      );

      if (response.data.isTaken == false) {
        setEmailStatus("success");
        setEmailHelp("Email is available");
      } else {
        setEmailStatus("error");
        setEmailHelp("Email is already taken");
      }
    } catch (error) {
      console.error("Email check failed", error);
      setEmailStatus("error");
      setEmailHelp("Could not check email. Try again.");
    }
  };

  const [phoneNumberStatus, setPhoneNumberStatus] = useState<
    "" | "success" | "error"
  >("");
  const [phoneNumberHelp, setPhoneNumberHelp] = useState<string | null>(null);

  const checkPhoneNumberAvailability = async (phoneNumber: string) => {
    // Normalize the phone number by removing whitespace
    const normalizedPhoneNumber = phoneNumber.replace(/\s+/g, "");

    if (normalizedPhoneNumber.length < 7) {
      setPhoneNumberStatus("");
      setPhoneNumberHelp(null);
      return;
    }

    try {
      const response = await axios.get(
        `${BASE_URL}/api/v1/auth/check-phonenumber/${normalizedPhoneNumber}`,
      );

      if (response.data.isTaken == false) {
        setPhoneNumberStatus("success");
        setPhoneNumberHelp("Phone number is available");
      } else {
        setPhoneNumberStatus("error");
        setPhoneNumberHelp("Phone number is already taken");
      }
    } catch (error) {
      console.error("Phone number check failed", error);
      setPhoneNumberStatus("error");
      setPhoneNumberHelp("Could not check phone number. Try again.");
    }
  };

  // Birthdate validation
  const birthDate = Form.useWatch("birthDate", formStepOne);
  const [birthDateStatus, setBirthDateStatus] = useState<
    "" | "success" | "error"
  >("");
  const [birthDateHelp, setBirthDateHelp] = useState<string | null>(null);

  useEffect(() => {
    if (birthDate) {
      if (dayjs(birthDate).isAfter(dayjs(), "day")) {
        setBirthDateStatus("error");
        setBirthDateHelp("Birthdate cannot be in the future.");
      } else {
        setBirthDateStatus(""); // Or "success"
        setBirthDateHelp(null);
      }
    } else {
      setBirthDateStatus("");
      setBirthDateHelp(null);
    }
  }, [birthDate]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: libraries,
  });

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

  const handleStepTwoFinish = async (
    values: StepTwoData & { location: Location | null },
  ) => {
    const {
      vehicleModel,
      licensePlate,
      weightCapacity,
      volumeCapacity,
      location,
    } = values;

    if (!location || !location.latitude || !location.longitude) {
      setErrorMessage("Please select a valid location from the suggestions.");
      setModalState("error");
      setModalVisible(true);
      return;
    }

    setModalVisible(true);
    setModalState("loading");

    try {
      const profilePicturePath = uploadedFilePath;
      const normalizedPhoneNumber = formStepOneData?.phoneNumber.replace(
        /\s+/g,
        "",
      );

      await axios.post(`${BASE_URL}/api/v1/auth/register`, {
        user: {
          userAccountType: "DRIVER",
          ...formStepOneData,
          phoneNumber: normalizedPhoneNumber, // Use normalized phone number
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
      });

      setModalState("success");
    } catch (err: unknown) {
      let specificError = "An unknown error occurred during registration.";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        specificError = err.response.data.message;
      } else if (err instanceof Error) {
        specificError = err.message;
      }
      // Always set the error message, regardless of its source
      setErrorMessage(specificError);
      setModalState("error");
    }
  };

  const renderStepTwoContent = () => {
    if (loadError) {
      return (
        <div>
          Error loading Google Maps API. Please check your API key and network
          connection.
        </div>
      );
    }
    if (!isLoaded) {
      return (
        <Spin tip="Loading Maps...">
          <div style={{ height: "300px" }} />
        </Spin>
      );
    }
    return (
      <Form form={formStepTwo} layout="vertical" onFinish={handleStepTwoFinish}>
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
                label="Weight Capacity (in kg)"
                name="weightCapacity"
                rules={[
                  {
                    required: true,
                    message: "Please enter the weight capacity",
                  },
                  {
                    pattern: /^\d+$/,
                    message: "Weight capacity must be a positive number",
                  },
                  {
                    validator: (_, value) => {
                      if (value && (value < 0 || value > 5000)) {
                        return Promise.reject(
                          new Error(
                            "Weight capacity must be between 0 and 5000 kg",
                          ),
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="e.g., 100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Volume Capacity in m³"
                name="volumeCapacity"
                rules={[
                  {
                    required: true,
                    message: "Please enter the volume capacity (in m³)",
                  },
                  {
                    pattern: /^\d+$/,
                    message: "Volume capacity must be a positive number",
                  },
                  {
                    validator: (_, value) => {
                      if (value && (value < 0 || value > 100)) {
                        return Promise.reject(
                          new Error(
                            "Volume capacity must be between 0 and 100 cubic meters",
                          ),
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="e.g., 15" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Preferred Range (in km)"
                name="preferredRange"
                rules={[
                  {
                    required: true,
                    message: "Please enter your preferred range",
                  },
                ]}
              >
                <Input
                  type="number"
                  placeholder="e.g., 50"
                  value={preferredRange ?? ""}
                  onChange={(e) =>
                    setPreferredRange(Number(e.target.value) || null)}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Location"
                name="location"
                rules={[
                  {
                    required: true,
                    message: "Please enter and select your address",
                  },
                  {
                    validator: (_, value) =>
                      value &&
                        typeof value === "object" &&
                        value.latitude &&
                        value.longitude
                        ? Promise.resolve()
                        : Promise.reject(
                          new Error(
                            "Please select a valid address from the suggestions",
                          ),
                        ),
                  },
                ]}
              >
                <LocationInput />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Driver’s License"
                name="driversLicense"
                valuePropName="fileList"
                getValueFromEvent={normFile}
              >
                <Upload
                  listType="picture"
                  maxCount={1}
                  beforeUpload={() =>
                    false}
                  onChange={async ({ fileList }) => {
                    const file = fileList[0]?.originFileObj;
                    if (file) {
                      try {
                        const filePath = await uploadFile(file, "license");
                        setDriverLicenseFilePath(filePath);
                      } catch (error) {
                        console.error("Driver's license upload failed:", error);
                      }
                    } else {
                      setDriverLicenseFilePath(null);
                    }
                  }}
                  onRemove={() =>
                    setDriverLicenseFilePath(null)}
                >
                  <Button icon={<UploadOutlined />}>
                    Upload Picture (optional)
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Proof of Insurance"
                name="insuranceProof"
                valuePropName="fileList"
                getValueFromEvent={normFile}
              >
                <Upload
                  listType="picture"
                  maxCount={1}
                  beforeUpload={() =>
                    false}
                  onChange={async ({ fileList }) => {
                    const file = fileList[0]?.originFileObj;
                    if (file) {
                      try {
                        const filePath = await uploadFile(file, "insurance");
                        setInsuranceProofFilePath(filePath);
                      } catch (error) {
                        console.error("Insurance proof upload failed:", error);
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
          <Button danger style={{ marginRight: 12 }} onClick={() => setStep(1)}>
            Back
          </Button>
          <Button type="primary" htmlType="submit">
            Register
          </Button>
        </Form.Item>
      </Form>
    );
  };

  return (
    <div className={styles.driverContainer}>
      {step === 1 && (
        <Form
          form={formStepOne} // Pass form instance to Step 1 Form
          layout="vertical"
          onFinish={handleStepOneFinish}
        >
          <div className={styles.formSection}>
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
                    {
                      min: 4,
                      message: "Username must be at least 4 characters",
                    },
                  ]}
                  validateTrigger={["onChange", "onBlur"]}
                  validateStatus={usernameStatus}
                  help={usernameHelp}
                >
                  <Input
                    placeholder="Anna"
                    onChange={(e) => checkUsernameAvailability(e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Birthdate"
                  name="birthDate"
                  rules={[
                    {
                      required: true,
                      message: "Please select your birthdate",
                    },
                  ]}
                  validateStatus={birthDateStatus}
                  help={birthDateHelp}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    disabledDate={(current) => {
                      // Can not select days after today
                      return current && current > dayjs().endOf("day");
                    }}
                  />
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
                      type: "email",
                      message: "Please enter a valid email address",
                    },
                  ]}
                  validateTrigger={["onChange", "onBlur"]}
                  validateStatus={emailStatus}
                  help={emailHelp}
                >
                  <Input
                    placeholder="anna.miller@uzh.ch"
                    onChange={(e) => checkEmailAvailability(e.target.value)}
                  />
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
                      message: "Invalid phone number format",
                    },
                  ]}
                  validateTrigger={["onChange", "onBlur"]}
                  validateStatus={phoneNumberStatus}
                  help={phoneNumberHelp}
                >
                  <Input
                    placeholder="+41 79 123 45 67"
                    onChange={(e) =>
                      checkPhoneNumberAvailability(e.target.value)}
                  />
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
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])[A-Za-z\d!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]{8,}$/,
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
                <Form.Item
                  label="Profile Picture"
                  name="profilePicture"
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                >
                  <Upload
                    listType="picture"
                    maxCount={1}
                    fileList={profileFileList}
                    beforeUpload={() => false}
                    onChange={async ({ fileList: newFileList }) => {
                      setProfileFileList(newFileList);

                      const file = newFileList[0]?.originFileObj;
                      if (file) {
                        try {
                          const filePath = await uploadFile(file, "profile");
                          setUploadedFilePath(filePath);
                        } catch (error) {
                          console.error(
                            "Profile picture upload failed:",
                            error,
                          );
                          setProfileFileList([]);
                          setUploadedFilePath(null);
                        }
                      } else {
                        setUploadedFilePath(null);
                        if (newFileList.length === 0) {
                          setProfileFileList([]);
                        }
                      }
                    }}
                    onRemove={() => {
                      setUploadedFilePath(null);
                      setProfileFileList([]);
                      return true;
                    }}
                  >
                    {profileFileList.length < 1 && (
                      <Button icon={<UploadOutlined />}>
                        Upload Profile Picture
                      </Button>
                    )}
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          </div>
          <Form.Item className={styles.stepControls}>
            <Button type="primary" htmlType="submit">
              Next
            </Button>
          </Form.Item>
        </Form>
      )}

      {step === 2 && renderStepTwoContent()}

      <Modal open={modalVisible} footer={null} closable={false} centered>
        <div className={styles.registerCenter}>
          {modalState === "loading" && (
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
              className={styles.registerSpinner}
            >
              <div style={{ marginTop: 8 }}>Registering...</div>
            </Spin>
          )}
          {modalState === "success" && (
            <div className={styles.registerSuccess}>
              <CheckCircleOutlined style={{ fontSize: 48, color: "green" }} />
              <p>Account successfully created!</p>
              <Button type="primary" href="/login">
                Go to Login
              </Button>
            </div>
          )}
          {modalState === "error" && (
            <div className={styles.registerError}>
              <CloseCircleOutlined style={{ fontSize: 48, color: "red" }} />
              <p>Registration Failed</p>
              <p style={{ color: "#888", fontSize: "small" }}>{errorMessage}</p>
              <Button onClick={() => setModalVisible(false)}>Try Again</Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Driver;
