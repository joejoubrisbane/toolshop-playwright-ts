import { type Page, type Locator } from "@playwright/test";

export class MessagesPage {
  readonly page: Page;
  readonly rows: Locator;
  readonly detailsLink: Locator;
  readonly replyInput: Locator;
  readonly replyButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rows = page.locator("table tbody tr");
    this.detailsLink = page.getByRole("link", { name: "Details" });
    this.replyInput = page.getByTestId("message");
    this.replyButton = page.getByRole("button", { name: "Reply" });
  }

  async goto() {
    await this.page.goto("/account/messages");
    await this.page.waitForLoadState("networkidle");
  }

  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  async getLastRow(): Promise<Locator> {
    const count = await this.rows.count();
    return this.rows.nth(count - 1);
  }

  async clickLastDetailsLink() {
    await this.detailsLink.last().click();
  }

  async fillReply(message: string) {
    await this.replyInput.fill(message);
  }

  async clickReplyButton() {
    await this.replyButton.click();
  }
}
