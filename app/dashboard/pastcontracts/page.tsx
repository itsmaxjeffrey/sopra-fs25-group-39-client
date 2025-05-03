"use client";
import "@ant-design/v5-patch-for-react-19";
import React, { useEffect, useState } from "react";
import { Spin, Table } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { getApiDomain } from "@/utils/domain"; // Import the function

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Contract {
  contractId: string;
  moveDateTime: string;
  fromLocation: {
    latitude: number;
    longitude: number;
    formattedAddress?: string;
  }; // Added formattedAddress
  toLocation: {
    latitude: number;
    longitude: number;
    formattedAddress?: string;
  }; // Added formattedAddress
  contractStatus: string;
  title: string; // Added title
}

interface ContractsApiResponse {
  contracts: Contract[];
  timestamp: number;
}

const BASE_URL = getApiDomain(); // Define BASE_URL

const PastContracts = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = typeof window !== "undefined"
    ? localStorage.getItem("userId")
    : null;

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true); // Start loading
      try {
        const token = localStorage.getItem("token");
        const headers = {
          UserId: `${userId}`,
          Authorization: `${token}`,
        };

        // Fetch both COMPLETED and FINALIZED contracts concurrently
        const [completedRes, finalizedRes] = await Promise.all([
          axios.get<ContractsApiResponse>(
            `${BASE_URL}/api/v1/users/${userId}/contracts?status=COMPLETED`,
            { headers },
          ),
          axios.get<ContractsApiResponse>(
            `${BASE_URL}/api/v1/users/${userId}/contracts?status=FINALIZED`,
            { headers },
          ),
        ]);

        // --- DEBUGGING: Log raw API responses ---
        console.log(
          "Raw API response for COMPLETED contracts:",
          completedRes.data,
        );
        console.log(
          "Raw API response for FINALIZED contracts:",
          finalizedRes.data,
        );
        // --- END DEBUGGING ---

        // Combine the contract arrays from both responses
        const completedContracts = (completedRes.data?.contracts &&
            Array.isArray(completedRes.data.contracts))
          ? completedRes.data.contracts
          : [];
        const finalizedContracts = (finalizedRes.data?.contracts &&
            Array.isArray(finalizedRes.data.contracts))
          ? finalizedRes.data.contracts
          : [];
        const combinedContracts = [
          ...completedContracts,
          ...finalizedContracts,
        ];

        // Sort the combined list by move date (most recent first)
        const sortedContracts = combinedContracts.sort((a: any, b: any) =>
          dayjs(b.moveDateTime).valueOf() - dayjs(a.moveDateTime).valueOf()
        );

        // --- DEBUGGING: Log combined and sorted contracts ---
        console.log("Combined and sorted past contracts:", sortedContracts);
        // --- END DEBUGGING ---

        setContracts(sortedContracts);
      } catch (err) {
        console.error("Failed to load past contracts", err);
        setContracts([]); // Set to empty on error
      } finally {
        setLoading(false); // End loading
      }
    };

    if (userId) {
      fetchContracts();
    }
  }, [userId]);

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "From",
      dataIndex: ["fromLocation", "formattedAddress"], // Use formattedAddress
      key: "from",
    },
    {
      title: "To",
      dataIndex: ["toLocation", "formattedAddress"], // Use formattedAddress
      key: "to",
    },
    {
      title: "Date",
      dataIndex: "moveDateTime",
      key: "date",
      render: (text: string) => dayjs(text).format("DD.MM.YYYY HH:mm"),
    },
    { // Added Status column for clarity
      title: "Status",
      dataIndex: "contractStatus",
      key: "status",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1>Past Contracts</h1>
      {loading ? <Spin size="large" /> : (
        <Table
          columns={columns}
          dataSource={contracts}
          rowKey="contractId"
          onRow={(record) => ({
            onClick: () => {
              // Navigate to the proposal page, passing the actual contract status as type
              window.location.href =
                `/dashboard/proposal/${record.contractId}?type=${record.contractStatus}`;
            },
          })}
        />
      )}
    </div>
  );
};

export default PastContracts;
