import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatServers from "hardhat-servers";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers, hardhatServers],
  solidity: "0.8.24",
  test: {
    solidity: {
      fuzz: {
        runs: 4,
      },
      invariant: {
        runs: 4,
        depth: 4,
        failOnRevert: true,
      },
    },
  },
});
