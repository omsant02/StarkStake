import React from 'react';
import { useAccount } from '~~/hooks/useAccount';
import { useScaffoldReadContract } from '~~/hooks/scaffold-stark/useScaffoldReadContract';
import { uint256 } from 'starknet';

const StakingDApp = () => {
  const { address: connectedAddress } = useAccount();

  const { data: rewardsBalance } = useScaffoldReadContract({
    contractName: "StakingContract",
    functionName: "get_rewards",
    args: [connectedAddress || undefined] as readonly [string | undefined],
  });

  const formatBalance = (balance: any): string => {
    if (balance && uint256.isUint256(balance)) {
      return uint256.uint256ToBN(balance).toString();
    }
    return '0';
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Staking dApp</h1>
      <div className="bg-blue-900 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-semibold mb-2">Your Staking Information</h2>
        <p>Connected Address: {connectedAddress || 'Not connected'}</p>
        <p>Rewards Balance: {formatBalance(rewardsBalance)} RTK</p>
      </div>
    </div>
  );
};

export default StakingDApp;