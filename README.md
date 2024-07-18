# hardhat-servers
A hardhat plugin to mount static servers (HTTP and IPFS) from an in-project's local directory.

## Installation
Install this package in your hardhat project (this was tested in a project depending on hardhat@2.22.5) with the
following command:

```shell
npm install --save-dev hardhat-common-tools@^1.3.0 hardhat-enquirer-plus@^1.3.0 hardhat-servers@^1.1.0
```

Then, in your `hardhat.config.js` file, just require it:

```javascript
require("hardhat-common-tools");
require("hardhat-enquirer-plus");
require("hardhat-servers");
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