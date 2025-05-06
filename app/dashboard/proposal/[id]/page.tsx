"use client";
import "@ant-design/v5-patch-for-react-19";
import React, { useEffect, useState } from "react";
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

interface OfferInArray {
  driver?: {
    userId?: number;
  };
  // other properties of offer can be added here if needed
}

const Page = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  const [isRequester, setIsRequester] = useState<boolean | null>(null);
  const [hasUserOffered, setHasUserOffered] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      // Ensure id and type are present; type is used to decide further actions.
      if (!id || !type) {
        setIsRequester(null);
        setHasUserOffered(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const userIdString = localStorage.getItem("userId");

        if (!token || !userIdString) {
          console.error("Authentication details missing.");
          setIsRequester(false); // Or some error state
          setHasUserOffered(false); // Or some error state
          setLoading(false);
          return;
        }
        const currentUserId = Number(userIdString);

        // 1. Fetch contract details (needed for all types to determine requester)
        const contractResponse = await axios.get(
          `${BASE_URL}/api/v1/contracts/${id}`,
          { headers: { Authorization: token, UserId: userIdString } }
        );
        const proposalData = contractResponse.data?.contract; // Assuming path based on existing interfaces/usage

        if (!proposalData || typeof proposalData.requesterId === 'undefined') {
          console.error("Essential contract data (like requesterId) is missing from response:", proposalData);
          throw new Error("Invalid contract data received.");
        }
        
        const isCurrentUserTheRequester = proposalData.requesterId === currentUserId;
        setIsRequester(isCurrentUserTheRequester);

        // 2. Determine if the current user (if a driver) has made an offer.
        if (!isCurrentUserTheRequester) { // Current user is a Driver
          // For drivers, fetch their offer status for relevant types.
          // REQUESTED/VIEW types mean they are looking at a proposal they *could* offer on.
          // In those cases, they wouldn't have an existing offer relevant for this page's routing logic.
          if (type !== "REQUESTED" && type !== "VIEW") {
            const offersResponse = await axios.get(`${BASE_URL}/api/v1/offers`, {
              headers: { Authorization: token, UserId: userIdString },
              params: { contractId: id }, // Fetch all offers for the contract
            });
            const offers = offersResponse.data?.offers; // Assuming path based on existing interfaces/usage
            const driverOffer = offers?.find((o: OfferInArray) => o.driver?.userId === currentUserId);
            setHasUserOffered(!!driverOffer);
          } else {
            setHasUserOffered(false); // Driver viewing a new/generic proposal, hasn't offered yet in this context.
          }
        } else { // Current user is the Requester
          // For requesters, `hasUserOffered` by themselves is false in the context of this page's state.
          // Components like OfferProposal will fetch and display all offers separately.
          setHasUserOffered(false);
        }

      } catch (error) {
        console.error(`Error fetching details for proposal ${id}, type ${type}:`, error);
        setIsRequester(null); // Indicate error or unknown state
        setHasUserOffered(null); // Indicate error or unknown state
        // Consider setting a user-facing error message state here
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, type]); // useEffect dependencies

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
