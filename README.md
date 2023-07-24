<!-- omit from toc -->
# node.data-unison

<!-- omit from toc -->
## Table of Contents

- [Introduction](#introduction)
- [Installing](#installing)
- [Usage](#usage)
- [Example](#example)

## Introduction

**Data Unison SDK: Accelerating Trustworthiness and Verifiability in Data Exchange**

*"Say goodbye to file attachments and cumbersome forms that make users leave your page. Embrace the future of data interaction with the Data Unison Software Development Kit (SDK) to make data sharing a seamless, secure, and verifiable experience."*

Welcome to a new paradigm of data interaction with our transformative SDK, emphasizing trust and verifiability, and built on the firm foundation of blockchain technology and Non-Fungible Tokens (NFTs).

The core of Data Unison SDK is a comprehensive ecosystem that fosters interaction among all vital stakeholders in data sharing - data owners, custodians, providers, consumers, and reputable verifiers such as banks, universities, regulators, and associations. This ecosystem is designed to ensure secure, efficient, and verifiable interactions, thereby enhancing trust and cooperation.

Data owners can enjoy unparalleled control over their data assets through our SDK. NFTs allow data ownership to be securely linked and managed, independent of a web3 wallet. This facilitates smooth transfer of 'custodianship' of data NFTs to a designated custodian, thus empowering them to manage the data on your behalf.

Data providers take advantage of our pioneering approach to data security and trust. The data is safeguarded with the hash of a merkle root, enabling a progressive display of data fields to consumers. In addition, data providers can substantiate data on the blockchain, paving the way for independent verification by reputable entities. This ensures data validity, integrity, and fortifies trust in the data sharing process.

Data consumers, with our SDK, enjoy streamlined, user-friendly access to data. They can define the trust level and verification required for the data they access, ensuring interactions only with reliable, authentic data. This bolsters trust and facilitates cooperation in data sharing interactions.

Moreover, the Data Unison SDK enables dynamic data exchange, allowing real-time data updates, similar to recurring payments. This ensures not only data relevance but also unveils opportunities for new applications leveraging trustworthy and verifiable real-time data via blockchain.

Our Data Unison SDK sets the stage for a new era in data sharing, with a strong emphasis on trust, verification, and dynamic data interaction. Moving beyond traditional models, we welcome a future where data doesn't just exist - it builds trust, fosters collaboration, and dynamically evolves. Join us in the world of Data Unison and experience the new normal in data interactions.

<p align="center">
  <img width="750" src="https://lh3.googleusercontent.com/drive-viewer/AITFw-w2MsEdAbBgjgVuRKPQToGLx6ZRIXHS1VTLDkfEyKh2GQPlzfWeg0phdyVJzsxQnFBFidU35Edahg1RDhQ0w9zKgDT5Ug=s1600">
</p>

## Installing

Using npm:

```bash
$ npm install @covest-labs/data-unison
```

Using yarn:

```bash
$ yarn add @covest-labs/data-unison
```

Using pnpm:

```bash
$ pnpm add @covest-labs/data-unison
```

## Usage

Node.js

```js
const { DataUnisonClient } = require('@covest-labs/data-unison');

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
import { DataUnisonClient } from '@covest-labs/data-unison';

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
import { DataUnisonClient } from '@covest-labs/data-unison';

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
