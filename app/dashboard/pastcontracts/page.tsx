"use client";
import '@ant-design/v5-patch-for-react-19';
import React, { useEffect, useState } from "react";
import { Spin, Table } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { getApiDomain } from "@/utils/domain"; // Import the function

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Contract {
  contractId: string;
  moveDateTime: string;
  fromLocation: { latitude: number; longitude: number; formattedAddress?: string }; // Added formattedAddress
  toLocation: { latitude: number; longitude: number; formattedAddress?: string }; // Added formattedAddress
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
      try {
        const token = localStorage.getItem("token");
        // Fetch only FINALIZED contracts from the API
        const res = await axios.get<ContractsApiResponse>( // Use the new interface
          `${BASE_URL}/api/v1/users/${userId}/contracts?status=FINALIZED`, // Added status=FINALIZED filter
          {
            headers: {
              UserId: `${userId}`,
              Authorization: `${token}`,
            },
          },
        );

        // --- DEBUGGING: Log raw API response ---
        console.log("Raw API response for finalized contracts:", res.data);
        // --- END DEBUGGING ---

        // Access the 'contracts' array within the response data
        if (!res.data || !Array.isArray(res.data.contracts)) {
          console.error("Invalid API response structure:", res.data);
          setContracts([]); // Set to empty array if structure is wrong
          return; // Exit early
        }

        // Sort the finalized contracts by move date (most recent first)
        const finalizedContracts = res.data.contracts // Access the array here
          .sort((a: any, b: any) =>
            dayjs(b.moveDateTime).valueOf() - dayjs(a.moveDateTime).valueOf()
          );

        // --- DEBUGGING: Log sorted contracts ---
        console.log("Sorted finalized contracts:", finalizedContracts);
        // --- END DEBUGGING ---

        setContracts(finalizedContracts);
      } catch (err) {
        console.error("Failed to load finalized contracts", err);
      } finally {
        setLoading(false);
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
              // Navigate to the proposal page, keeping the type=FINALIZED
              window.location.href =
                `/dashboard/proposal/${record.contractId}?type=FINALIZED`;
            },
          })}
        />
      )}
    </div>
  );
};

export default PastContracts;
