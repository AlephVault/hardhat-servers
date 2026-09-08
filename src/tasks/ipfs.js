import chokidar from "chokidar";
import fs from "fs";
import path from "path";

function parsePort(port, defaultPort) {
  port = (port || "").toString().trim();
  return /^\d+$/.test(port) ? parseInt(port, 10) : defaultPort;
}

async function launchIPFSGateway(
  contentDirectory,
  repoDirectory,
  gatewayPort = 8080,
  apiPort = 5001,
  swarmPort = 4001,
) {
  if (contentDirectory.endsWith("/")) {
    contentDirectory = contentDirectory.substring(0, contentDirectory.length - 1);
  }

  fs.mkdirSync(contentDirectory, { recursive: true });
  fs.mkdirSync(repoDirectory, { recursive: true });

  const IPFS = await import("ipfs");
  const { HttpGateway: Gateway } = await import("ipfs-http-gateway");
  const { HttpApi: Api } = await import("ipfs-http-server");
  const ipfs = await IPFS.create({
    repo: repoDirectory,
    config: {
      Addresses: {
        Swarm: [`/ip4/0.0.0.0/tcp/${swarmPort}`, `/ip6/::/tcp/${swarmPort}`],
        API: `/ip4/127.0.0.1/tcp/${apiPort}`,
        Gateway: `/ip4/127.0.0.1/tcp/${gatewayPort}`,
      },
    },
  });

  const gateway = new Gateway(ipfs, {
    httpGateway: true,
    port: gatewayPort,
  });
  await gateway.start();

  const api = new Api(ipfs, {
    port: apiPort,
  });
  await api.start();

  const relativeDirStart = contentDirectory.length + 1;
  async function addToIPFS(filePath) {
    const content = fs.readFileSync(filePath);
    const fileAdded = await ipfs.add({
      path: filePath.substring(relativeDirStart),
      content,
    });
    console.log(`File ${filePath} -- CID: ${fileAdded.cid}`);
  }

  const watcher = chokidar.watch(contentDirectory, { persistent: true });

  watcher
    .on("add", async (filePath) => {
      console.log(`File ${filePath} has been added`);
      await addToIPFS(filePath);
    })
    .on("unlink", async (filePath) => {
      console.log(`File ${filePath} has been removed`);
    })
    .on("change", async (filePath) => {
      console.log(`File ${filePath} has been changed`);
      await addToIPFS(filePath);
    })
    .on("addDir", (dirPath) => {
      console.log(`Directory ${dirPath} has been added`);
    })
    .on("unlinkDir", (dirPath) => {
      console.log(`Directory ${dirPath} has been removed`);
    })
    .on("error", (error) => {
      console.error(`Watcher error: ${error}`);
    })
    .on("ready", () => {
      console.log("Initial scan complete. Ready for changes");
    })
    .on("all", async (event, filePath) => {
      if (event === "rename") {
        console.log(`File ${filePath} has been renamed`);
        await addToIPFS(filePath);
      }
    });

  return {
    ipfs,
    watcher,
    api,
    gateway,
  };
}

async function waitForStop(hre) {
  if (process.stdin.isTTY && typeof process.stdin.setRawMode === "function") {
    await new hre.enquirerPlus.Enquirer.PressAnyKey({
      message: "Press any key to stop the server...",
    }).run();
    return;
  }

  console.log("No interactive terminal detected. Press Ctrl+C to stop the server.");
  await new Promise((resolve) => {
    process.once("SIGINT", resolve);
    process.once("SIGTERM", resolve);
  });
}

export default async function ({ gatewayPort, swarmPort, apiPort }, hre) {
  let ipfs;
  let watcher;
  let api;
  let gateway;

  try {
    const parsedGatewayPort = parsePort(gatewayPort, 8080);
    const parsedSwarmPort = parsePort(swarmPort, 4001);
    const parsedApiPort = parsePort(apiPort, 5001);

    const ipfsDirectory = path.resolve(hre.config.paths.root, ".local", "ipfs");
    const contentDirectory = path.join(ipfsDirectory, "content");
    const repoDirectory = path.join(ipfsDirectory, "repo");

    ({ ipfs, watcher, api, gateway } = await launchIPFSGateway(
      contentDirectory,
      repoDirectory,
      parsedGatewayPort,
      parsedApiPort,
      parsedSwarmPort,
    ));

    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });

    console.log(
      `IPFS server started at gateway port ${parsedGatewayPort}, api port ${parsedApiPort} and swarm port ${parsedSwarmPort}`,
    );

    await waitForStop(hre);

    await ipfs.stop();
    await watcher.close();
    await api.stop();
    await gateway.stop();

    console.log("IPFS server stopped");
  } catch (e) {
    await watcher?.close();
    await api?.stop();
    await gateway?.stop();
    await ipfs?.stop();
    console.error("There was an error trying to mount the IPFS node:");
    console.error(e);
  }
}
