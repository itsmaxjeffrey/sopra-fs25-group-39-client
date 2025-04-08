import React, { useEffect, useState } from 'react';
import ProposalsCard from './ProposalsCard';
import styles from './ProposalsOverview.module.css';
import axios from 'axios';
import { Spin } from 'antd';

interface Proposal {
  contractId: number;
  title: string;
  moveDateTime: string;
  creationDateTime: string;
  contractStatus: 'REQUESTED' | 'OFFERED' | 'ACCEPTED';
}

const ProposalsOverview = () => {
  const [contracts, setContracts] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem('id');
    const token = localStorage.getItem('token');

    if (!id || !token) return;

    axios
      .get(`http://localhost:5001/api/v1/users/${id}/contracts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        const sorted = res.data.sort(
          (a: Proposal, b: Proposal) =>
            new Date(a.creationDateTime).getTime() -
            new Date(b.creationDateTime).getTime()
        );
        setContracts(sorted);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const renderSection = (
    title: string,
    bg: string,
    status: Proposal['contractStatus']
  ) => {
    const filtered = contracts.filter((c) => c.contractStatus === status);

    return (
      <div className={styles.section} style={{ backgroundColor: bg }}>
        <h2 className={styles.title}>{title}</h2>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No contracts in this category</p>
        ) : (
          <div className={styles.scrollContainer}>
            {filtered.map((c) => (
              <ProposalsCard
                key={c.contractId}
                contractId={c.contractId}
                title={c.title}
                pickupDate={new Date(c.moveDateTime).toLocaleString('en-US')}
                dropoffDate={
                  new Date(c.moveDateTime).toLocaleString('en-US')
                }
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.center}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {renderSection('Open Proposals', '#f54545', 'REQUESTED')}
      {renderSection('Pending Confirmation by You', '#fad439', 'OFFERED')}
      {renderSection('Locked-In Contracts', '#ffffff', 'ACCEPTED')}
    </div>
  );
};

export default ProposalsOverview;