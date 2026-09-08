# hardhat-servers
A hardhat plugin to mount static servers (HTTP and IPFS) from an in-project's local directory.

## Installation
Install this package in your Hardhat 3 project with the following command:

```shell
npm install --save-dev hardhat@^3.0.0 hardhat-enquirer-plus@^3.0.0 hardhat-servers@^3.0.0
```

Then, in your ESM `hardhat.config.js` or `hardhat.config.ts` file, import the plugin and register it in the
`plugins` array:

```javascript
import hardhatServers from "hardhat-servers";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatServers],
  solidity: "0.8.24"
});
```

## Usage
You'll have two new commands at your disposal:

### HTTP
To mount an HTTP server:

```shell
npx hardhat serve http
```

The contents will be served from the in-project's directory: `.local/http`. For example,
by hitting `http://localhost:8081/some-image.png` will serve the contents from the file
`.local/http/some-image.png`.

This is meant to be only local, so ensure you .gitignore your `.local` directory.

See `npx hardhat serve http --help` for more details.

### IPFS
To mount an IPFS stack:

```shell
npx hardhat serve ipfs
```

The contents will be served from the in-project's directory: `.local/ipfs/content`. The
files are hashed and served directly from that directory (check the console as they are
scanned, for the CID values will be generated there).

Again: this is only meant to be local, so ensure you .gitignore your `.local` directory.

See `npx hardhat serve ipfs --help` for more details (specially the ports that can be
configured).

### Closing the servers
Pressing any key closes each server.
