import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
} from "./deploy-contract";
import { green } from "./helpers/colorize-log";

/**
 * Deploy a contract using the specified parameters.
 *
 * @example (deploy contract with contructorArgs)
 * const deployScript = async (): Promise<void> => {
 *   await deployContract(
 *     {
 *       contract: "YourContract",
 *       contractName: "YourContractExportName",
 *       constructorArgs: {
 *         owner: deployer.address,
 *       },
 *       options: {
 *         maxFee: BigInt(1000000000000)
 *       }
 *     }
 *   );
 * };
 *
 * @example (deploy contract without contructorArgs)
 * const deployScript = async (): Promise<void> => {
 *   await deployContract(
 *     {
 *       contract: "YourContract",
 *       contractName: "YourContractExportName",
 *       options: {
 *         maxFee: BigInt(1000000000000)
 *       }
 *     }
 *   );
 * };
 *
 *
 * @returns {Promise<void>}
 */
const deployScript = async (): Promise<void> => {
  await deployContract({
    contract: "StakingContract",
    // constructorArgs: {
    //   initial_supply:1000,
    //   recipient: "0x079e8838aa3eb04d95f50b33a426d20eed2767dbaceb6f0a0e05aa84a9598426",
    // },
    constructorArgs: {
      staking_token_address: "0x3f4665f7e369ddaad22bdd82695c496f534a1d9a1f32635e22609b093cc85b1",
      reward_token_address: "0x1d8d131f87387c45ca82f95e467e25b9b2b7614afcb92af5d58765c02449083",
      owner_address:"0x079e8838aa3eb04d95f50b33a426d20eed2767dbaceb6f0a0e05aa84a9598426",
    },
    options: {
      maxFee: BigInt(22000000000000000),
    },
  });
};

deployScript()
  .then(async () => {
    await executeDeployCalls();
    exportDeployments();

    console.log(green("All Setup Done"));
  })
  .catch(console.error);
