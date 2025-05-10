"use client";
import React, { useContext, useEffect, useState } from "react";
import styles from "./ProposalsOverview.module.css";
import axios from "axios";
import { message, Spin } from "antd";
import Link from "next/link";
import {
  CalendarOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { getApiDomain } from "@/utils/domain";
import AccountTypeContext from "../AccountTypeContext";

interface Location {
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

interface Proposal {
  contractId: number;
  title: string;
  moveDateTime: string;
  creationDateTime: string;
  contractStatus: "REQUESTED" | "OFFERED" | "ACCEPTED";
  fromLocation: Location;
  toLocation: Location;
  price: number;
  weight?: number; // Added weight
  length?: number; // Added length
  width?: number; // Added width
  height?: number; // Added height
  fragile?: boolean;
  coolingRequired?: boolean;
  rideAlong?: boolean;
  requesterId?: number;
}

interface Offer {
  offerId: number;
  contract: { contractId: number };
  driver: { userId: number };
  offerStatus: "CREATED" | "ACCEPTED" | "DELETED";
  creationDateTime: string;
}

interface AcceptedContractsResponse {
  contracts: Proposal[];
}

interface RequesterContractsResponse {
  contracts: Proposal[];
}

const BASE_URL = getApiDomain();

const ProposalsOverview = () => {
  const accountType = useContext(AccountTypeContext);
  const [requesterContracts, setRequesterContracts] = useState<Proposal[]>([]);
  const [driverPendingOfferContracts, setDriverPendingOfferContracts] =
    useState<Proposal[]>([]);
  const [driverAcceptedContracts, setDriverAcceptedContracts] = useState<
    Proposal[]
  >([]);
  const [loading, setLoading] = useState(true);
  const isDriver = accountType === "DRIVER";

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!userId || !token) {
      setLoading(false);
      return;
    }

    const headers = {
      UserId: `${userId}`,
      Authorization: `${token}`,
    };

    const fetchDriverData = async () => {
      try {
        const offersRes = await axios.get<{ offers: Offer[] }>(
          `${BASE_URL}/api/v1/users/${userId}/offers?status=CREATED`,
          { headers },
        );
        const pendingOffers = offersRes.data.offers || [];

        const pendingContractPromises = pendingOffers.map((offer) =>
          axios
            .get<{ contract: Proposal }>(
              `${BASE_URL}/api/v1/contracts/${offer.contract.contractId}`,
              { headers },
            )
            .then((res) => res.data.contract)
            .catch((err) => {
              console.error(
                `Failed to fetch contract ${offer.contract.contractId}:`,
                err,
              );
              return null;
            })
        );
        const pendingContractsDetails =
          (await Promise.all(pendingContractPromises)).filter(
            (contract): contract is Proposal => contract !== null,
          );
        setDriverPendingOfferContracts(
          pendingContractsDetails.sort(
            (a, b) =>
              new Date(b.creationDateTime).getTime() -
              new Date(a.creationDateTime).getTime(),
          ),
        );

        const acceptedContractsRes = await axios.get(
          `${BASE_URL}/api/v1/users/${userId}/contracts?status=ACCEPTED`,
          { headers },
        );
        let acceptedContracts: Proposal[] = [];
        const acceptedResponseData = acceptedContractsRes.data;
        if (Array.isArray(acceptedResponseData)) {
          acceptedContracts = acceptedResponseData;
        } else if (
          acceptedResponseData &&
          typeof acceptedResponseData === "object" &&
          "contracts" in acceptedResponseData &&
          Array.isArray(
            (acceptedResponseData as AcceptedContractsResponse).contracts,
          )
        ) {
          acceptedContracts =
            (acceptedResponseData as AcceptedContractsResponse).contracts;
        }

        acceptedContracts = acceptedContracts.filter((c) =>
          c.contractStatus === "ACCEPTED"
        );

        setDriverAcceptedContracts(
          acceptedContracts.sort(
            (a, b) =>
              new Date(b.creationDateTime).getTime() -
              new Date(a.creationDateTime).getTime(),
          ),
        );
      } catch (err) {
        console.error("Failed to fetch driver data:", err);
        message.error("Failed to load your contract overview.");
        setDriverPendingOfferContracts([]);
        setDriverAcceptedContracts([]);
      } finally {
        setLoading(false);
      }
    };

    const intervalId = setInterval(() => {
      fetchDriverData();
    }, 5000); // Poll every 5 seconds

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId); // Stop polling after 5 minutes
      console.log("Polling stopped after 5 minutes to save traffic.");
    }, 300000); // 5 minutes in milliseconds

    fetchDriverData(); // Fetch immediately on mount

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [accountType, isDriver]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!userId || !token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const headers = {
      UserId: `${userId}`,
      Authorization: `${token}`,
    };

    const fetchDriverData = async () => {
      try {
        const offersRes = await axios.get<{ offers: Offer[] }>(
          `${BASE_URL}/api/v1/users/${userId}/offers?status=CREATED`,
          { headers },
        );
        const pendingOffers = offersRes.data.offers || [];
        console.log("Fetched Pending Offers:", pendingOffers);

        const pendingContractPromises = pendingOffers.map((offer) =>
          axios
            .get<{ contract: Proposal }>(
              `${BASE_URL}/api/v1/contracts/${offer.contract.contractId}`,
              { headers },
            )
            .then((res) => res.data.contract)
            .catch((err) => {
              console.error(
                `Failed to fetch contract ${offer.contract.contractId}:`,
                err,
              );
              return null;
            })
        );
        const pendingContractsDetails =
          (await Promise.all(pendingContractPromises)).filter(
            (contract): contract is Proposal => contract !== null,
          );
        console.log(
          "Fetched Pending Contract Details:",
          pendingContractsDetails,
        );
        setDriverPendingOfferContracts(
          pendingContractsDetails.sort(
            (a, b) =>
              new Date(b.creationDateTime).getTime() -
              new Date(a.creationDateTime).getTime(),
          ),
        );

        const acceptedContractsRes = await axios.get(
          `${BASE_URL}/api/v1/users/${userId}/contracts?status=ACCEPTED`,
          { headers },
        );
        let acceptedContracts: Proposal[] = [];
        const acceptedResponseData = acceptedContractsRes.data;
        if (Array.isArray(acceptedResponseData)) {
          acceptedContracts = acceptedResponseData;
        } else if (
          acceptedResponseData &&
          typeof acceptedResponseData === "object" &&
          "contracts" in acceptedResponseData &&
          Array.isArray(
            (acceptedResponseData as AcceptedContractsResponse).contracts,
          )
        ) {
          acceptedContracts =
            (acceptedResponseData as AcceptedContractsResponse).contracts;
        } else {
          console.warn(
            "Unexpected API response structure for driver's accepted contracts:",
            acceptedResponseData,
          );
        }

        acceptedContracts = acceptedContracts.filter((c) =>
          c.contractStatus === "ACCEPTED"
        );

        console.log("Fetched Accepted Contracts:", acceptedContracts);
        setDriverAcceptedContracts(
          acceptedContracts.sort(
            (a, b) =>
              new Date(b.creationDateTime).getTime() -
              new Date(a.creationDateTime).getTime(),
          ),
        );
      } catch (err) {
        console.error("Failed to fetch driver data:", err);
        message.error("Failed to load your contract overview.");
        setDriverPendingOfferContracts([]);
        setDriverAcceptedContracts([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchRequesterData = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/api/v1/users/${userId}/contracts`,
          { headers },
        );
        console.log("Raw API Response (Requester):", res.data);

        let proposals: Proposal[] = [];
        const responseData = res.data;

        if (Array.isArray(responseData)) {
          proposals = responseData;
        } else if (
          responseData &&
          typeof responseData === "object" &&
          "contracts" in responseData &&
          Array.isArray((responseData as RequesterContractsResponse).contracts)
        ) {
          console.log(
            "Found 'contracts' array in response object (Requester).",
          );
          proposals = (responseData as RequesterContractsResponse).contracts;
        } else {
          console.error(
            "Unexpected API response structure for requester:",
            responseData,
          );
        }

        proposals = proposals.filter(
          (item): item is Proposal =>
            item && typeof item === "object" && "contractId" in item &&
            "contractStatus" in item,
        );

        console.log("Extracted Proposals (Requester):", proposals);

        if (proposals.length > 0) {
          const sorted = proposals.sort(
            (a, b) =>
              new Date(b.creationDateTime).getTime() -
              new Date(a.creationDateTime).getTime(),
          );
          setRequesterContracts(sorted);
          console.log("Sorted Contracts Set (Requester):", sorted);
        } else {
          console.log("No valid proposals found in response (Requester).");
          setRequesterContracts([]);
        }
      } catch (err) {
        console.error("Failed to fetch requester contracts:", err);
        message.error("Failed to load your contract overview.");
        setRequesterContracts([]);
      } finally {
        setLoading(false);
      }
    };

    if (isDriver) {
      fetchDriverData();
    } else {
      fetchRequesterData();
    }
  }, [accountType, isDriver]);

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

  const requesterRequestedContracts = requesterContracts.filter((c) =>
    c.contractStatus === "REQUESTED"
  );
  const requesterOfferedContracts = requesterContracts.filter((c) =>
    c.contractStatus === "OFFERED"
  );
  const requesterAcceptedContracts = requesterContracts.filter((c) =>
    c.contractStatus === "ACCEPTED"
  );

  const requestedTitle = "Open Proposals";
  const requestedEmptyMsg = "No open proposals";
  const offeredTitle = isDriver
    ? "Your Pending Offers"
    : "Pending Offers Received";
  const offeredEmptyMsg = isDriver
    ? "You have no pending offers"
    : "No pending offers received";
  const acceptedTitle = "Confirmed Moves";
  const acceptedEmptyMsg = "No confirmed moves";

  return (
    <div className={styles.page}>
      <div className={styles.greeting}>
        <h1>
          {getGreeting()}, {username} 👋
        </h1>
        <p>Here’s a quick overview of your moves</p>
      </div>

      {!isDriver && (
        <div className={styles.section}>
          <h2>
            <FileTextOutlined /> {requestedTitle}
          </h2>
          <div className={styles.cardRow}>
            {requesterRequestedContracts.length === 0
              ? <p className={styles.emptySection}>{requestedEmptyMsg}</p>
              : (
                requesterRequestedContracts.map((c) => (
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
                        <EnvironmentOutlined />{" "}
                        {c.fromLocation?.formattedAddress || "No location"} ➝
                        {" "}
                        {c.toLocation?.formattedAddress || "No location"}
                      </p>
                    </div>
                  </Link>
                ))
              )}
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h2>
          <ClockCircleOutlined /> {offeredTitle}
        </h2>
        <div className={styles.cardRow}>
          {(isDriver ? driverPendingOfferContracts : requesterOfferedContracts)
              .length === 0
            ? <p className={styles.emptySection}>{offeredEmptyMsg}</p>
            : (
              (isDriver
                ? driverPendingOfferContracts
                : requesterOfferedContracts).map((c) => (
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
                        <EnvironmentOutlined />{" "}
                        {c.fromLocation?.formattedAddress || "No location"} ➝
                        {" "}
                        {c.toLocation?.formattedAddress || "No location"}
                      </p>
                    </div>
                  </Link>
                ))
            )}
        </div>
      </div>

      <div className={styles.section}>
        <h2>
          <LockOutlined /> {acceptedTitle}
        </h2>
        <div className={styles.cardRow}>
          {(isDriver ? driverAcceptedContracts : requesterAcceptedContracts)
              .length === 0
            ? <p className={styles.emptySection}>{acceptedEmptyMsg}</p>
            : (
              (isDriver ? driverAcceptedContracts : requesterAcceptedContracts)
                .map((c) => (
                  <Link
                    key={c.contractId}
                    href={`/dashboard/proposal/${c.contractId}?type=${c.contractStatus}`}
                    className={styles.link}
                  >
                    <div className={styles.card}>
                      <div className={styles.icon}>
                        <CheckOutlined />
                      </div>
                      <h3>{c.title}</h3>
                      <p>
                        <CalendarOutlined />{" "}
                        {new Date(c.moveDateTime).toLocaleString()}
                      </p>
                      <p>
                        <EnvironmentOutlined />{" "}
                        {c.fromLocation?.formattedAddress || "No location"} ➝
                        {" "}
                        {c.toLocation?.formattedAddress || "No location"}
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
