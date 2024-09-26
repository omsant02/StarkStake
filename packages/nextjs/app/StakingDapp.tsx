import React, { useState } from "react";
import { useAccount } from "~~/hooks/useAccount";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";
import { uint256, Uint256 } from "starknet";

const StakingDApp = () => {
  const { address: connectedAddress } = useAccount();
  const [stakeAmount, setStakeAmount] = useState("");
  const [error, setError] = useState("");

  const stakingContractAddress =
    "0x779dd0939609dfb1745baa414d006ee8db1623a49d8964f3b268bb4b44ab086";

  const { data: tokenBalance } = useScaffoldReadContract({
    contractName: "StakeToken",
    functionName: "balanceOf",
    args: [connectedAddress || undefined] as readonly [string | undefined],
  });

  const { sendAsync: approve } = useScaffoldWriteContract({
    contractName: "StakeToken",
    functionName: "approve",
    args: [stakingContractAddress, { low: 0n, high: 0n }] as readonly [
      string,
      Uint256,
    ],
  });

  const { data: rewardsBalance, refetch: refetchRewardsBalance } =
    useScaffoldReadContract({
      contractName: "StakingContract",
      functionName: "get_rewards",
      args: [connectedAddress || undefined] as readonly [string | undefined],
    });

  const { sendAsync: stake } = useScaffoldWriteContract({
    contractName: "StakingContract",
    functionName: "stake",
    args: [{ low: 0n, high: 0n }] as readonly [Uint256],
  });

  const formatBalance = (balance: any): string => {
    if (balance && uint256.isUint256(balance)) {
      return uint256.uint256ToBN(balance).toString();
    }
    return "0";
  };

  const handleStake = async () => {
    setError("");
    if (!connectedAddress || !stakeAmount) {
      setError("Please connect your wallet and enter an amount to stake");
      return;
    }

    try {
      const amountFloat = parseFloat(stakeAmount);
      if (isNaN(amountFloat) || amountFloat <= 0) {
        setError("Please enter a valid positive number");
        return;
      }

      // Convert to the smallest unit (assuming 18 decimals)
      const amountBigInt = BigInt(Math.floor(amountFloat * 10 ** 18));

      // Check balance
      if (
        tokenBalance &&
        Array.isArray(tokenBalance) &&
        tokenBalance.length > 0
      ) {
        const balance = tokenBalance[0] as unknown as Uint256;
        if (uint256.uint256ToBN(balance) < amountBigInt) {
          setError("Insufficient balance");
          return;
        }
      }

      // Convert to Uint256
      const amountUint256: Uint256 = {
        low: amountBigInt & BigInt("0xFFFFFFFFFFFFFFFF"),
        high: amountBigInt >> BigInt(64),
      };

      console.log("Staking amount:", amountUint256);

      // Approve spending
      const amountToApprove = uint256.bnToUint256(amountBigInt);
      await approve({ args: [stakingContractAddress, amountToApprove] });

      // Stake
      await stake({ args: [amountUint256] });

      setStakeAmount("");
      alert("Staking successful!");
    } catch (error: any) {
      console.error("Staking failed:", error);
      setError(error.message || "Staking failed. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Staking dApp</h1>
      <div className="bg-blue-950 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-semibold mb-2">Your Staking Information</h2>
        <p>Connected Address: {connectedAddress || "Not connected"}</p>
        <p>Rewards Balance: {formatBalance(rewardsBalance)} RTK</p>
      </div>
      <div className="bg-blue-950 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-semibold mb-2">Stake Tokens</h2>
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="Amount to stake"
          className="w-full p-2 mb-2 border rounded"
        />
        <button
          onClick={handleStake}
          disabled={!connectedAddress || !stakeAmount}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-300"
        >
          Stake
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
};

export default StakingDApp;
