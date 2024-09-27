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
      staking_token_address: "0x79b2d1ebac9e491de5bb86b718a360f23a83503515d5284f9261effb59ecb71",
      reward_token_address: "0x16f37848f0958fd63e4bae0ebeab2edd334b84fdb132c5be1dc4f90032fd808",
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
