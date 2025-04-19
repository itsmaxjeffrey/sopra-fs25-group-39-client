"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Modal } from "antd";
import axios from "axios"; // Import axios

import styles from "./sidebar.module.css";

const Sidebar = ({ accountType: initialAccountType }: { accountType: string | null }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [accountType, setAccountType] = React.useState(initialAccountType);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    console.log("UserId:", userId, "Token:", token); // Debugging log
    if (userId && token) {
      axios
        .get(`http://localhost:8080/api/v1/users/${userId}`, {
          headers: {
            UserId: `${userId}`,
            Authorization: `${token}`,
          },
        })
        .then((res) => {
          setAccountType(res.data.userAccountType);
        })
        .catch((err) => {
          console.error("Failed to fetch user:", err);
          setAccountType(null);
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.push("/");
  };

  return (
    <div className={styles.sidebar}>
      <nav>
        <ul className={styles.navList}>
          <li
            className={`${styles.navItem} ${pathname === "/dashboard" ? styles.active : ""}`}
          >
            <Link href="/dashboard">Home</Link>
          </li>

          {accountType === "DRIVER" && (
            <>
              <li
                className={`${styles.navItem} ${
                  pathname === "/dashboard/contract-overview" ? styles.active : ""
                }`}
              >
                <Link href="/dashboard/contract-overview">Contract Overview</Link>
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