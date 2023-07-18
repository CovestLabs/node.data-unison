import { url, DataUnisonServer } from "./server";
import { DataUnisonBlockchain } from "./blockchain";
import { ethers, JsonRpcProvider, Wallet } from "ethers";

export interface DataUnisonClientOptions {
	privateKey: string;
}

export interface DataUnisonClientPrivate {
	url: string;
	apiKey: string;
	privateKey?: string;
	signer?: Wallet;
	provider?: JsonRpcProvider;
	project: DataUnisonClientProjectPrivate;
}

export interface DataUnisonClientProjectPrivate {
	id: number;
	contracts?: Record<string, string>;
	rpc?: string;
}

export class DataUnisonClient {
	private state: DataUnisonClientPrivate;
	private server: DataUnisonServer;

	constructor(id: number, apiKey: string, options?: DataUnisonClientOptions) {
		if (id < 1) throw new Error("Invalid project ID");
		if (!apiKey) throw new Error("No API Key provided");

		this.state = {
			url,
			apiKey,
			privateKey: options?.privateKey,
			project: {
				id,
			},
		};

		this.server = new DataUnisonServer(id, apiKey);
	}

	get isDataUnisonClient(): true {
		return true;
	}

	async connect(): Promise<void> {
		if (this.server.isConnected) return;

		await this._connect();
	}

	private async _connect(): Promise<void> {
		if (!this.state.apiKey) throw new Error("No API Key provided");
		if (!this.server) throw new Error("No server provided");

		await this.server.connect();

		const data = await this.server.query(`
            getProjectInfo(id: ${this.state.project.id}) {
                success
                contracts {
                    registrar
                }
                network {
                    rpc
                }
            }
        `);

		if (!data?.getProjectInfo?.success)
			throw new Error(
				data?.errors?.[0]?.message || data?.errors || "getProjectInfo failed",
			);

		this.state.project.contracts = data.getProjectInfo.contracts;
		this.state.project.rpc = data.getProjectInfo.network.rpc;

		this.state.provider = new ethers.JsonRpcProvider(this.state.project.rpc);

		if (this.state.privateKey) {
			try {
				this.state.signer = new ethers.Wallet(
					this.state.privateKey,
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
		} catch (e) {
			throw new Error("Invalid private key");
		}
	}

	async blockchain(): Promise<DataUnisonBlockchain> {
		if (!this.server.isConnected) throw new Error("Not connected to server");

		const registrar = this.state.project.contracts?.registrar;

		if (!registrar) throw new Error("Registrar is undefined");

		const signer = this.state.signer || this.state.provider;

		if (!signer) throw new Error("Signer or provider is undefined");

		return new DataUnisonBlockchain(registrar, signer);
	}
}
