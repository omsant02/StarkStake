"use client";

import type { NextPage } from "next";
import StakingDApp from './StakingDapp';

const Home: NextPage = () => {
  return (
    <div className="container mx-auto p-4">
      <StakingDApp />
    </div>
  );
};

export default Home;