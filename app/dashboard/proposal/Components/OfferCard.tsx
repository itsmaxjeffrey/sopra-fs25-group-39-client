"use client";

import React from "react";
import styles from "./OfferCard.module.css";
import { UserOutlined } from "@ant-design/icons";
import { Button, Rate } from "antd"; // Import Button
import Link from "next/link"; // Import Link from next/link

interface OfferCardProps {
  offerId: number;
  driverName: string;
  driverId: string;
  price: number;
  rating?: number; // Rating is optional
  driverPhoneNumber?: string; // Added new prop
  onAccept?: (offerId: number) => void; // Make onAccept optional
}

const OfferCard: React.FC<OfferCardProps> = (
  { offerId, driverName, driverId, price, rating, driverPhoneNumber, onAccept }, // Destructure new props
) => {
  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <span>Driver:</span>
        <span className={styles.driverInfoRight}>
          {/* Wrap driver name and icon in a Link */}
          <Link
            href={`/dashboard/account/public/drivers/${driverId}`}
            className={styles.driverLink}
          >
            {driverName}
            <UserOutlined style={{ fontSize: "20px", marginLeft: "8px" }} />
          </Link>
        </span>
      </div>
      <div className={styles.row}>
        <span>Price:</span>
        <span className={styles.price}>{price.toFixed(2)} CHF</span>
      </div>
      {/* Conditionally render the rating row */}
      {typeof rating === 'number' && (
        <div className={styles.row}>
          <span>Avg. Rating of Driver:</span>
          <span className={styles.stars}>
            <Rate disabled defaultValue={rating} />
          </span>
        </div>
      )}
      <div className={styles.row}>
        <span>Phone:</span>
        <span className={styles.price}> 
          {driverPhoneNumber || "Not available"}
        </span>
      </div>
      {/* Conditionally render Accept Button */}
      {onAccept && (
        <div className={`${styles.row} ${styles.acceptButtonRow}`}>
          <Button type="primary" onClick={() => onAccept(offerId)}>
            Accept Offer
          </Button>
        </div>
      )}
    </div>
  );
};

export default OfferCard;
