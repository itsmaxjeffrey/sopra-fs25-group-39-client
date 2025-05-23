"use client";
import "@ant-design/v5-patch-for-react-19";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Switch,
  Upload,
} from "antd";
import {
  CameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { Autocomplete } from "@react-google-maps/api";
import styles from "./New.module.css";
import dayjs from "dayjs";
import { getApiDomain } from "@/utils/domain";
import type { UploadFile } from "antd/es/upload/interface"; // Import UploadFile type

const BASE_URL = getApiDomain();

/* eslint-disable @typescript-eslint/no-explicit-any */

const NewProposalFormPage = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  // Modal state will now only be 'success' or 'error', or null initially
  const [modalState, setModalState] = useState<"success" | "error" | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for button loading
  const [fromCoords, setFromCoords] = useState({ address: "", lat: 0, lng: 0 });
  const [toCoords, setToCoords] = useState({ address: "", lat: 0, lng: 0 });
  const fromRef = useRef<any>(null);
  const toRef = useRef<any>(null);
  const [uploadedPaths, setUploadedPaths] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);

  const handleUpload = async (file: File, idx: number) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "proposal");

    if (!token || !userId) return;

    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/files/upload`,
        formData,
        {
          headers: {
            UserId: `${userId}`,
            Authorization: `${token}`,
          },
        },
      );

      if (!response.data.filePath) {
        throw new Error("File path is missing in the response");
      }

      const newPaths = [...uploadedPaths];
      newPaths[idx] = response.data.filePath;
      setUploadedPaths(newPaths);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleFinish = async (values: any) => {
    // console.log("Submitting values:", values);
    setIsSubmitting(true); // Set button loading state
    // setModalState("loading") and setModalVisible(true) for loading are removed

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    // *** Log the specific values being used for address ***
    // console.log("Address from values.from:", values.from);
    // console.log("Address from values.to:", values.to);

    const payload = {
      title: values.title,
      contractDescription: values.description,
      moveDateTime: values.moveDate?.format("YYYY-MM-DDTHH:mm:ss"),
      fromLocation: {
        latitude: fromCoords.lat,
        longitude: fromCoords.lng,
        formattedAddress: values.from, // Using form value
      },
      toLocation: {
        latitude: toCoords.lat,
        longitude: toCoords.lng,
        formattedAddress: values.to, // Using form value
      },
      length: Number(values.length),
      width: Number(values.width),
      height: Number(values.height),
      weight: Number(values.weight),
      fragile: values.fragile,
      coolingRequired: values.cooling,
      rideAlong: values.rideAlong,
      // Add fallback for parseInt in case manPower is empty/undefined
      manPower: parseInt(values.manPower) || 0,
      price: parseFloat(values.price),
      contractStatus: "REQUESTED",
      requesterId: userId ? parseInt(userId) : null,
      imagePath1: uploadedPaths[0],
      imagePath2: uploadedPaths[1],
      imagePath3: uploadedPaths[2],
    };

    try {
      console.log(
        "Payload From Address:",
        payload.fromLocation.formattedAddress,
      );
      console.log("Payload To Address:", payload.toLocation.formattedAddress);
      console.log("WOULD SEND:", JSON.stringify(payload, null, 2));
      await axios.post(`${BASE_URL}/api/v1/contracts`, payload, {
        headers: {
          UserId: `${userId}`,
          Authorization: `${token}`,
        },
        withCredentials: true,
      });
      setModalState("success");
      setModalVisible(true); // Show modal for success
    } catch (err: any) {
      console.error("Creation failed", err);
      // Extract more specific error message if available
      const backendMessage = err.response?.data?.message;
      setErrorMessage(
        backendMessage ||
          err.message ||
          "Something went wrong while creating your proposal.",
      );
      setModalState("error");
      setModalVisible(true); // Show modal for error
    } finally {
      setIsSubmitting(false); // Reset button loading state
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Image Upload Section */}
      <div className={styles.imageUpload}>
        <div className={styles.imageRow}>
          {[0, 1, 2].map((idx) => {
            const currentPath = uploadedPaths[idx];
            const antdFileList: UploadFile[] = currentPath
              ? [
                {
                  uid: `file-${idx}-${currentPath}`, // Unique ID for the file
                  name:
                    currentPath.substring(currentPath.lastIndexOf("/") + 1) ||
                    `image-${idx}.png`, // Filename
                  status: "done", // Status of the file
                  url:
                    `${BASE_URL}/api/v1/files/download?filePath=${currentPath}`, // URL for preview
                  thumbUrl:
                    `${BASE_URL}/api/v1/files/download?filePath=${currentPath}`, // URL for thumbnail
                },
              ]
              : [];

            return (
              <div key={idx} className={styles.imageBox}>
                <Upload
                  listType="picture-card"
                  fileList={antdFileList} // Controlled fileList
                  maxCount={1}
                  beforeUpload={(uploadedFile) => {
                    handleUpload(uploadedFile, idx);
                    return false; // Prevent antd default upload
                  }}
                  onRemove={async () => {
                    // file parameter is the AntD UploadFile object
                    const pathToRemove = uploadedPaths[idx];

                    if (!pathToRemove) return true; // Should not happen if remove icon is visible

                    // Optimistically update UI by modifying uploadedPaths
                    const newPaths = [...uploadedPaths];
                    newPaths[idx] = null;
                    setUploadedPaths(newPaths);

                    // Call backend to delete the file
                    const token = localStorage.getItem("token");
                    const userId = localStorage.getItem("userId");
                    if (token && userId) {
                      try {
                        await axios.delete(
                          `${BASE_URL}/api/v1/files/delete?filePath=${pathToRemove}`,
                          {
                            headers: {
                              UserId: `${userId}`,
                              Authorization: `${token}`,
                            },
                          },
                        );
                        // console.log("File deleted from server:", pathToRemove);
                      } catch (error) {
                        console.error(
                          "Error deleting file from server:",
                          pathToRemove,
                          error,
                        );
                        // Optionally, handle UI revert or user notification here
                        // For now, we'll allow the UI removal to persist
                      }
                    } else {
                      console.error(
                        "Authentication details missing, cannot delete file from server.",
                      );
                    }
                    return true; // Confirm removal from AntD's list
                  }}
                  // showUploadList is true by default for picture-card
                  // Ant Design's default preview (on eye icon click) will use the 'url' from antdFileList.
                >
                  {/* Conditionally render the upload trigger (camera icon) */}
                  {antdFileList.length === 0
                    ? (
                      <div className={styles.cameraIcon}>
                        <CameraOutlined
                          style={{ fontSize: 28, color: "#999" }}
                        />
                      </div>
                    )
                    : null}
                </Upload>
              </div>
            );
          })}
        </div>
      </div>

      <Form
        layout="vertical"
        className={styles.form}
        form={form}
        onFinish={handleFinish}
      >
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter a title" }]}
        >
          <Input placeholder="Give your proposal a fitting name" />
        </Form.Item>

        <Form.Item
          name="description"
          rules={[{ required: true, message: "Please enter a description" }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Describe what you want to move"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Moving Date and Time"
              name="moveDate"
              rules={[{ required: true, message: "Please select a move date" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                showTime={{ format: "HH:mm", showSecond: false }}
                disabledDate={(current) =>
                  current && current < dayjs().startOf("minute")}
                placeholder="Select Date and Time"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="From"
              name="from"
              rules={[
                { required: true, message: "Please enter pickup location" },
              ]}
            >
              <Autocomplete
                onLoad={(auto) => (fromRef.current = auto)}
                onPlaceChanged={() => {
                  const place = fromRef.current?.getPlace();
                  if (place && place.geometry) {
                    const address = place.formatted_address;
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    setFromCoords({ address, lat, lng });
                    form.setFieldsValue({ from: address });
                  }
                }}
              >
                <Form.Item name="from" noStyle>
                  <Input placeholder="Enter Your Pick-Up Location" />
                </Form.Item>
              </Autocomplete>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="To"
              name="to"
              rules={[
                { required: true, message: "Please enter drop-off location" },
              ]}
            >
              <Autocomplete
                onLoad={(auto) => (toRef.current = auto)}
                onPlaceChanged={() => {
                  const place = toRef.current?.getPlace();
                  if (place && place.geometry) {
                    const address = place.formatted_address;
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    setToCoords({ address, lat, lng });
                    form.setFieldsValue({ to: address });
                  }
                }}
              >
                <Form.Item name="to" noStyle>
                  <Input placeholder="Enter Your Drop-Off Location" />
                </Form.Item>
              </Autocomplete>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="Length (cm)"
              name="length"
              rules={[{ required: true, message: "Please enter length" }]}
            >
              <InputNumber
                placeholder="100 cm"
                style={{ width: "100%" }}
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Width (cm)"
              name="width"
              rules={[{ required: true, message: "Please enter width" }]}
            >
              <InputNumber
                placeholder="100 cm"
                style={{ width: "100%" }}
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Height (cm)"
              name="height"
              rules={[{ required: true, message: "Please enter height" }]}
            >
              <InputNumber
                placeholder="100 cm"
                style={{ width: "100%" }}
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Weight (kg)"
              name="weight"
              rules={[{ required: true, message: "Please enter height" }]}
            >
              <InputNumber
                placeholder="50 kg"
                style={{ width: "100%" }}
                min={0}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="My belongings are fragile"
              name="fragile"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="My belongings require cooling"
              name="cooling"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="I want to ride along"
              name="rideAlong"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="I need help loading my belongings into the car"
              name="manPower"
            >
              <InputNumber
                placeholder="How many people do you need? (Empty for 0)"
                style={{ width: "100%" }}
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Price proposal"
              name="price"
              rules={[
                {
                  required: true,
                  message: "Please enter your price proposal",
                },
              ]}
            >
              <InputNumber
                placeholder="CHF"
                style={{ width: "100%" }}
                min={0}
                step={1}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={isSubmitting}>
            Create Proposal
          </Button>
        </Form.Item>
      </Form>
      {/* Modal: Now only for success or error */}
      <Modal
        open={modalVisible &&
          (modalState === "success" || modalState === "error")}
        footer={null}
        closable={false}
        centered
        onCancel={() => { // Define onCancel behavior if needed, e.g., for error modal
          setModalVisible(false);
          setModalState(null);
        }}
      >
        <div className={styles.registerCenter}>
          {/* Loading state removed from modal content */}
          {modalState === "success" && (
            <div className={styles.registerSuccess}>
              <CheckCircleOutlined
                style={{ fontSize: 48, color: "green", marginBottom: "20px" }}
              />
              <p>Proposal successfully created!</p>
              <Button
                type="primary"
                onClick={() => {
                  setModalVisible(false);
                  setModalState(null);
                  router.push("/dashboard");
                }}
              >
                Great!
              </Button>
            </div>
          )}
          {modalState === "error" && (
            <div className={styles.registerError}>
              <CloseCircleOutlined
                style={{ fontSize: 48, color: "red", marginBottom: "20px" }}
              />
              <p>
                {errorMessage ||
                  "Something went wrong while creating your proposal."}
              </p>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setModalState(null);
                }}
              >
                OK
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default NewProposalFormPage;
