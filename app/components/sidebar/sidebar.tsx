"use client";
import "@ant-design/v5-patch-for-react-19";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { message, Modal } from "antd";
import axios from "axios";
import { getApiDomain } from "@/utils/domain";

import styles from "./sidebar.module.css";

const BASE_URL = getApiDomain();

const Sidebar = ({ accountType }: { accountType: string | null }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      router.push("/");
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/api/v1/auth/logout`,
        {},
        {
          headers: {
            UserId: userId,
            Authorization: `${token}`,
          },
        },
      );

      // console.log("Successfully logged out");
      message.success("Successfully logged out!");
    } catch (error: unknown) {
      console.error("Failed to log out:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Logout failed. Please try again.";

      let finalErrorMessage = errorMessage;
      if (
        error &&
        typeof error === "object" &&
        "isAxiosError" in error &&
        error.isAxiosError === true &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data &&
        typeof error.response.data.message === "string"
      ) {
        finalErrorMessage = error.response.data.message;
      }
      message.error(finalErrorMessage);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      router.push("/");
      setShowConfirm(false);
    }
  };

  return (
    <div className={styles.sidebar}>
      <nav>
        <ul className={styles.navList}>
          <li
            className={`${styles.navItem} ${
              pathname === "/dashboard" ? styles.active : ""
            }`}
          >
            <Link href="/dashboard">Home</Link>
          </li>

          {accountType === "DRIVER" && (
            <>
              <li
                className={`${styles.navItem} ${
                  pathname === "/dashboard/contract-overview"
                    ? styles.active
                    : ""
                }`}
              >
                <Link href="/dashboard/contract-overview">
                  Contract Overview
                </Link>
              </li>
            </>
          )}

          {accountType === "REQUESTER" && (
            <>
              <li
                className={`${styles.navItem} ${
                  pathname === "/dashboard/proposal/new" ? styles.active : ""
                }`}
              >
                <Link href="/dashboard/proposal/new">New Proposal</Link>
              </li>
              <li
                className={`${styles.navItem} ${
                  pathname === "/dashboard/pastcontracts" ? styles.active : ""
                }`}
              >
                <Link href="/dashboard/pastcontracts">Past Contracts</Link>
              </li>
            </>
          )}

          <li
            className={`${styles.navItem} ${
              pathname === "/dashboard/account" ? styles.active : ""
            }`}
          >
            <Link href="/dashboard/account">Profile Settings</Link>
          </li>
          <li
            className={`${styles.navItem} ${
              pathname === "/dashboard/faq" ? styles.active : ""
            }`}
          >
            <Link href="/dashboard/faq">FAQ</Link>
          </li>
        </ul>
      </nav>

      <button
        onClick={() => setShowConfirm(true)}
        className={`${styles.navItem} ${styles.logoutButton}`}
      >
        Logout
      </button>

      <Modal
        title="Confirm Logout"
        open={showConfirm}
        onOk={handleLogout}
        onCancel={() => setShowConfirm(false)}
        okText="Yes, logout"
        cancelText="Cancel"
        centered
      >
        <p>Are you sure you want to log out?</p>
      </Modal>
    </div>
  );
};

export default Sidebar;
