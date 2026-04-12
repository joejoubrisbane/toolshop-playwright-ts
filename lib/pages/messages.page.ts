import { type Page, type Locator, expect } from "@playwright/test";

export class MessagesPage {
  readonly page: Page;
  readonly rows: Locator;
  readonly detailsLink: Locator;
  readonly replyButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Data rows only (filter out the header row which has no cells)
    this.rows = page.getByRole("table").getByRole("row").filter({ has: page.getByRole("cell") });
    this.detailsLink = page.getByRole("link", { name: "Details" });
    this.replyButton = page.getByRole("button", { name: "Reply" });
  }

  // ── Inbox ────────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto("/account/messages");
    await this.rows.first().waitFor({ state: "visible" });
  }

  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  async getFirstRow(): Promise<Locator> {
    return this.rows.first();
  }

  async getLastRow(): Promise<Locator> {
    const count = await this.rows.count();
    return this.rows.nth(count - 1);
  }

  /** Assert subject, message preview, and status on the newest inbox row. */
  async verifyFirstRow(subject: string, messagePreview: string, status: string) {
    const row = await this.getFirstRow();
    await expect(row.getByRole("cell").nth(0)).toHaveText(subject);
    await expect(row.getByRole("cell").nth(1)).toContainText(messagePreview);
    await expect(row.getByRole("cell").nth(2)).toHaveText(status);
  }

  // ── Message detail ───────────────────────────────────────────────────────

  /** Click the first Details link and wait for the GET detail response. */
  async viewFirstMessage() {
    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes("/messages/") && r.request().method() === "GET"
    );
    await this.detailsLink.first().click();
    await responsePromise;
  }

  /** Assert that a piece of text is visible in the message detail. */
  async verifyMessageVisible(text: string) {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }

  /** Fill the reply box, click Reply, wait for the POST, and return the HTTP status. */
  async sendReply(text: string): Promise<number> {
    await this.page.getByRole("textbox").fill(text);
    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes("/messages/") && r.request().method() === "POST"
    );
    await this.replyButton.click();
    const response = await responsePromise;
    return response.status();
  }
}
