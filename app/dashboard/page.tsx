"use client";
import React from "react";
import DriverMap from "./components/DriverMap";
import ProposalsOverview from "./components/Proposals/ProposalsOverview";
import { useContext } from "react";
import { AccountTypeContext } from "./layout";

const HomePage = () => {
  const accountType = useContext(AccountTypeContext);

  return (
    <div>
      {accountType === "driver" && <DriverMap />}
      {accountType === "customer" && <ProposalsOverview />}
    </div>
  );
};
    <div>
      <DriverMap /> {/* Use the map component here */}
    </div>
  );
};

export default HomePage;
