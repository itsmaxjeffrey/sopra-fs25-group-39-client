"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Modal } from "antd";

import styles from "./sidebar.module.css";

const Sidebar = ({ accountType }: { accountType: string | null }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showConfirm, setShowConfirm] = React.useState(false);

    if (userId && token) {
      axios
        .get(`http://localhost:8080/api/v1/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setAccountType(res.userAccountType);
        })
        .catch((err) => {
          console.error("Failed to fetch user:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("id");
    router.push("/");
  };

  return (
    <div className={styles.sidebar}>
      <nav>
        <ul className={styles.navList}>
          <li
            className={`${styles.navItem} ${pathname === "/dashboard" ? styles.active : ""
              }`}
          >
            <Link href="/dashboard">Home</Link>
          </li>

          {accountType === "driver" && (
            <>
              <li
                className={`${styles.navItem} ${pathname === "/dashboard/contract-overview"
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

          {accountType === "requester" && (
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
            className={`${styles.navItem} ${pathname === "/dashboard/account" ? styles.active : ""
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
