"use client";
import ProposalsOverview from "./Homepage/Requester/ProposalsOverview";
import DriverHomePage from "./Homepage/Driver/DriverHomePage";
import { useContext } from "react";
import AccountTypeContext from "./AccountTypeContext";

const HomePage = () => {
  const accountType = useContext(AccountTypeContext);
  console.log("Account Type:", accountType); // Debugging

  if (!accountType) {
    return <p>Loading account type...</p>;
  }

  return (
    <div>
      {accountType === "DRIVER" && <DriverHomePage />}
      {accountType === "REQUESTER" && <ProposalsOverview />}
    </div>
  );
};

export default HomePage;
