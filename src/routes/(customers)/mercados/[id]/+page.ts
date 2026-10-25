import { error } from "@sveltejs/kit";
import { market_source, markets } from "#lib/markets/index.js";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
	if (params.id === "medellin") return { demo: true, market: null, source: market_source };
	const market = markets.find((record) => record.id === params.id);
	if (!market) error(404, "No encontramos este mercado en el directorio.");
	return { demo: false, market, source: market_source };
};
