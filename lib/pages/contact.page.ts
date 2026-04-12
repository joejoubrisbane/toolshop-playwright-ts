import { type Page, expect } from "@playwright/test";

export class ContactPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/contact");
  }

  async submit(subject: string, message: string) {
    const subjectSelect = this.page.getByRole("combobox", { name: "Subject" });
    await subjectSelect.selectOption(subject);
    await expect(subjectSelect).toHaveValue(subject.toLowerCase());
    await this.page.getByRole("textbox", { name: "Message *" }).fill(message);
    await this.page.getByRole("button", { name: "Send" }).click();
  }

  async verifySuccess() {
    await expect(
      this.page.getByRole("alert")
    ).toContainText("Thanks for your message! We will contact you shortly.", { timeout: 10000 });
  }
}
