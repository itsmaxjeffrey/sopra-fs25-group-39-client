"use client";

import React from "react";
import styles from "./OfferCard.module.css";
import { UserOutlined } from "@ant-design/icons";
import { Rate } from "antd";
import Link from "next/link"; 

interface OfferCardProps {
  //title: string;
  driverName: string;
  driverId: string;
  price: number;
  rating: number;
  isSelected: boolean; // New prop to indicate if the card is selected
  onClick: () => void; // New prop for handling clicks
}

const OfferCard: React.FC<OfferCardProps> = (
  { driverName, driverId, price, isSelected, rating, onClick },
) => {
  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ""}`} // Add selected class if the card is selected
      onClick={onClick} // Handle click
    >
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
      <div className={styles.row}>
        <span>Avg. Rating of Driver:</span>
        <span className={styles.stars}>
          <Rate disabled defaultValue={rating} />
        </span>
      </div>
    </div>
  );
};

export default OfferCard;
