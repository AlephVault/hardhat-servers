import { emptyTask, task } from "hardhat/config";

const serveTask = emptyTask(["serve"], "Utilities to mount http and/or ipfs nodes").build();

const serveIpfsTask = task(["serve", "ipfs"], "Serves an IPFS node")
  .addOption({
    name: "gatewayPort",
    description: "The port to use the public http gateway",
    defaultValue: "8080",
  })
  .addOption({
    name: "swarmPort",
    description: "The swarm port to use",
    defaultValue: "4001",
  })
  .addOption({
    name: "apiPort",
    description: "The API port to use",
    defaultValue: "5001",
  })
  .setAction(() => import("./tasks/ipfs.js"))
  .build();

const serveHttpTask = task(["serve", "http"], "Serves an HTTP node")
  .addOption({
    name: "port",
    description: "The port",
    defaultValue: "8081",
  })
  .setAction(() => import("./tasks/http.js"))
  .build();

const hardhatServers = {
  id: "hardhat-servers",
  dependencies: () => [import("hardhat-enquirer-plus")],
  tasks: [serveTask, serveIpfsTask, serveHttpTask],
};

export default hardhatServers;
