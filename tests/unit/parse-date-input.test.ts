import { describe, expect, it } from "vitest";
import { moment } from "obsidian";

import { DEFAULT_FORMATS } from "../../src/constants";
import { parseDateInput } from "../../src/utils/parse-date-input";

describe("parseDateInput", () => {
	it("returns the current period for empty, today, and now", () => {
		for (const input of ["", "  ", "today", "TODAY", "now"]) {
			const parsed = parseDateInput(input, "day", DEFAULT_FORMATS.day);
			expect(parsed?.isSame(moment(), "day")).toBe(true);
		}
	});

	it("applies relative offsets in the granularity's unit", () => {
		const nextWeek = parseDateInput("+1", "week", DEFAULT_FORMATS.week);
		expect(nextWeek?.isSame(moment().add(1, "week"), "day")).toBe(true);

		const twoMonthsAgo = parseDateInput("-2", "month", DEFAULT_FORMATS.month);
		expect(twoMonthsAgo?.isSame(moment().subtract(2, "month"), "day")).toBe(true);
	});

	it("parses a value in the granularity's own format", () => {
		const week = parseDateInput("2024-W12", "week", DEFAULT_FORMATS.week);
		expect(week?.format(DEFAULT_FORMATS.week)).toBe("2024-W12");

		const quarter = parseDateInput("2024-Q3", "quarter", DEFAULT_FORMATS.quarter);
		expect(quarter?.format(DEFAULT_FORMATS.quarter)).toBe("2024-Q3");
	});

	it("accepts a plain ISO date for any granularity", () => {
		const month = parseDateInput("2024-03-15", "month", DEFAULT_FORMATS.month);
		expect(month?.format(DEFAULT_FORMATS.month)).toBe("2024-03");
	});

	it("returns null for unrecognized input", () => {
		expect(parseDateInput("not a date", "day", DEFAULT_FORMATS.day)).toBeNull();
		expect(parseDateInput("++", "day", DEFAULT_FORMATS.day)).toBeNull();
	});
});
