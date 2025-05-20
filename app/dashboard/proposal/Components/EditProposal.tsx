"use client";
import "@ant-design/v5-patch-for-react-19";
import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message, // Import message
  Modal,
  Row,
  // Spin, // Spin import can be removed if no page-level spinner is used
  Switch,
  Upload, // Added Upload
} from "antd";
import type { UploadFile } from "antd/es/upload/interface"; // Added UploadFile type
import { CameraOutlined, CloseCircleOutlined } from "@ant-design/icons"; // Removed UploadOutlined
import styles from "./Edit.module.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import dayjs from "dayjs";
import { Autocomplete } from "@react-google-maps/api";
import { getApiDomain } from "@/utils/domain";

const BASE_URL = getApiDomain();

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  proposalId: string;
}

const EditProposalFormPage = ({ proposalId }: Props) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [changed, setChanged] = useState(false);
  // fetchContractError: Stores the error message if fetching initial contract details fails.
  const [fetchContractError, setFetchContractError] = useState<string | null>(
    null,
  );
  // modalVisible state is removed. Modal visibility is now controlled by fetchContractError.
  const fromRef = useRef<any>(null);
  const toRef = useRef<any>(null);
  const [fromCoords, setFromCoords] = useState({ address: "", lat: 0, lng: 0 });
  const [toCoords, setToCoords] = useState({ address: "", lat: 0, lng: 0 });
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [imagePaths, setImagePaths] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]); // Ensure 3 slots, initialized to null

  const fetchContract = async () => {
    // setIsLoadingContract(true); // Removed
    setFetchContractError(null); // Reset any previous error message
    try {
      if (!proposalId) {
        throw new Error("Proposal ID is missing");
      }
      const res = await axios.get<{ contract: any }>(
        `${BASE_URL}/api/v1/contracts/${proposalId}`,
        {
          headers: {
            Authorization: localStorage.getItem("token") || "",
            userId: localStorage.getItem("userId") || "",
          },
        },
      );

      const data = res.data.contract;
      if (!data || !data.contractId) {
        throw new Error("Invalid contract data");
      }

      form.setFieldsValue({
        title: data.title,
        description: data.contractDescription,
        moveDate: dayjs(data.moveDateTime),
        from: data.fromLocation?.formattedAddress,
        to: data.toLocation?.formattedAddress,
        length: data.length,
        width: data.width,
        height: data.height,
        fragile: data.fragile,
        cooling: data.coolingRequired,
        rideAlong: data.rideAlong,
        manPower: data.manPower,
        price: data.price,
        weight: data.weight,
      });

      setFromCoords({
        address: data.fromLocation?.formattedAddress || "",
        lat: data.fromLocation?.latitude,
        lng: data.fromLocation?.longitude,
      });
      setToCoords({
        address: data.toLocation?.formattedAddress || "",
        lat: data.toLocation?.latitude,
        lng: data.toLocation?.longitude,
      });

      // Ensure imagePaths has 3 elements, padding with null if necessary
      const photosFromServer = data.contractPhotos || [];
      const newImagePaths: (string | null)[] = [null, null, null];
      for (let i = 0; i < Math.min(photosFromServer.length, 3); i++) {
        newImagePaths[i] = photosFromServer[i];
      }
      setImagePaths(newImagePaths);

      // Reset error and modal states
      // setError(false) and setModalVisible(false) are removed.
      setChanged(false);
    } catch (error: any) { // Ensure error is typed if accessing properties like error.message
      console.error("Error fetching contract:", error);
      setFetchContractError(
        error.message ||
          "Something went wrong while fetching the proposal details.",
      ); // Set error message
    } finally {
      // setIsLoadingContract(false); // Removed
    }
  };

  const handleCancelProposal = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const userId = localStorage.getItem("userId") || "";

      if (!token || !userId) {
        console.error("Authentication details missing for cancel.");
        message.error("Authentication details missing. Please log in again."); // Add error message
        return;
      }

      await axios.delete(`${BASE_URL}/api/v1/contracts/${proposalId}`, {
        headers: {
          Authorization: token,
          UserId: userId,
        },
      });
      message.success("Proposal cancelled successfully!"); // Add success message
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Cancel failed:", error);
      const errorMessage = error.response?.data?.message ||
        "Failed to cancel the proposal. Please try again.";
      message.error(errorMessage);
    }
  };

  useEffect(() => {
    fetchContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  const handleImageUpload = async (file: File, idx: number) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      message.error("Authentication details missing. Cannot upload file.");
      return false;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "proposal");

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

      const newPaths = [...imagePaths];
      newPaths[idx] = response.data.filePath;
      setImagePaths(newPaths);
      setChanged(true);
      message.success(`Image ${idx + 1} uploaded successfully!`);
    } catch (error) {
      console.error("Error uploading file:", error);
      message.error("Error uploading file. Please try again.");
    }
    return false; // Prevent antd default upload
  };

  const handleImageDelete = async (idx: number) => {
    const pathToDelete = imagePaths[idx];
    if (!pathToDelete) return;

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      message.error("Authentication details missing. Cannot delete file.");
      return;
    }

    try {
      await axios.delete(
        `${BASE_URL}/api/v1/files/delete?filePath=${pathToDelete}`,
        {
          headers: {
            UserId: `${userId}`,
            Authorization: `${token}`,
          },
        },
      );

      const newPaths = [...imagePaths];
      newPaths[idx] = null;
      setImagePaths(newPaths);
      setChanged(true);
      message.success(`Image ${idx + 1} deleted successfully!`);
    } catch (error) {
      console.error("Error deleting file from server:", error);
      message.error("Error deleting file from server. Please try again.");
      // Optionally, do not clear the image from UI if server deletion fails
    }
  };

  const onFinish = async (values: any) => {
    const payload = {
      title: values.title,
      contractDescription: values.description,
      moveDateTime: values.moveDate?.format("YYYY-MM-DDTHH:mm:ss"),
      fromLocation: {
        latitude: fromCoords.lat,
        longitude: fromCoords.lng,
        address: fromCoords.address, // Use state address for consistency
      },
      toLocation: {
        latitude: toCoords.lat,
        longitude: toCoords.lng,
        address: toCoords.address, // Use state address for consistency
      },
      length: Number(values.length),
      width: Number(values.width),
      height: Number(values.height),
      fragile: values.fragile,
      coolingRequired: values.cooling,
      rideAlong: values.rideAlong,
      manPower: parseInt(values.manPower) || 0, // Ensure it's a number, default to 0
      price: parseFloat(values.price),
      weight: Number(values.weight),
      contractPhotos: imagePaths.filter((path) => path !== null) as string[], // Added contractPhotos
    };

    try {
      const response = await axios.put(
        `${BASE_URL}/api/v1/contracts/${proposalId}`,
        payload,
        {
          headers: {
            Authorization: localStorage.getItem("token") || "",
            UserId: localStorage.getItem("userId") || "",
          },
        },
      );
      console.log("PUT response:", response.data);
      setChanged(false);
      message.success("Proposal updated successfully!"); // Add success message
    } catch (err: any) {
      console.error("PUT failed:", err.response?.data || err.message);
      // Add error message
      const backendMessage = err.response?.data?.message;
      message.error(
        backendMessage || err.message || "Failed to update proposal.",
      );
    }
  };
  // No page-level loading spinner is rendered here.
  // The page structure will be visible while isLoadingContract is true.

  return (
    <div className={styles.wrapper}>
      {/* Bild Upload */}
      <div className={styles.imageUpload}>
        <div className={styles.imageRow}>
          {[0, 1, 2].map((idx) => {
            const currentPath = imagePaths[idx];
            const antdFileList: UploadFile[] = currentPath
              ? [
                {
                  uid: `file-${idx}-${currentPath}`,
                  name:
                    currentPath.substring(currentPath.lastIndexOf("/") + 1) ||
                    `image-${idx}.png`,
                  status: "done",
                  url:
                    `${BASE_URL}/api/v1/files/download?filePath=${currentPath}`,
                  thumbUrl:
                    `${BASE_URL}/api/v1/files/download?filePath=${currentPath}`,
                },
              ]
              : [];

            return (
              <div key={idx} className={styles.imageBox}>
                <Upload
                  listType="picture-card"
                  fileList={antdFileList}
                  maxCount={1}
                  beforeUpload={(file) => handleImageUpload(file, idx)}
                  onRemove={async () => {
                    // Modified onRemove
                    // The actual deletion logic (state update, backend call) is in handleImageDelete
                    await handleImageDelete(idx);
                    // After handleImageDelete has updated imagePaths, the component will re-render.
                    // antdFileList for this slot will become [].
                    // Returning true tells AntD to proceed with removing the item from its display.
                    return true;
                  }}
                  // To show preview from AntD, ensure 'url' is in fileList item
                >
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

      {/* Formular */}
      <Form
        layout="vertical"
        className={styles.form}
        form={form}
        onValuesChange={() => setChanged(true)}
        onFinish={onFinish}
      >
        <Form.Item label="Title" name="title">
          <Input placeholder="Give your proposal a fitting name" />
        </Form.Item>

        <Form.Item name="description">
          <Input.TextArea
            rows={3}
            placeholder="Describe what you want to move"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Moving Date" name="moveDate">
              <DatePicker
                style={{ width: "100%" }}
                showTime={{ format: "HH:mm", showSecond: false }}
                disabledDate={(current) =>
                  current && current < dayjs().startOf("minute")}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="From" name="from">
              <Autocomplete
                onLoad={(auto) => (fromRef.current = auto)}
                onPlaceChanged={() => {
                  const place = fromRef.current?.getPlace();
                  if (place && place.geometry) {
                    const address = place.formatted_address;
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    form.setFieldsValue({ from: address });
                    setFromCoords({ address, lat, lng });
                  }
                }}
              >
                <Input
                  placeholder="Select where your belongings should be picked up"
                  value={fromCoords.address}
                  onChange={(e) => {
                    setFromCoords((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }));
                    setChanged(true);
                  }}
                />
              </Autocomplete>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="To" name="to">
              <Autocomplete
                onLoad={(auto) => (toRef.current = auto)}
                onPlaceChanged={() => {
                  const place = toRef.current?.getPlace();
                  if (place && place.geometry) {
                    const address = place.formatted_address;
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    form.setFieldsValue({ to: address });
                    setToCoords({ address, lat, lng });
                  }
                }}
              >
                <Input
                  placeholder="Select where your belongings should be moved to"
                  value={toCoords.address}
                  onChange={(e) => {
                    setToCoords((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }));
                    setChanged(true);
                  }}
                />
              </Autocomplete>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Dimensions (Length)" name="length">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Dimensions (Width)" name="width">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Dimensions (Height)" name="height">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Weight (kg)" name="weight">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="My belongings are fragile"
              name="fragile"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="My belongings require cooling"
              name="cooling"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="I want to ride along"
              name="rideAlong"
              valuePropName="checked"
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
                placeholder="How many people do you need?"
                style={{ width: "100%" }}
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Price proposal" name="price">
              <InputNumber style={{ width: "100%" }} min={0} step={1} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Row justify="start" gutter={16}>
            <Col>
              <Button disabled={!changed} type="primary" htmlType="submit">
                Save Changes
              </Button>
            </Col>
            {changed && (
              <Col>
                <Button onClick={() => fetchContract()}>Reset</Button>
              </Col>
            )}
            <Col>
              <Button
                danger
                type="primary"
                onClick={() => setIsCancelModalOpen(true)}
              >
                Cancel Proposal
              </Button>
            </Col>
          </Row>
        </Form.Item>
      </Form>
      {/* Modal: Now only for fetch errors */}
      <Modal
        open={!!fetchContractError} // Modal is open if there is an error message
        footer={null}
        closable={false} // Consider making closable true or providing explicit close in footer
        centered
        onCancel={() => {
          setFetchContractError(null);
          // Decide if navigating away is appropriate or allow user to stay on page
          // router.push("/dashboard");
        }}
      >
        <div className={styles.registerCenter}>
          {/* Modal content is now only for error display */}
          {/* No loading condition inside the modal */}
          <div className={styles.registerError}>
            <CloseCircleOutlined style={{ fontSize: 48, color: "red" }} />
            <p>
              {/* Use the specific error message from fetchContractError */}
              {fetchContractError ||
                "Something went wrong while fetching the proposal details."}
            </p>
            <Row justify="center" gutter={16}>
              <Col>
                <Button
                  type="primary"
                  onClick={() => {
                    setFetchContractError(null); // Clear error
                    router.push("/dashboard/proposal/new");
                  }}
                >
                  Create New
                </Button>
              </Col>
              <Col>
                <Button
                  onClick={() => {
                    setFetchContractError(null);
                    router.push("/dashboard");
                  }}
                >
                  Back to Overview
                </Button>
              </Col>
            </Row>
          </div>
        </div>
      </Modal>
      <Modal
        title="Cancel Proposal"
        open={isCancelModalOpen}
        onOk={handleCancelProposal}
        onCancel={() => setIsCancelModalOpen(false)}
        okText="Yes, cancel it"
        cancelText="No"
        centered
      >
        <p>Are you sure you want to cancel this proposal?</p>
        <p>This will also delete the proposal!</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default EditProposalFormPage;
