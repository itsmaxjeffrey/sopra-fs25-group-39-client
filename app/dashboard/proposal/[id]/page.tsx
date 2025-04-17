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
  const { id } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  if (!id) return <p style={{ padding: 24 }}>❌ Invalid proposal ID</p>;

  switch (type) {
    case "REQUESTED":
      return <EditProposal id={id.toString()} />;
    case "OFFERED":
      return <OfferProposal id={id.toString()} />;
    case "ACCEPTED":
      return <AcceptedProposal id={id.toString()} />;
    case "COMPLETED":
      return <RatingProposal id={id.toString()} />;
    case "FINALIZED":
      return <FinalizedProposal id={id.toString()} />;
    case "VIEW":
      return <ViewProposal id={id.toString()} />;
    default:
      return <p style={{ padding: 24 }}>❓ Unknown proposal type</p>;
  }
};

export default Page;
