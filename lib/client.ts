import { url, DataUnisonServer } from "./server";
import { DataUnisonBlockchain } from "./blockchain";
import { ethers, JsonRpcProvider, Wallet } from "ethers";

export interface DataUnisonClientOptions {
	privateKey?: string;
	apiKey?: string;
}

export interface DataUnisonClientPrivate {
	url: string;
	signer?: Wallet;
	provider?: JsonRpcProvider;
	project?: DataUnisonClientProjectPrivate;
}

export interface DataUnisonClientProjectPrivate {
	id?: string;
	contract?: Record<string, string>;
	rpc?: string;
	chainId?: number;
}

export class DataUnisonClient {
	private state: DataUnisonClientPrivate;
	private serverInstance?: DataUnisonServer;
	private blockchainInstance?: DataUnisonBlockchain;

	constructor() {
		this.state = {
			url,
		};
	}

	get isDataUnisonClient(): true {
		return true;
	}

	async connect(
		projectId: string,
		options?: DataUnisonClientOptions,
	): Promise<void> {
		await this._connect(projectId, options);
	}

	private async _connect(
		projectId: string,
		options?: DataUnisonClientOptions,
	): Promise<void> {
		if (projectId.length == 0) throw new Error("Invalid project ID");

		this.serverInstance = new DataUnisonServer(options?.apiKey);

		const data = await this.serverInstance.query(`
            getProject(id: ${projectId}) {
                success
                contract {
                    registrar
                }
                network {
                    rpc
					chainId
                }
            }
        `);

		if (!data?.getProject?.success)
			throw new Error(
				data?.errors?.[0]?.message || data?.errors || "getProject failed",
			);

		this.state.project = {
			id: projectId,
			contract: data.getProject.contract,
			rpc: data.getProject.network.rpc,
			chainId: data.getProject.network.chainId,
		};

		this.state.provider = new ethers.JsonRpcProvider(this.state.project.rpc);

		if (options?.privateKey) {
			try {
				this.state.signer = new ethers.Wallet(
					options.privateKey,
					this.state.provider,
				);
			} catch (e) {
				throw new Error("Invalid private key");
			}
		}
	}

	async setPrivateKey(privateKey: string): Promise<void> {
		if (!privateKey) throw new Error("No private key provided");
		if (!this.state.provider) throw new Error("No provider provided");

		try {
			this.state.signer = new ethers.Wallet(privateKey, this.state.provider);

			if (this?.blockchainInstance)
				await this.blockchainInstance.setProvider(this.state.signer);
		} catch (e) {
			throw new Error("Invalid private key");
		}
	}

	async setApiKey(apiKey: string): Promise<void> {
		if (!apiKey) throw new Error("No API key provided");

		if (this.serverInstance) await this.serverInstance.setApiKey(apiKey);
	}

	async blockchain(): Promise<DataUnisonBlockchain> {
		if (this?.blockchainInstance) return this.blockchainInstance;

		return this._blockchain();
	}

	private async _blockchain(): Promise<DataUnisonBlockchain> {
		if (!this.serverInstance?.isConnected)
			throw new Error("Not connected to server, please connect");

		const chainId = this.state.project?.chainId;

		if (!chainId) throw new Error("ChainId is undefined, please connect");

		const registrar = this.state.project?.contract?.registrar;

		if (!registrar) throw new Error("Registrar is undefined, please connect");

		const provider = this.state.signer || this.state.provider;

		if (!provider) throw new Error("Signer or provider is undefined");

		this.blockchainInstance = new DataUnisonBlockchain(
			chainId,
			registrar,
			provider,
		);

		return this.blockchainInstance;
	}
}
