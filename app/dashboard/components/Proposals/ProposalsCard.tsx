import React from "react";
import Link from "next/link";
import styles from "./ProposalsCard.module.css";

interface ProposalsCardProps {
  contractId: number;
  title: string;
  pickupDate: string;
  dropoffDate: string;
}

const ProposalsCard: React.FC<ProposalsCardProps> = ({
  contractId,
  title,
  pickupDate,
  dropoffDate,
}) => {
  return (
    <Link href={""} className={styles.link}>
      <div className={styles.card}>
        <div className={styles.header}>{title}</div>
        <div className={styles.body}>
          <p>Pick-Up Date: {pickupDate}</p>
          <p>Drop-Off Date: {dropoffDate}</p>
        </div>
      </div>
    </Link>
  );
};

export default ProposalsCard;
