"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { message, Modal } from "antd"; // Import message
import axios from "axios"; // Import axios
import { getApiDomain } from "@/utils/domain"; // Import the function

import styles from "./sidebar.module.css";

const BASE_URL = getApiDomain(); // Define BASE_URL

const Sidebar = (
  { accountType: initialAccountType }: { accountType: string | null },
) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [accountType, setAccountType] = React.useState(initialAccountType);

  React.useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      console.log("UserId:", userId, "Token:", token);
      if (userId && token) {
        try {
          const response = await axios.get(`${BASE_URL}/api/v1/users/${userId}`, { // Use BASE_URL
            headers: {
              UserId: `${userId}`,
              Authorization: `${token}`,
            },
          });
          const data = response.data as { userAccountType: string };
          setAccountType(data.userAccountType);
        } catch (error) {
          console.error("Failed to fetch user:", error);
          setAccountType(null);
        }
      }
    };
    fetchUserData();
  }, []);

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

      console.log("Successfully logged out");
      message.success("Successfully logged out!"); // Add success message
    } catch (error: any) { // Add type annotation
      console.error("Failed to log out:", error);
      // Add error message
      const errorMessage = error.response?.data?.message || "Logout failed. Please try again.";
      message.error(errorMessage);
    } finally {
      // Clear storage and redirect regardless of API call success/failure
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      router.push("/");
      setShowConfirm(false); // Close the confirmation modal
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
