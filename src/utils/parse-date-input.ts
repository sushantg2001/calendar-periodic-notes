import { moment } from "obsidian";
import type { Moment, unitOfTime } from "moment";

import type { Granularity } from "../types";

const RELATIVE_UNITS: Record<Granularity, unitOfTime.DurationConstructor> = {
	day: "day",
	week: "week",
	month: "month",
	quarter: "quarter",
	year: "year",
};

/**
 * Parse free-form date input from the quick-add dialog into a Moment.
 *
 * Accepts:
 * - empty, "today", or "now" → the current period
 * - relative offsets such as `+3` or `-2`, counted in the granularity's own
 *   unit (e.g. `+1` for a weekly note means next week)
 * - a value matching the granularity's filename format (e.g. `2024-W12`)
 * - a plain ISO date (`2024-03-15`), snapped to the containing period
 *
 * Returns `null` when the input cannot be understood.
 */
export function parseDateInput(
	input: string,
	granularity: Granularity,
	format: string,
): Moment | null {
	const trimmed = input.trim();

	if (trimmed === "" || /^(today|now)$/i.test(trimmed)) {
		return moment();
	}

	const relative = trimmed.match(/^([+-])(\d+)$/);
	if (relative) {
		const sign = relative[1] === "-" ? -1 : 1;
		return moment().add(sign * Number(relative[2]), RELATIVE_UNITS[granularity]);
	}

	const parsed = moment(trimmed, [format, "YYYY-MM-DD", moment.ISO_8601], true);
	return parsed.isValid() ? parsed : null;
}
