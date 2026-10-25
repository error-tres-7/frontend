import { describe, expect, test } from "bun:test";
import { cn } from "#utils/shadcn.js";

describe("cn", () => {
	test("combines conditional class names", () => {
		expect(cn("flex", undefined, { hidden: false, "items-center": true })).toBe("flex items-center");
	});

	test("resolves conflicting Tailwind utilities", () => {
		expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
	});

	test("handles empty input", () => {
		expect(cn()).toBe("");
	});
});
