"use client";
import DriverMap from "./components/DriverMap";
import ProposalsOverview from "./components/Proposals/ProposalsOverview";
import { useContext } from "react";
import AccountTypeContext from "./AccountTypeContext";

const HomePage = () => {
  const accountType = useContext(AccountTypeContext);

  return (
    <div>
      {accountType === "DRIVER" && <DriverMap />}
      {accountType === "REQUESTER" && <ProposalsOverview />}
    </div>
  );
};

export default HomePage;
