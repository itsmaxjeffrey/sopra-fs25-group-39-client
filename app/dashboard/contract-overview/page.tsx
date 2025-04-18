"use client";
import React, { useEffect, useState } from "react";
import styles from "./ProposalsOverview.module.css";
import axios from "axios";
import { Spin } from "antd";
import Link from "next/link";
import {
  CalendarOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  LockOutlined,
} from "@ant-design/icons";

interface Proposal {
  contractId: number;
  title: string;
  moveDateTime: string;
  creationDateTime: string;
  contractStatus: "REQUESTED" | "OFFERED" | "ACCEPTED";
  fromLocation: { address: string };
  toLocation: { address: string };
  price: number;
  fragile?: boolean;
  coolingRequired?: boolean;
  rideAlong?: boolean;
}

const ProposalsOverview = () => {
  const [contracts, setContracts] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("id");
    const token = localStorage.getItem("token");

    if (!id || !token) return;

    axios
      .get(`http://localhost:5001/api/v1/users/${id}/contracts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        const sorted = res.data.sort(
          (a: Proposal, b: Proposal) =>
            new Date(a.creationDateTime).getTime() -
            new Date(b.creationDateTime).getTime(),
        );
        setContracts(sorted);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
  }, [contracts]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const username = localStorage.getItem("username");

  if (loading) {
    return (
      <div className={styles.center}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.greeting}>
        <h1>
          {getGreeting()}, {username} 👋
        </h1>
        <p>Here’s a quick overview of your move requests</p>
      </div>

      <div className={styles.section}>
        <h2>
          <ClockCircleOutlined />Pending Confirmation by Requester
        </h2>
        <div className={styles.cardRow}>
          {contracts.filter((c) => c.contractStatus === "REQUESTED").length ===
              0
            ? <p className={styles.emptySection}>No open proposals</p>
            : (
              contracts
                .filter((c) => c.contractStatus === "REQUESTED")
                .map((c) => (
                  <Link
                    key={c.contractId}
                    href={`/dashboard/proposal/${c.contractId}?type=${c.contractStatus}`}
                    className={styles.link}
                  >
                    <div className={styles.card}>
                      <div className={styles.icon}>
                        <FileTextOutlined />
                      </div>
                      <h3>{c.title}</h3>
                      <p>
                        <CalendarOutlined />{" "}
                        {new Date(c.moveDateTime).toLocaleString()}
                      </p>
                      <p>
                        <EnvironmentOutlined /> {c.fromLocation.address} ➝{" "}
                        {c.toLocation.address}
                      </p>
                    </div>
                  </Link>
                ))
            )}
        </div>
      </div>

      <div className={styles.section}>
        <h2>
          <LockOutlined /> Locked-In Contracts
        </h2>
        <div className={styles.cardRow}>
          {contracts.filter((c) => c.contractStatus === "OFFERED").length ===
              0
            ? <p className={styles.emptySection}>Nothing pending</p>
            : (
              contracts
                .filter((c) => c.contractStatus === "OFFERED")
                .map((c) => (
                  <Link
                    key={c.contractId}
                    href={`/dashboard/proposal/${c.contractId}?type=${c.contractStatus}`}
                    className={styles.link}
                  >
                    <div className={styles.card}>
                      <div className={styles.icon}>
                        <ClockCircleOutlined />
                      </div>
                      <h3>{c.title}</h3>
                      <p>
                        <CalendarOutlined />{" "}
                        {new Date(c.moveDateTime).toLocaleString()}
                      </p>
                      <p>
                        <EnvironmentOutlined /> {c.fromLocation.address} ➝{" "}
                        {c.toLocation.address}
                      </p>
                    </div>
                  </Link>
                ))
            )}
        </div>
      </div>

      <div className={styles.section}>
        <h2>
          <CheckOutlined /> Fulfilled Contracts
        </h2>
        <div className={styles.cardRow}>
          {contracts.filter((c) => c.contractStatus === "ACCEPTED").length ===
              0
            ? <p className={styles.emptySection}>No confirmed moves</p>
            : (
              contracts
                .filter((c) => c.contractStatus === "ACCEPTED")
                .map((c) => (
                  <Link
                    key={c.contractId}
                    href={`/dashboard/proposal/${c.contractId}?type=${c.contractStatus}`}
                    className={styles.link}
                  >
                    <div className={styles.card}>
                      <div className={styles.icon}>
                        <LockOutlined />
                      </div>
                      <h3>{c.title}</h3>
                      <p>
                        <CalendarOutlined />{" "}
                        {new Date(c.moveDateTime).toLocaleString()}
                      </p>
                      <p>
                        <EnvironmentOutlined /> {c.fromLocation.address} ➝{" "}
                        {c.toLocation.address}
                      </p>
                    </div>
                  </Link>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default ProposalsOverview;
