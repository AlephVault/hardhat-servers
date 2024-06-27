const {scope} = require("hardhat/config");
const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");


const serverScope = scope("serve", "Utilities to mount http and/or ipfs nodes");


function parsePort(port, defaultPort) {
    port = (port || "").toString().trim();
    return /^\d+$/.test(port) ? parseInt(port) : defaultPort;
}


async function launchIPFSGateway(
    contentDirectory, repoDirectory,
    gatewayPort = 8080, apiPort = 5001, swarmPort = 4001
) {
    // Normalizing the root directory.
    if (contentDirectory.endsWith('/')) {
        contentDirectory = contentDirectory.substring(0, contentDirectory.length - 1);
    }

    // Creating the IPFS server (core, api, gateway).
    const IPFS = await import('ipfs');
    const {HttpGateway: Gateway} = await import('ipfs-http-gateway');
    const {HttpApi: Api} = await import('ipfs-http-server');
    const ipfs = await IPFS.create({
        repo: repoDirectory,
        config: {
            Addresses: {
                Swarm: [
                    `/ip4/0.0.0.0/tcp/${swarmPort}`,
                    `/ip6/::/tcp/${swarmPort}`
                ],
                API: `/ip4/127.0.0.1/tcp/${apiPort}`,
                Gateway: `/ip4/127.0.0.1/tcp/${gatewayPort}`
            }
        }
    });
    const gateway = new Gateway(ipfs, {
        httpGateway: true,
        port: gatewayPort
    });
    await gateway.start();
    const api = new Api(ipfs, {
        port: apiPort
    });
    await api.start();


    // Function to add a file to IPFS.
    const relativeDirStart = contentDirectory.length + 1;
    async function addToIPFS(filePath) {
        const content = fs.readFileSync(filePath);
        const fileAdded = await ipfs.add({ path: filePath.substring(relativeDirStart), content });
        console.log(`File CID: ${fileAdded.cid}`);
    }

    // Watcher for the filesystem.
    const watcher = chokidar.watch(contentDirectory, { persistent: true });

    watcher
        .on('add', async filePath => {
            console.log(`File ${filePath} has been added`);
            await addToIPFS(filePath);
        })
        .on('unlink', async filePath => {
            console.log(`File ${filePath} has been removed`);
        })
        .on('change', async filePath => {
            console.log(`File ${filePath} has been changed`);
            await addToIPFS(filePath); // Re-adding the file to update it in IPFS
        })
        .on('addDir', dirPath => {
            console.log(`Directory ${dirPath} has been added`);
        })
        .on('unlinkDir', dirPath => {
            console.log(`Directory ${dirPath} has been removed`);
        })
        .on('error', error => {
            console.error(`Watcher error: ${error}`);
        })
        .on('ready', () => {
            console.log('Initial scan complete. Ready for changes');
        })
        .on('all', async (event, filePath) => {
            if (event === 'rename') {
                console.log(`File ${filePath} has been renamed`);
                await addToIPFS(filePath);
            }
        });

    // Return the 4 running objects.
    return {
        ipfs, watcher, api, gateway
    }
}



serverScope
    .task("ipfs", "Serves an IPFS node")
    .addOptionalParam("gatewayPort", "The port to use the public http gateway", "8080")
    .addOptionalParam("swarmPort", "The swarm port to use", "4001")
    .addOptionalParam("apiPort", "The API port to use", "5001")
    .setAction(async ({gatewayPort, swarmPort, apiPort}, hre, runSuper) => {
        try {
            gatewayPort = parsePort(gatewayPort, 8080);
            swarmPort = parsePort(swarmPort, 4001);
            apiPort = parsePort(apiPort, 5001);

            const localDirectory = path.resolve(hre.config.paths.root, ".local");
            const contentDirectory = path.join(localDirectory, "content");
            const repoDirectory = path.join(localDirectory, "repo");

            const {ipfs, watcher, api, gateway} = await launchIPFSGateway(
                contentDirectory, repoDirectory, gatewayPort, apiPort, swarmPort
            );
            console.log(
                `IPFS server started at gateway port ${gatewayPort}, api port ${apiPort} and swarm port ${swarmPort}`
            );

            await ipfs.stop();
            await watcher.close();
            await api.stop();
            await gateway.stop();
        } catch(e) {
            console.error("There was an error trying to mount the IPFS node:");
            console.error(e);
        }
    });
