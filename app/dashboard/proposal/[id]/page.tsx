"use client";
import '@ant-design/v5-patch-for-react-19';
import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import EditProposal from "../Components/EditProposal";
import OfferProposal from "../Components/OfferProposal";
import AcceptedProposal from "../Components/AcceptedProposal";
import RatingProposal from "../Components/RatingProposal";
import FinalizedProposal from "../Components/FinalizedProposal";
import ViewProposal from "../Components/ViewProposal";

const Page = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  if (!id) return <p style={{ padding: 24 }}>❌ Invalid proposal ID</p>;

  switch (type) {
    case "REQUESTED":
      return <EditProposal proposalId={id.toString()} />;
    case "OFFERED":
      return <OfferProposal proposalId={id.toString()} />;
    case "ACCEPTED":
      return <AcceptedProposal proposalId={id.toString()} />;
    case "COMPLETED": // Show Rating component for COMPLETED status
      return <RatingProposal proposalId={id.toString()} />;
    case "FINALIZED": // Show Finalized component for FINALIZED status
      return <FinalizedProposal proposalId={id.toString()} />;
    case "VIEW":
      return <ViewProposal proposalId={id.toString()} />;
    default:
      // Optionally, fetch the contract here to determine its actual type if none is provided
      // For now, show unknown type
      return <p style={{ padding: 24 }}>❓ Unknown or missing proposal type in URL</p>;
  }
};

export default Page;
