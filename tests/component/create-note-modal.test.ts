import { describe, expect, it, vi } from "vitest";
import { moment, type App } from "obsidian";
import type { Moment } from "moment";

import { App as MockApp } from "../mocks/obsidian";
import { DEFAULT_FORMATS } from "../../src/constants";
import {
	CreateNoteModal,
	type CreateNoteModalParams,
} from "../../src/ui/create-note-modal";
import type { Granularity } from "../../src/types";

function openModal(overrides: Partial<CreateNoteModalParams> = {}) {
	const onSubmit = vi.fn<(g: Granularity, date: Moment) => void>();
	const params: CreateNoteModalParams = {
		granularities: ["day", "week", "month"],
		initialGranularity: "day",
		getFormat: (g) => DEFAULT_FORMATS[g],
		getNotePath: (g, date) => `${date.format(DEFAULT_FORMATS[g])}.md`,
		noteExists: () => false,
		onSubmit,
		...overrides,
	};
	const modal = new CreateNoteModal(new MockApp() as unknown as App, params);
	modal.open();
	return { modal, onSubmit };
}

function input(modal: CreateNoteModal): HTMLInputElement {
	return modal.contentEl.querySelector("input") as HTMLInputElement;
}

function setValue(el: HTMLInputElement, value: string): void {
	el.value = value;
	el.dispatchEvent(new Event("input", { bubbles: true }));
}

function clickButton(root: HTMLElement, text: string): void {
	[...root.querySelectorAll("button")]
		.find((el) => el.textContent === text)
		?.click();
}

describe("CreateNoteModal", () => {
	it("renders a button per granularity with the initial one selected", () => {
		const { modal } = openModal();
		const selector = modal.contentEl.querySelector(
			".cpn-create-granularities",
		) as HTMLElement;
		expect(selector.querySelectorAll("button")).toHaveLength(3);
		expect(selector.querySelector("button.mod-cta")?.textContent).toBe("daily");
	});

	it("previews the resolved note path for the typed date", () => {
		const { modal } = openModal();
		setValue(input(modal), "2024-03-15");
		expect(
			modal.contentEl.querySelector(".cpn-create-preview-path")?.textContent,
		).toBe("2024-03-15.md");
	});

	it("reflects the selected granularity in the preview", () => {
		const { modal } = openModal();
		clickButton(
			modal.contentEl.querySelector(".cpn-create-granularities") as HTMLElement,
			"monthly",
		);
		setValue(input(modal), "2024-03-15");
		expect(
			modal.contentEl.querySelector(".cpn-create-preview-path")?.textContent,
		).toBe("2024-03.md");
	});

	it("marks an existing note and still allows submitting", () => {
		const { modal, onSubmit } = openModal({ noteExists: () => true });
		setValue(input(modal), "2024-03-15");
		expect(
			modal.contentEl.querySelector(".cpn-create-preview-exists"),
		).not.toBeNull();
		clickButton(modal.contentEl, "Create");
		expect(onSubmit).toHaveBeenCalledOnce();
	});

	it("disables create and blocks submit on invalid input", () => {
		const { modal, onSubmit } = openModal();
		setValue(input(modal), "not a date");
		const create = modal.contentEl.querySelector<HTMLButtonElement>(
			".modal-button-container button.mod-cta",
		);
		expect(create?.disabled).toBe(true);
		clickButton(modal.contentEl, "Create");
		expect(onSubmit).not.toHaveBeenCalled();
		expect(document.body.contains(modal.modalEl)).toBe(true);
	});

	it("submits the selected granularity and date, then closes", () => {
		const { modal, onSubmit } = openModal();
		clickButton(
			modal.contentEl.querySelector(".cpn-create-granularities") as HTMLElement,
			"weekly",
		);
		setValue(input(modal), "2024-03-15");
		clickButton(modal.contentEl, "Create");

		expect(onSubmit).toHaveBeenCalledOnce();
		const [granularity, date] = onSubmit.mock.calls[0] ?? [];
		expect(granularity).toBe("week");
		expect(date?.isSame(moment("2024-03-15"), "day")).toBe(true);
		expect(document.body.contains(modal.modalEl)).toBe(false);
	});

	it("submits on Enter", () => {
		const { modal, onSubmit } = openModal();
		setValue(input(modal), "today");
		input(modal).dispatchEvent(
			new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
		);
		expect(onSubmit).toHaveBeenCalledOnce();
	});
});
