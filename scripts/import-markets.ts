import { rename, rm } from "node:fs/promises";
import { download_market_snapshot } from "#lib/markets/import.js";

/** Run from the repository with: bun run scripts/import-markets.ts */
async function main(): Promise<void> {
	// Validate the complete download before creating any output; rename on the same filesystem is atomic.
	const snapshot = await download_market_snapshot();
	const destination = new URL("../src/logic/markets/snapshot.json", import.meta.url);
	const temporary = new URL(`../src/logic/markets/.snapshot-${crypto.randomUUID()}.json`, import.meta.url);
	try {
		await Bun.write(temporary, `${JSON.stringify(snapshot, null, "\t")}\n`);
		await rename(temporary, destination);
	} finally {
		await rm(temporary, { force: true });
	}
	console.info(`Imported ${snapshot.markets.length} SEDECO markets into ${destination.pathname}`);
	console.info(`Source SHA-256: ${snapshot.provenance.sha256}`);
}

if (import.meta.main) {
	try {
		await main();
	} catch (error) {
		console.error("Market import failed; no replacement snapshot was installed.", error);
		process.exitCode = 1;
	}
}
