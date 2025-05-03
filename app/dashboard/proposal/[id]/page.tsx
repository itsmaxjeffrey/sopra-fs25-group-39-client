"use client";
import "@ant-design/v5-patch-for-react-19";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams, useSearchParams } from "next/navigation";
import EditProposal from "../Components/EditProposal";
import OfferProposal from "../Components/OfferProposal";
import AcceptedProposal from "../Components/AcceptedProposal";
import RatingProposal from "../Components/RatingProposal";
import FinalizedProposal from "../Components/FinalizedProposal";
import ViewOfferedProposal from "../Components/ViewOfferedProposal";
import ViewProposal from "../Components/ViewProposal";

// Dynamically set the BASE_URL based on the environment
const BASE_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:8080"
  : "https://sopra-fs25-group-39-server.oa.r.appspot.com/";

interface ContractResponse {
  contract: {
    requesterId: number;
    driverId: number | null;
    // Add other fields as necessary
  };
}

interface OfferResponse {
  offers: {
    offerId: number;
    offerStatus: string;
    creationDateTime: string;
    contract: {
      contractId: number;
      title: string;
      weight: number;
      // Add other fields from the contract object as necessary
    };
    driver: {
      userId: number;
      username: string;
      email: string;
      // Add other fields from the driver object as necessary
    };
  }[];
}

const Page = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  const [isRequester, setIsRequester] = useState<boolean | null>(null);
  const [hasUserOffered, setHasUserOffered] = useState<boolean | null>(null); // Track if the user has offered on the contract
  const [loading, setLoading] = useState(true);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    console.log("useEffect triggered with id:", id, "and type:", type);

    if (hasFetchedRef.current) {
      console.log("Skipping duplicate fetch for id:", id, "and type:", type);
      return;
    }

    hasFetchedRef.current = true;

    const fetchProposalDetails = async () => {
      if (type === "OFFERED" && id) {
        try {
          const token = localStorage.getItem("token");
          const userId = localStorage.getItem("userId");

          if (!token || !userId) {
            console.log("Missing token or userId");
            setIsRequester(false);
            setHasUserOffered(false);
            setLoading(false);
            return;
          }

          const response = await axios.get(
            `${BASE_URL}/api/v1/contracts/${id}`,
            {
              headers: {
                Authorization: token,
                UserId: userId,
              },
            },
          );
          console.log("Contract Details:", response.data); // Debugging the proposal details

          const proposal = (response.data as ContractResponse).contract;
          setIsRequester(Number(userId) === proposal.requesterId);

          // Fetch all offers for the contract
          const offersResponse = await axios.get(`${BASE_URL}/api/v1/offers`, {
            headers: {
              Authorization: token,
              UserId: userId,
            },
            params: {
              contractId: id, // Filter by contractId
            },
          });

          const offers = (offersResponse.data as OfferResponse).offers;
          console.log("Offers:", offers);

          // Check if the user has offered on this contract
          const userHasOffered = offers.some((offer) =>
            offer.driver?.userId === Number(userId)
          );
          console.log("User has offered:", userHasOffered); // Debugging the user offer status
          setHasUserOffered(userHasOffered);
        } catch (error) {
          console.error("Error fetching proposal details:", error);
          setIsRequester(false);
          setHasUserOffered(false);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchProposalDetails();
  }, [id, type]);

  if (!id) return <p style={{ padding: 24 }}>❌ Invalid proposal ID</p>;

  if (loading) return <p style={{ padding: 24 }}>⏳ Loading...</p>;

  switch (type) {
    case "REQUESTED":
      return <EditProposal proposalId={id.toString()} />;
    case "OFFERED":
      console.log(
        "isRequester:",
        isRequester,
        "hasUserOffered:",
        hasUserOffered,
      ); // Debugging state values
      if (isRequester === null || hasUserOffered === null) {
        return <p style={{ padding: 24 }}>⏳ Determining user role...</p>;
      }
      if (isRequester) {
        console.log("Routing to OfferProposal as requester");
        return <OfferProposal proposalId={id.toString()} />;
      }
      if (hasUserOffered) {
        console.log("Routing to OfferProposal as driver who has offered");
        return <ViewOfferedProposal proposalId={id.toString()} />;
      }
      console.log("Routing to ViewProposal");
      return <ViewProposal proposalId={id.toString()} />;
    case "ACCEPTED":
      if (isRequester === null || hasUserOffered === null) {
        return <p style={{ padding: 24 }}>⏳ Determining user role...</p>;
      }
      if (isRequester) {
        return <AcceptedProposal proposalId={id.toString()} />;
      }
      return <ViewOfferedProposal proposalId={id.toString()} />;
    case "COMPLETED": // Show Rating component for COMPLETED status
      return <RatingProposal proposalId={id.toString()} />;
    case "FINALIZED": // Show Finalized component for FINALIZED status
      return <FinalizedProposal proposalId={id.toString()} />;
    case "VIEW":
      return <ViewProposal proposalId={id.toString()} />;
    default:
      // Optionally, fetch the contract here to determine its actual type if none is provided
      // For now, show unknown type
      return (
        <p style={{ padding: 24 }}>
          ❓ Unknown or missing proposal type in URL
        </p>
      );
  }
};

export default Page;
