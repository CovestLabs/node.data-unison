import axios from "axios";

export const url = "https://data-unison.covestlabs.com/graphql/";

export interface DataUnisonServerPrivate {
	id: number;
	apiKey: string;
	token?: DataUnisonServerToken;
}

export interface DataUnisonServerToken {
	token: string;
	refresh: string;
}

export class DataUnisonServer {
	private state: DataUnisonServerPrivate;
	private connected: boolean;

	constructor(id: number, apiKey: string) {
		this.state = {
			id: id,
			apiKey: apiKey,
		};
		this.connected = false;
	}

	async connect(): Promise<void> {
		if (this.state.token) return;

		await this._connect();
	}

	private async _connect(): Promise<void> {
		if (!this.state.apiKey) throw new Error("No API Key provided");

		const response = await axios.post(url, {
			query: `
                mutation {
                login(apiKey: "${this.state.apiKey}", id: ${this.state.id}) {
                    token
                    refresh
                }
                }
            `,
		});

		const { data } = response.data;

		if (!data || !data.login)
			throw new Error(
				data?.errors?.[0]?.message || data?.errors || "Unauthorized",
			);

		this.state.token = {
			token: data.login.token,
			refresh: data.login.refresh,
		};

		this.connected = true;
	}

	async refresh(): Promise<void> {
		if (!this.state.token) return;

		await this._refresh();
	}

	private async _refresh(): Promise<void> {
		if (!this.state?.token?.refresh)
			throw new Error("No refresh token provided");

		const response = await axios.post(
			url,
			{
				query: `
                    query {
                        refreshToken(id: ${this.state.id}) {
                            success
                            data {
                                token
                                refresh
                            }
                        }
                    }
                `,
			},
			{
				headers: {
					Authorization: `Bearer ${this.state?.token?.token}`,
				},
			},
		);

		const { data } = response.data;

		if (data && data.refreshToken.success && data.refreshToken.data) {
			this.state.token = {
				token: data.refreshToken.data.token,
				refresh:
					data?.refreshToken?.data?.refresh || this.state?.token?.refresh,
			};
		}
	}

	async query(query: string): Promise<any> {
		if (!this.state.token) throw new Error("No token provided");
		if (!query) throw new Error("No query provided");

		const response = await axios.post(
			url,
			{
				query: `
                    query {
                        ${query}
                    }
            `,
			},
			{
				headers: {
					Authorization: `Bearer ${this.state?.token?.token}`,
				},
			},
		);

		return response.data.data;
	}

	async mutate(mutation: string): Promise<any> {
		if (!this.state.token) throw new Error("No token provided");
		if (!mutation) throw new Error("No mutation provided");

		const response = await axios.post(
			url,
			{
				query: `
                    mutation {
                        ${mutation}
                    }
                `,
			},
			{
				headers: {
					Authorization: `Bearer ${this.state?.token?.token}`,
				},
			},
		);

		return response.data.data;
	}

	get getToken(): string {
		if (!this.state.token) return "";

		return this.state?.token?.token;
	}

	get getRefreshToken(): string {
		if (!this.state?.token || !this.state?.token?.refresh) return "";

		return this.state?.token?.refresh;
	}

	get getId(): number {
		return this.state.id;
	}

	get isConnected(): boolean {
		return this.connected;
	}
}
