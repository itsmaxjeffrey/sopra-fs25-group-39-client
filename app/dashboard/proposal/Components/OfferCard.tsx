"use client";

import React from "react";
import styles from "./OfferCard.module.css";
import { UserOutlined, StarFilled } from "@ant-design/icons";

interface OfferCardProps {
  title: string;
  driverName: string;
  price: number;
  rating: number;
}

const OfferCard: React.FC<OfferCardProps> = ({ title, driverName, price, rating }) => {
  return (
    <div className={styles.card}>
      <div className={styles.title}>{title}</div>
      <div className={styles.divider} />
      <div className={styles.row}>
        <span>Driver:</span>
        <span className={styles.driverInfoRight}>
          {driverName}
          <UserOutlined style={{ fontSize: "20px", marginLeft: "8px" }} />
        </span>
      </div>
      <div className={styles.row}>
        <span>Price:</span>
        <span className={styles.price}>{price.toFixed(2)} CHF</span>
      </div>
      <div className={styles.row}>
        <span>Avg. Rating of Driver:</span>
        <span className={styles.stars}>
          {Array.from({ length: rating }, (_, i) => (
            <StarFilled key={i} />
          ))}
        </span>
      </div>
    </div>
  );
};

export default OfferCard;
