import axios from "axios";

export const url = "https://data-unison.covestlabs.com/graphql";

export interface DataUnisonServerPrivate {
	apiKey?: string;
}

export class DataUnisonServer {
	private state: DataUnisonServerPrivate;

	constructor(apiKey?: string) {
		this.state = {
			apiKey: apiKey,
		};
	}

	async query(query: string): Promise<any> {
		if (!query) throw new Error("No query provided");

		const response = await axios.post(url, {
			query: `
                    query {
                        ${query}
                    }
            	`,
		});

		return response.data?.data || response.data;
	}

	async mutate(mutation: string): Promise<any> {
		if (!mutation) throw new Error("No mutation provided");

		const response = await axios.post(url, {
			query: `
                    mutation {
                        ${mutation}
                    }
                `,
		});

		return response.data?.data || response.data;
	}

	async setApiKey(apiKey: string): Promise<void> {
		this.state.apiKey = apiKey;
		return Promise.resolve();
	}

	get isConnected(): boolean {
		return true;
	}
}
