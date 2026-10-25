import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/e2e",
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	reporter: "list",
	use: {
		baseURL: "http://localhost:4173",
		trace: "retain-on-failure",
	},
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
	],
	webServer: {
		command: "bun run preview",
		url: "http://localhost:4173",
		reuseExistingServer: false,
		timeout: 60_000,
	},
});
