"use client";
import React, { useEffect, useState } from "react";
import {
  Button,
  Descriptions,
  Divider,
  Form,
  Image,
  Input,
  Spin,
  Switch,
  Rate,
  message,
} from "antd";
import { CameraOutlined, CloseCircleOutlined } from "@ant-design/icons";
import styles from "./Edit.module.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import dayjs from "dayjs";
import Title from "antd/es/typography/Title";
import { getApiDomain } from "@/utils/domain";

const BASE_URL = getApiDomain();

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  proposalId: string;
}

interface ContractData {
  contractId: number;
  title: string;
  contractDescription: string;
  moveDateTime: string;
  fromLocation?: {
    formattedAddress?: string;
    latitude: number;
    longitude: number;
  };
  toLocation?: {
    formattedAddress?: string;
    latitude: number;
    longitude: number;
  };
  length: number;
  width: number;
  height: number;
  mass: number;
  fragile: boolean;
  coolingRequired: boolean;
  rideAlong: boolean;
  manPower: number;
  price: number;
  imagePath1?: string;
  imagePath2?: string;
  imagePath3?: string;
}

const RatingProposal = ({ proposalId }: Props) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [imagePaths, setImagePaths] = useState<string[]>([]);

  const fetchContract = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get<{ contract: ContractData }>(
        `${BASE_URL}/api/v1/contracts/${proposalId}`,
        {
          headers: {
            Authorization: localStorage.getItem("token") || "",
            UserId: localStorage.getItem("userId") || "",
          },
        },
      );
      const contract = res.data.contract;

      if (!contract || !contract.contractId) {
        throw new Error("Invalid contract data structure received from API");
      }

      setContractData(contract);
      setImagePaths(
        [contract.imagePath1, contract.imagePath2, contract.imagePath3].filter(
          (path): path is string => !!path,
        ),
      );
    } catch (err: any) {
      console.error("Error fetching contract details:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to fetch contract details. Please try again.";
      message.error(errorMessage);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  if (loading) {
    return (
      <div className={styles.registerCenter} style={{ padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !contractData) {
    return (
      <div className={styles.registerCenter}>
        <div className={styles.registerError}>
          <CloseCircleOutlined style={{ fontSize: 48, color: "red" }} />
          <p>
            RatingProposal: Something went wrong while fetching the proposal
            details.
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            Back to Overview
          </Button>
        </div>
      </div>
    );
  }

  const onFinishRating = async (values: any) => {
    console.log("Rating form values:", values); // Log form values
    try {
      const payload = {
        contractId: parseInt(proposalId, 10),
        ratingValue: values.rating,
        flagIssues: values.issues || false,
        comment: values.issues ? values.issueDetails || "" : "",
      };
      console.log("Submitting rating payload:", payload); // Log payload before sending
      const response = await axios.post(`${BASE_URL}/api/v1/ratings`, payload, {
        headers: {
          Authorization: localStorage.getItem("token") || "",
          UserId: localStorage.getItem("userId") || "",
        },
      });
      console.log("Rating submission successful:", response.data); // Log successful response
      message.success("Thank you! Your feedback has been submitted.");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Error submitting rating:", err.response?.data || err.message || err); // Log detailed error
      const errorMessage =
        err.response?.data?.message ||
        "Could not submit your rating. Please try again.";
      message.error(errorMessage);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.imageUpload}>
        <div className={styles.imageRow}>
          {[0, 1, 2].map((idx) => (
            <div key={idx} className={styles.imageBox}>
              {imagePaths[idx] ? (
                <Image
                  src={`${BASE_URL}/api/v1/files/download?filePath=${imagePaths[idx]}`}
                  alt={`upload-${idx}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div className={styles.cameraIcon}>
                  <CameraOutlined style={{ fontSize: 28, color: "#999" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.form}>
        <Descriptions title="Contract Details" bordered column={2}>
          <Descriptions.Item label="Title">
            {contractData.title}
          </Descriptions.Item>
          <Descriptions.Item label="Moving Date">
            {dayjs(contractData.moveDateTime).format("YYYY-MM-DD HH:mm")}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {contractData.contractDescription}
          </Descriptions.Item>
          <Descriptions.Item label="From">
            {contractData.fromLocation?.formattedAddress}
          </Descriptions.Item>
          <Descriptions.Item label="To">
            {contractData.toLocation?.formattedAddress}
          </Descriptions.Item>
          <Descriptions.Item label="Dimensions (LxWxH)">
            {`${contractData.length || "-"} x ${contractData.width || "-"} x ${
              contractData.height || "-"
            }`}
          </Descriptions.Item>
          <Descriptions.Item label="Weight (kg)">
            {contractData.mass}
          </Descriptions.Item>
          <Descriptions.Item label="Fragile">
            {contractData.fragile ? "Yes" : "No"}
          </Descriptions.Item>
          <Descriptions.Item label="Cooling Required">
            {contractData.coolingRequired ? "Yes" : "No"}
          </Descriptions.Item>
          <Descriptions.Item label="Ride Along">
            {contractData.rideAlong ? "Yes" : "No"}
          </Descriptions.Item>
          <Descriptions.Item label="Manpower Needed">
            {contractData.manPower}
          </Descriptions.Item>
          <Descriptions.Item label="Price">
            {`€${contractData.price}`}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <Divider />

      <div className={styles.form}>
        <Title level={4}>Rate your experience</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinishRating}
        >
          <Form.Item
            name="rating"
            label="Rating"
            rules={[{ required: true, message: "Please give a rating" }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name="issues"
            label="Were there any issues?"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.issues !== cur.issues}
          >
            {({ getFieldValue }) =>
              getFieldValue("issues") ? (
                <Form.Item
                  name="issueDetails"
                  label="Please describe the issue"
                  rules={[
                    { required: true, message: "Please describe the issue" },
                  ]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Explain what went wrong..."
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Submit Rating
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default RatingProposal;
