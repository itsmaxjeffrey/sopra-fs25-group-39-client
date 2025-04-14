"use client";
import DriverMap from "./components/DriverMap";
import ProposalsOverview from "./components/Proposals/ProposalsOverview";
import DriverHomePage from "./DriverHomePage";
import { useContext } from "react";
import AccountTypeContext from "./AccountTypeContext";

const HomePage = () => {
  const accountType = useContext(AccountTypeContext);

  return (
    <div>
      {accountType === "DRIVER" && <DriverHomePage />}
      {accountType === "REQUESTER" && <ProposalsOverview />}
    </div>
  );
};

export default HomePage;
