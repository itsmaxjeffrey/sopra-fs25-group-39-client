"use client";
import React, { useContext } from "react";
import {
  ClockCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import styles from "./FAQ.module.css";
import AccountTypeContext from "../AccountTypeContext";

const FAQPage = () => {
  const accountType = useContext(AccountTypeContext);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Frequently Asked Questions</h1>
        <p>
          <InfoCircleOutlined /> This platform connects people who need to
          <strong>shift items</strong>{" "}
          (like furniture) with drivers who have the right vehicle. We{" "}
          <strong>do not handle payments</strong>{" "}
          – phone numbers are swaped so both parties can connect directly.
        </p>
        <p className={styles.warning}>
          <WarningOutlined /> <strong>Please be cautious!</strong>{" "}
          Never send money in advance. Meet in person, verify delivery, and
          agree on fair payment. Your privacy and safety are important.
        </p>
      </div>

      <div className={styles.section}>
        <h2>
          <FileTextOutlined /> Proposal Lifecycle
        </h2>

        <div className={styles.timelineContainer}>
          <div className={styles.timeline}>
            <h3>For Requesters</h3>
            <ol>
              <li>
                Create a proposal with origin, destination, item details, and
                your price offer.
              </li>
              <li>
                Your proposal becomes visible to drivers (status:{" "}
                <strong>Requested</strong>).
              </li>
              <li>
                Drivers can accept it (status becomes <strong>Offered</strong>).
              </li>
              <li>
                You review drivers who accepted and confirm one (status:{" "}
                <strong>Accepted</strong>).
              </li>
              <li>
                After the shift date, rate the driver. The proposal is archived.
              </li>
            </ol>
          </div>

          <div className={styles.timeline}>
            <h3>For Drivers</h3>
            <ol>
              <li>View open proposals on the map and apply filters.</li>
              <li>Accept a proposal that fits your route and capacity.</li>
              <li>
                Wait for the requester to confirm you (status:{" "}
                <strong>Offered</strong>).
              </li>
              <li>
                If selected, your move is confirmed (status:{" "}
                <strong>Accepted</strong>).
              </li>
              <li>After the move, receive a rating from the requester.</li>
            </ol>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2>
          <PhoneOutlined /> Account-Specific FAQs
        </h2>

        {accountType === "DRIVER"
          ? (
            <>
              <div className={styles.qaBox}>
                <div className={styles.question}>
                  How do I accept a proposal?
                </div>
                <div className={styles.answer}>
                  Go to the map view, find a proposal that fits your route, and
                  click &quot;Accept&quot;. The requester will then review and possibly
                  confirm you.
                </div>
              </div>
              <div className={styles.qaBox}>
                <div className={styles.question}>
                  What should I do if I face issues during a delivery?
                </div>
                <div className={styles.answer}>
                  Contact the requester directly using the shared phone number.
                  If needed, report any serious concerns to our support team at
                  support@zueglig.ch
                </div>
              </div>
              <div className={styles.qaBox}>
                <div className={styles.question}>
                  How do I update my vehicle information?
                </div>
                <div className={styles.answer}>
                  Navigate to your profile page and edit your vehicle details
                  under the &quot;Vehicle Info&quot; section.
                </div>
              </div>
            </>
          )
          : accountType === "REQUESTER"
          ? (
            <>
              <div className={styles.qaBox}>
                <div className={styles.question}>
                  How do I create a new proposal?
                </div>
                <div className={styles.answer}>
                  Click &quot;New Proposal&quot;, then fill in your pickup and drop-off
                  points, item details, and your offered price.
                </div>
              </div>
              <div className={styles.qaBox}>
                <div className={styles.question}>
                  What happens after a driver accepts my proposal?
                </div>
                <div className={styles.answer}>
                  You’ll receive a notification and can view all interested
                  drivers. Confirm the one you trust most.
                </div>
              </div>
              <div className={styles.qaBox}>
                <div className={styles.question}>
                  What should I do if I face issues during a delivery?
                </div>
                <div className={styles.answer}>
                  Contact the driver directly using the shared phone number. If
                  needed, report any serious concerns to our support team at
                  support@zueglig.ch
                </div>
              </div>
              <div className={styles.qaBox}>
                <div className={styles.question}>How do I rate a driver?</div>
                <div className={styles.answer}>
                  After the move is marked complete, you’ll be prompted to leave
                  a rating and feedback on the driver’s performance.
                </div>
              </div>
            </>
          )
          : <p>Please log in to view FAQs specific to your account type.</p>}
      </div>

      <div className={styles.section}>
        <h2>
          <ClockCircleOutlined /> Additional Tips
        </h2>
        <ul className={styles.faqList}>
          <li>
            Only confirm drivers or requesters after reviewing their profile.
          </li>
          <li>Use your judgment when it comes to pricing and availability.</li>
        </ul>
      </div>
    </div>
  );
};

export default FAQPage;
