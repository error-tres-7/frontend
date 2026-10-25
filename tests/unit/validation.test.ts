import { describe, expect, test } from "bun:test";
import { validation_messages } from "#utils/validation.js";

describe("validation messages", () => {
	test("supports string and structured validation errors", () => {
		expect(validation_messages(["Required", { message: "Invalid" }, new Error("Try again")])).toEqual([
			"Required",
			"Invalid",
			"Try again",
		]);
	});

	test("deduplicates messages and ignores unsupported error shapes", () => {
		expect(validation_messages([null, undefined, "", 0, {}, { message: 2 }, "Required", "Required"])).toEqual([
			"Required",
		]);
	});
});
