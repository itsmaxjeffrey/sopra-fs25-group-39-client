"use client";
import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import EditProposal from "../Components/EditProposal";
import OfferProposal from "../Components/OfferProposal";
import AcceptedProposal from "../Components/AcceptedProposal";
import RatingProposal from "../Components/RatingProposal";
import FinalizedProposal from "../Components/FinalizedProposal";
import ViewProposal from "../Components/ViewProposal";

const Page = () => {
  const { userId } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  if (!userId) return <p style={{ padding: 24 }}>❌ Invalid proposal ID</p>;

  switch (type) {
    case "REQUESTED":
      return <EditProposal userId={userId.toString()} />;
    case "OFFERED":
      return <OfferProposal userId={userId.toString()} />;
    case "ACCEPTED":
      return <AcceptedProposal userId={userId.toString()} />;
    case "COMPLETED":
      return <RatingProposal userId={userId.toString()} />;
    case "FINALIZED":
      return <FinalizedProposal userId={userId.toString()} />;
    case "VIEW":
      return <ViewProposal userId={userId.toString()} />;
    default:
      return <p style={{ padding: 24 }}>❓ Unknown proposal type</p>;
  }
};

export default Page;
