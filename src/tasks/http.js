import finalhandler from "finalhandler";
import fs from "fs";
import http from "http";
import path from "path";
import serveStatic from "serve-static";

function parsePort(port, defaultPort) {
  port = (port || "").toString().trim();
  return /^\d+$/.test(port) ? parseInt(port, 10) : defaultPort;
}

async function launchHTTPServer(rootDirectory, port) {
  fs.mkdirSync(rootDirectory, { recursive: true });

  const serve = serveStatic(rootDirectory);

  const server = http.createServer((req, res) => {
    serve(req, res, finalhandler(req, res));
  });

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });

  return { server };
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

export default async function ({ port }, hre) {
  let server;

  try {
    const parsedPort = parsePort(port, 8081);
    const httpDirectory = path.resolve(hre.config.paths.root, ".local", "http");
    ({ server } = await launchHTTPServer(httpDirectory, parsedPort));

    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });

    console.log(`HTTP server started at port ${parsedPort}`);

    await waitForStop(hre);

    server.close();
    console.log("HTTP server stopped");
  } catch (e) {
    server?.close();
    console.error("There was an error trying to mount the HTTP node:");
    console.error(e);
  }
}
