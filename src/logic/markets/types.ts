export type Market = {
	id: string;
	name: string;
	borough: string;
	neighborhood: string;
	address: string;
	latitude: number;
	longitude: number;
	stalls: number | null;
};

export type Coordinates = { latitude: number; longitude: number };

export type MarketSource = {
	url: string;
	title: string;
	license: string;
	imported_at: string;
};

export type MarketSnapshot = {
	market_source: MarketSource;
	provenance: {
		publisher: string;
		download_url: string;
		resource_id: string;
		sha256: string;
		feature_count: number;
		normalization_version: number;
		id_fields: string[];
		field_mapping: Record<string, string>;
		notes: string[];
	};
	markets: Market[];
};
