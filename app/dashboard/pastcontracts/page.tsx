"use client";
import React, { useEffect, useState } from "react";
import { Table, Spin } from "antd";
import axios from "axios";
import dayjs from "dayjs";

const PastContracts = () => {
const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = typeof window !== "undefined" ? localStorage.getItem("id") : null;

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/v1/users/${userId}/contracts`);
        const now = dayjs().startOf("day");

        const past = res.data
          .filter((c: any) => dayjs(c.moveDateTime).isBefore(now))
          .sort((a: any, b: any) =>
            dayjs(b.moveDateTime).valueOf() - dayjs(a.moveDateTime).valueOf()
          );

        setContracts(past);
      } catch (err) {
        console.error("Failed to load contracts", err);
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
      dataIndex: ["fromLocation", "address"],
      key: "from",
    },
    {
      title: "To",
      dataIndex: ["toLocation", "address"],
      key: "to",
    },
    {
      title: "Date",
      dataIndex: "moveDateTime",
      key: "date",
      render: (text: string) => dayjs(text).format("DD.MM.YYYY HH:mm"),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1>Past Contracts</h1>
      {loading ? (
        <Spin size="large" />
      ) : (
        <Table
          columns={columns}
          dataSource={contracts}
          rowKey="contractId"
          onRow={(record) => ({
            onClick: () => {
              window.location.href = `/dashboard/proposal/${record.contractId}?type=FINALIZED`;
            },
          })}
        />
      )}
    </div>
  );
};

export default PastContracts;
