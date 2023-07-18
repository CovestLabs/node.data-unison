import { isAddress, isBytes32 } from "./utils";
import { ethers, Signer, Provider, Contract } from "ethers";
import {
	EthersError,
	getParsedEthersError,
} from "@enzoferey/ethers-error-parser";

/**
 * An enumeration representing the role of the interaction contract.
 */
export enum Role {
	/** The owner of the interaction contract. */
	Owner,
	/** The provider of the interaction contract. */
	Provider,
}

export type Contracts = "Registrar" | "Summary" | "Interaction";

export const Abi: Record<Contracts, string[]> = {
	Registrar: [
		"function resolveReference(address _summary) view returns (string)",
		"function resolveSummary(string _ref) view returns (address)",
	],
	Summary: [
		"function addInteraction(string _ref, address _interaction, uint8 _role)",
		"function assignTemporaryViewer(uint256 _id, address _entity, uint256 _level, uint256 _deadline)",
		"function assignViewer(uint256 _id, address _entity, uint256 _level)",
		"function custodian() view returns (address)",
		"function disableInteraction(uint256 _id)",
		"function enableInteraction(uint256 _id)",
		"function getDataMerkleRoot(uint256 _id) view returns (bytes32)",
		"function getInteraction(uint256 _id) view returns (tuple(address interaction, bool enable, uint8 role) interaction)",
		"function getInteractionId(string _ref) view returns (uint256)",
		"function getInteractionId(address _interaction) view returns (uint256)",
		"function getInteractions(uint256[] _ids) view returns (tuple(address interaction, bool enable, uint8 role)[] interactions)",
		"function getInteractionsLength() view returns (uint256)",
		"function getViewer(uint256 _id, address _entity) view returns (uint256)",
		"function isInteractionExist(address _interaction) view returns (bool)",
		"function isInteractionExist(string _ref) view returns (bool)",
		"function setCustodian(address _custodian_)",
		"function setDataMerkleRoot(uint256 _id, bytes32 _merkleRoot)",
	],
	Interaction: [
		"function owner() view returns (address)",
		"function provider() view returns (address)",
	],
};

export const AbiRole: Record<Role, typeof Abi> = {
	[Role.Owner]: {
		Registrar: Abi.Registrar || [],
		Summary: (Abi.Summary || []).filter(
			(signature) => !signature.includes("assignTemporaryViewer"),
		),
		Interaction: Abi.Interaction || [],
	},
	[Role.Provider]: {
		Registrar: Abi.Registrar || [],
		Summary: (Abi.Summary || []).filter(
			(signature) => !signature.includes("assignViewer"),
		),
		Interaction: Abi.Interaction || [],
	},
};

export const ContractFunction = (role: Role, contract: Contracts): string[] =>
	AbiRole[role]?.[contract] ?? [];

export interface DataUnisonBlockchainInteraction {
	interaction: string;
	enabled: boolean;
	role: Role;
}

export interface DataUnisonBlockchainPrivate {
	reference?: string;
	provider: Signer | Provider;
	contract: DataUnisonBlockchainContractPrivate;
}

export interface DataUnisonBlockchainContractPrivate {
	registrar?: Contract;
	summary?: Contract;
}

class DataUnisonInternalBlockchain {
	protected async _isSigner(provider: Signer | Provider): Promise<boolean> {
		if ((provider as Signer)?.getAddress() !== undefined) {
			return true;
		} else {
			return false;
		}
	}

	protected async _readContract(
		c: Contract,
		func: string,
		params: Array<any> = [],
	): Promise<any> {
		try {
			const result = await c?.[`${func}`]?.(...params);

			return Promise.resolve(result);
		} catch (e) {
			const parsedEthersError = getParsedEthersError(e as EthersError);

			return Promise.reject(
				parsedEthersError?.context ?? parsedEthersError.errorCode,
			);
		}
	}

	protected async _writeContract(
		c: Contract,
		func: string,
		params: Array<any> = [],
	): Promise<any> {
		try {
			const tx = await c?.[`${func}`]?.(...params);

			await tx?.wait();

			return Promise.resolve(tx);
		} catch (e) {
			const parsedEthersError = getParsedEthersError(e as EthersError);

			return Promise.reject(
				parsedEthersError?.context ?? parsedEthersError.errorCode,
			);
		}
	}
}

export class DataUnisonBlockchain extends DataUnisonInternalBlockchain {
	private state: DataUnisonBlockchainPrivate;

	constructor(address: string, provider: Signer | Provider) {
		super();

		this.state = {
			provider,
			contract: {
				registrar: new ethers.Contract(address, Abi.Registrar, provider),
			},
		};
	}

	async isSigner(): Promise<boolean> {
		return this._isSigner(this.state.provider);
	}

	async connectSummary(reference: string): Promise<any> {
		try {
			const summary = await this.resolveSummary(reference);

			if (summary === ethers.ZeroAddress) throw new Error("Summary not found");

			this.state.contract.summary = new ethers.Contract(
				summary,
				Abi.Summary,
				this.state.provider,
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async resolveReference(summaryAddress: string): Promise<string> {
		if (!this.state.contract?.registrar)
			throw new Error("Registrar contract not found");

		try {
			return await this._readContract(
				this.state.contract.registrar,
				"resolveReference(address)",
				[summaryAddress],
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async resolveSummary(reference: string): Promise<string> {
		if (!this.state.contract?.registrar)
			throw new Error("Registrar contract not found");

		try {
			return await this._readContract(
				this.state.contract?.registrar,
				"resolveSummary(string)",
				[reference],
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async custodian(): Promise<string> {
		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		try {
			return await this._readContract(
				this.state.contract?.summary,
				"custodian()",
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async isCustodian(): Promise<boolean> {
		if (!this._isSigner(this.state.provider))
			throw new Error("Signer not found");

		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		try {
			const custodian = await this.custodian();
			const address = await (
				(await this.state.provider) as Signer
			).getAddress();

			return custodian === address;
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async isOwnerInteraction(interactionId: number): Promise<boolean> {
		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (interactionId < 0) throw new Error("The interactionId is negative");

		try {
			const interactionData = await this.getInteraction(interactionId);

			if (interactionData.role !== Role.Owner) return false;

			const interaction = new ethers.Contract(
				interactionData.interaction,
				Abi.Registrar,
				this.state.provider,
			);

			const owner = await this._readContract(interaction, "owner()");

			return owner === (await this.state.contract.summary?.address);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async isProviderInteraction(interactionId: number): Promise<boolean> {
		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (interactionId < 0) throw new Error("The interactionId is negative");

		try {
			const interactionData = await this.getInteraction(interactionId);

			if (interactionData.role !== Role.Provider) return false;

			const interaction = new ethers.Contract(
				interactionData.interaction,
				Abi.Registrar,
				this.state.provider,
			);

			const provider = await this._readContract(interaction, "provider()");

			return provider === (await this.state.contract.summary?.address);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async isInteractionExist(
		reference_or_interactionAddress: string,
	): Promise<boolean> {
		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (reference_or_interactionAddress.length == 0)
			throw new Error("reference_or_interactionAddress is empty");

		if (isAddress(reference_or_interactionAddress) == false) {
			try {
				return await this._readContract(
					this.state.contract?.summary,
					"isInteractionExist(string)",
					[reference_or_interactionAddress],
				);
			} catch (e: any) {
				throw new Error(e);
			}
		} else {
			try {
				return await this._readContract(
					this.state.contract?.summary,
					"isInteractionExist(address)",
					[reference_or_interactionAddress],
				);
			} catch (e: any) {
				throw new Error(e);
			}
		}
	}

	async getInteractionId(
		reference_or_interactionAddress: string,
	): Promise<number> {
		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (reference_or_interactionAddress.length == 0)
			throw new Error("reference_or_interactionAddress is empty");

		if (isAddress(reference_or_interactionAddress)) {
			try {
				return await this._readContract(
					this.state.contract?.summary,
					"isInteractionExist(address)",
					[reference_or_interactionAddress],
				);
			} catch (e: any) {
				throw new Error(e);
			}
		} else {
			try {
				return await this._readContract(
					this.state.contract?.summary,
					"isInteractionExist(string)",
					[reference_or_interactionAddress],
				);
			} catch (e: any) {
				throw new Error(e);
			}
		}
	}

	async getInteractionsLength(): Promise<number> {
		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		try {
			return await this._readContract(
				this.state.contract?.summary,
				"getInteractionsLength()",
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async getInteraction(
		interactionId: number,
	): Promise<DataUnisonBlockchainInteraction> {
		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (interactionId < 0) throw new Error("The interactionId is negative");

		if (!((await this.getInteractionsLength()) > interactionId))
			throw new Error("The interactionId is not found");

		try {
			return await this._readContract(
				this.state.contract?.summary,
				"getInteraction(uint256)",
				[interactionId],
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async getInteractions(
		interactionIds: Array<number>,
	): Promise<Array<DataUnisonBlockchainInteraction>> {
		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (!interactionIds || interactionIds.length == 0)
			throw new Error("interactionIds is empty");

		const interactionLength = await this.getInteractionsLength();

		for (let i = 0; i < interactionIds?.length; i++) {
			const interactionId = interactionIds[i];

			if (interactionId === undefined || !(interactionLength > interactionId))
				throw new Error("The interactionId is not found");

			if (interactionId < 0)
				throw new Error(`The interactionId is negative at index ${i}`);
		}

		try {
			return await this._readContract(
				this.state.contract?.summary,
				"getInteractions(uint256[])",
				[interactionIds],
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async getViewer(
		interactionId: number,
		entityAddress: string,
	): Promise<number> {
		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (interactionId < 0) throw new Error("The interactionId is negative");

		if (!((await this.getInteractionsLength()) > interactionId))
			throw new Error("The interactionId is not found");

		if (isAddress(entityAddress) == false)
			throw new Error("Invalid entity address");

		try {
			return await this._readContract(
				this.state.contract?.summary,
				"getViewer(uint256,address)",
				[interactionId, entityAddress],
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async getDataMerkleRoot(interactionId: number): Promise<string> {
		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (interactionId < 0) throw new Error("The interactionId is negative");

		if (!((await this.getInteractionsLength()) > interactionId))
			throw new Error("The interactionId is not found");

		try {
			return await this._readContract(
				this.state.contract?.summary,
				"getDataMerkleRoot(uint256)",
				[interactionId],
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async addInteraction(
		reference: string,
		interactionAddress: string,
		role: Role,
	): Promise<any> {
		if (!this._isSigner(this.state.provider))
			throw new Error("Signer not found");

		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (!this.isCustodian())
			throw new Error("Your are not custodian of the summary contract");

		if (reference.length == 0) throw new Error("Reference is empty");

		if (isAddress(interactionAddress) == false)
			throw new Error("Invalid interaction address");

		if (await this.isInteractionExist(interactionAddress))
			throw new Error("Interaction already exist");

		if (await this.isInteractionExist(reference))
			throw new Error("Reference already exist");

		try {
			return await this._writeContract(
				this.state.contract?.summary,
				"addInteraction(string,address,uint8)",
				[reference, interactionAddress, role],
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async enableInteraction(interactionId: number): Promise<any> {
		if (!this._isSigner(this.state.provider))
			throw new Error("Signer not found");

		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (!(await this.isCustodian()))
			throw new Error("Your are not custodian of the summary contract");

		if (interactionId < 0) throw new Error("The interactionId is negative");

		if (!((await this.getInteractionsLength()) > interactionId))
			throw new Error("The interactionId is not found");

		if (!(await this.isOwnerInteraction(interactionId)))
			throw new Error("The interaction is not owned by summary contract");

		if ((await this.getInteraction(interactionId)).enabled == true)
			throw new Error("The interaction is already enabled");

		try {
			return await this._writeContract(
				this.state.contract?.summary,
				"enableInteraction(uint256)",
				[interactionId],
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async disableInteraction(interactionId: number): Promise<any> {
		if (!this._isSigner(this.state.provider))
			throw new Error("Signer not found");

		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (!(await this.isCustodian()))
			throw new Error("Your are not custodian of the summary contract");

		if (interactionId < 0) throw new Error("The interactionId is negative");

		if (!((await this.getInteractionsLength()) > interactionId))
			throw new Error("The interactionId is not found");

		if (!(await this.isOwnerInteraction(interactionId)))
			throw new Error("The interaction is not owned by summary contract");

		if ((await this.getInteraction(interactionId)).enabled == false)
			throw new Error("The interaction is already disabled");

		try {
			return await this._writeContract(
				this.state.contract?.summary,
				"disableInteraction(uint256)",
				[interactionId],
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async assignViewer(
		interactionId: number,
		entityAddress: string,
		permissionLevel: number,
	): Promise<any> {
		if (!this._isSigner(this.state.provider))
			throw new Error("Signer not found");

		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (!(await this.isCustodian()))
			throw new Error("Your are not custodian of the summary contract");

		if (interactionId < 0) throw new Error("The interactionId is negative");

		if (!((await this.getInteractionsLength()) > interactionId))
			throw new Error("The interactionId is not found");

		if (isAddress(entityAddress) == false)
			throw new Error("Invalid entity address");

		if (!(await this.isOwnerInteraction(interactionId)))
			throw new Error("The interaction is not owned by summary contract");

		if (permissionLevel < 0)
			throw new Error("The permission level can't be negative value");

		try {
			return await this._writeContract(
				this.state.contract?.summary,
				"assignViewer(uint256,address,uint256)",
				[interactionId, entityAddress, permissionLevel],
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async assignTemporaryViewer(
		interactionId: number,
		entityAddress: string,
		permissionLevel: number,
		durationSeconds: number,
	): Promise<any> {
		if (!this._isSigner(this.state.provider))
			throw new Error("Signer not found");

		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (!(await this.isCustodian()))
			throw new Error("Your are not custodian of the summary contract");

		if (interactionId < 0) throw new Error("The interactionId is negative");

		if (!((await this.getInteractionsLength()) > interactionId))
			throw new Error("The interactionId is not found");

		if (isAddress(entityAddress) == false)
			throw new Error("Invalid entity address");

		if (!(await this.isOwnerInteraction(interactionId)))
			throw new Error("The interaction is not owned by summary contract");

		if (permissionLevel < 0)
			throw new Error("The permission level can't be negative value");

		if (durationSeconds <= 0) throw new Error("The durationSeconds is invalid");

		if (durationSeconds % 1 !== 0)
			throw new Error("The durationSeconds must not have a decimal");

		const deadline = Math.floor(Date.now() / 1000) + durationSeconds;

		try {
			return await this._writeContract(
				this.state.contract?.summary,
				"assignViewer(uint256,address,uint256,uint256)",
				[interactionId, entityAddress, permissionLevel, deadline],
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async setCustodian(custodianAddress: string): Promise<any> {
		if (!this._isSigner(this.state.provider))
			throw new Error("Signer not found");

		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (!(await this.isCustodian()))
			throw new Error("Your are not custodian of the summary contract");

		if (isAddress(custodianAddress) == false)
			throw new Error("Invalid custodian address");

		try {
			return await this._writeContract(
				this.state.contract?.summary,
				"setCustodian(address)",
				[custodianAddress],
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}

	async setDataMerkleRoot(
		interactionId: number,
		merkleRoot: string,
	): Promise<any> {
		if (!this._isSigner(this.state.provider))
			throw new Error("Signer not found");

		if (!this.state.contract?.summary)
			throw new Error("Summary contract is not found");

		if (!(await this.isCustodian()))
			throw new Error("Your are not custodian of the summary contract");

		if (interactionId < 0) throw new Error("The interactionId is negative");

		if (!((await this.getInteractionsLength()) > interactionId))
			throw new Error("The interactionId is not found");

		if (!(await this.isProviderInteraction(interactionId)))
			throw new Error("The interaction is not provider by summary contract");

		if (!isBytes32(merkleRoot)) throw new Error("Invalid merkle root");

		try {
			return await this._writeContract(
				this.state.contract?.summary,
				"setDataMerkleRoot(uint256,bytes32)",
				[interactionId, merkleRoot],
			);
		} catch (e: any) {
			throw new Error(e);
		}
	}
}
