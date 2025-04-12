'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import NewProposalFormPage from './Components/NewProposal';
import EditProposalFormPage from './Components/EditProposal';

const Page = () => {
  const { id } = useParams();

  if (id === 'new') {
    return <NewProposalFormPage />;
  }

  return <EditProposalFormPage id={id?.toString() || "ups"} />;
};

export default Page;