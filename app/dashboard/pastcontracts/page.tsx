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
  const [userId, setUserId] = useState<string | null>(null); // State for userId
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Unified loading state for this page

  useEffect(() => {
    // Effect to read userId from localStorage on mount
    const idFromStorage = localStorage.getItem("userId");
    setUserId(idFromStorage);
  }, []); // Empty dependency array: runs once after initial render

  useEffect(() => {
    // This effect handles fetching contracts when userId is set (or changes)
    if (userId) {
      setIsLoading(true); // Start loading contracts

      const fetchAndSetContracts = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            console.warn(
              "PastContracts: Token not found. Cannot fetch contracts.",
            );
            setContracts([]);
            setIsLoading(false);
            return;
          }
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
          setIsLoading(false); // Stop loading contracts
        }
      };

      fetchAndSetContracts();
    } else {
      // userId is null (either initially, or not found in localStorage)
      setContracts([]); // Clear contracts
      setIsLoading(false); // Ensure not in loading state
    }
  }, [userId]); // Re-run this effect if userId changes

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

  if (isLoading) {
    return (
      <div
        style={{
          padding: 24,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Past Contracts</h1>
      {contracts.length === 0 ? <p>No past contracts found.</p> : (
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
