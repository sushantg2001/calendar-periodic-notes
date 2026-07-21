import { App, Modal } from "obsidian";
import type { Moment } from "moment";

import { DISPLAY_CONFIGS } from "../constants";
import { parseDateInput } from "../utils/parse-date-input";
import type { Granularity } from "../types";

export interface CreateNoteModalParams {
	granularities: Granularity[];
	initialGranularity: Granularity;
	getFormat(granularity: Granularity): string;
	getNotePath(granularity: Granularity, date: Moment): string;
	noteExists(granularity: Granularity, date: Moment): boolean;
	onSubmit(granularity: Granularity, date: Moment): void;
}

/**
 * A quick-add style input dialog for creating (or opening) a periodic note for
 * any period, not just the current one. The user picks a granularity and types
 * a date; a live preview shows the resolved note before they commit.
 */
export class CreateNoteModal extends Modal {
	private granularity: Granularity;
	private inputEl!: HTMLInputElement;
	private previewEl!: HTMLElement;
	private createButtonEl!: HTMLButtonElement;

	constructor(
		app: App,
		private params: CreateNoteModalParams,
	) {
		super(app);
		this.granularity = params.initialGranularity;
	}

	onOpen(): void {
		this.titleEl.setText("Create periodic note");
		const { contentEl } = this;
		contentEl.empty();

		const selector = contentEl.createDiv({ cls: "cpn-create-granularities" });
		for (const granularity of this.params.granularities) {
			const button = selector.createEl("button", {
				text: DISPLAY_CONFIGS[granularity].periodicity,
			});
			if (granularity === this.granularity) {
				button.addClass("mod-cta");
			}
			button.addEventListener("click", () => {
				this.granularity = granularity;
				this.renderSelectorState(selector);
				this.updatePreview();
				this.inputEl.focus();
			});
		}

		this.inputEl = contentEl.createEl("input", {
			cls: "cpn-create-input",
			type: "text",
			attr: {
				placeholder: "Today, +1, -2, or a date like 2024-03-15",
				"aria-label": "Date",
			},
		});
		this.inputEl.addEventListener("input", () => this.updatePreview());
		this.inputEl.addEventListener("keydown", (event: KeyboardEvent) => {
			if (event.key === "Enter") {
				event.preventDefault();
				this.submit();
			}
		});

		this.previewEl = contentEl.createDiv({ cls: "cpn-create-preview" });

		contentEl.createDiv("modal-button-container", (buttonsEl) => {
			buttonsEl
				.createEl("button", { text: "Cancel" })
				.addEventListener("click", () => this.close());
			this.createButtonEl = buttonsEl.createEl("button", {
				cls: "mod-cta",
				text: "Create",
			});
			this.createButtonEl.addEventListener("click", () => this.submit());
		});

		this.updatePreview();
		window.setTimeout(() => this.inputEl.focus(), 0);
	}

	private renderSelectorState(selector: HTMLElement): void {
		const buttons = selector.querySelectorAll("button");
		this.params.granularities.forEach((granularity, index) => {
			buttons[index]?.toggleClass("mod-cta", granularity === this.granularity);
		});
	}

	private resolveDate(): Moment | null {
		return parseDateInput(
			this.inputEl.value,
			this.granularity,
			this.params.getFormat(this.granularity),
		);
	}

	private updatePreview(): void {
		const date = this.resolveDate();
		this.previewEl.empty();

		if (!date) {
			this.previewEl.addClass("cpn-create-preview-invalid");
			this.previewEl.setText("Unrecognized date.");
			this.createButtonEl.disabled = true;
			return;
		}

		this.previewEl.removeClass("cpn-create-preview-invalid");
		this.createButtonEl.disabled = false;

		const path = this.params.getNotePath(this.granularity, date);
		this.previewEl.createSpan({ cls: "cpn-create-preview-path", text: path });
		if (this.params.noteExists(this.granularity, date)) {
			this.previewEl.createSpan({
				cls: "cpn-create-preview-exists",
				text: "Already exists — will open it.",
			});
		}
	}

	private submit(): void {
		const date = this.resolveDate();
		if (!date) {
			return;
		}
		this.params.onSubmit(this.granularity, date);
		this.close();
	}
}
