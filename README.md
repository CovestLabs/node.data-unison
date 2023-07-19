<!-- omit from toc -->
# node.data-unison

<!-- omit from toc -->
## Table of Contents

- [Introduction](#introduction)
- [Installing](#installing)
- [Usage](#usage)
- [Example](#example)

## Introduction

Data Unison SDK: Facilitating Secure, Customizable, and User-friendly Data Exchange

Welcome to the future of data collaboration with our Data Unison Software Development Kit (SDK). More than a tool, it's a paradigm shift in how data is shared, controlled, and utilized, underpinned by the unique security and transparency of blockchain technology.

Data Unison SDK orchestrates a balance between ownership, privacy, and security, harnessing the unrivaled capabilities of Non-Fungible Tokens (NFTs) and blockchain technology. It caters to all key players in data sharing - data owners, custodians, providers, and consumers - fostering secure and efficient interaction within a unified data-sharing ecosystem.

Data owners, with our SDK, enjoy unparalleled control over their data. Thanks to NFTs, data ownership can be securely linked and managed, independent of a web3 wallet. This innovation allows you to effortlessly transfer the 'custodianship' of your data NFT to a trusted party, such as a family member, enabling them to manage the data on your behalf.

Data providers benefit from our ground-breaking approach to data security. Data is secured with the hash of a merkle root, allowing progressive display of data fields to consumers. Rather than storing data directly on the blockchain, we store the permissions and the hash of the data. This maintains a secure and verifiable link to the data, ensuring its validity and integrity.

Data consumers gain significantly from the user-friendly access to data our SDK provides. They can access and utilize the data they need without having to navigate the complexities of data control, enjoying a streamlined, efficient, and trustworthy process. The Data Unison SDK ensures that consumers receive only authentic data, further enhancing trust and cooperation in the data sharing process.

Our Data Unison SDK heralds a new era in data sharing. It breaks away from traditional models and embraces a future where data exchange is secure, customizable, and user-friendly. Enter a world where data doesn't merely exist - it connects, collaborates, and creates opportunities. Join us in the world of Data Unison.

![Picture](https://lh3.googleusercontent.com/drive-viewer/AITFw-zCkgjhHYRmjNsi6lgWRNOcCRZwXw-WiNfeY4VuoLkUw0RprZH3GcYNnByocH5eHvq1xE4uTump2F5RemJuq1vBpxNzHA=s1600)

## Installing

Using npm:

```bash
$ npm install @covestlabs/data-unison
```

Using yarn:

```bash
$ yarn add @covestlabs/data-unison
```

Using pnpm:

```bash
$ pnpm add @covestlabs/data-unison
```

## Usage

Node.js

```js
const { DataUnisonClient } = require('@covestlabs/data-unison');

// Create a new client instance
const client = new DataUnisonClient();

const main = async () => {
  const projectId = '1';

  // Connect to the DataUnison server
  await client.connect(projectId);

  // Create a new blockchain instance for the client
  const blockchain = await client.blockchain();
}

main().catch(console.error);
```

Typescript

```ts
import { DataUnisonClient } from '@covestlabs/data-unison';

// Create a new client instance
const client = new DataUnisonClient();

const main = async () => {
  const projectId = '1';

  // Connect to the DataUnison server
  await client.connect(projectId);

  // Create a new blockchain instance for the client
  const blockchain = await client.blockchain();
}

main().catch(console.error);
```

## Example
```ts
import { DataUnisonClient } from '@covestlabs/data-unison';

// Create a new client instance
const client = new DataUnisonClient();

const main = async () => {
  const projectId = '1';

  // Connect to the DataUnison server
  await client.connect(projectId);

  // Create a new blockchain instance for the client
  const blockchain = await client.blockchain();

  const reference = "Hello";

  // Get the address of summary that reference is "Hello"
  const resolveSummary = await blockchain.resolveSummary(reference);
}

main().catch(console.error);
```
