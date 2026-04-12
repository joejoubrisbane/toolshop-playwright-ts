import { Page, Locator } from "@playwright/test";

export class AdminMessagesPage {
  readonly page: Page;
  readonly messageTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.messageTable = page.locator("table");
  }

  async goto() {
    await this.page.goto("/admin/messages");
    await this.messageTable.waitFor({ state: "visible" });
  }

  async getMessageRowCount(): Promise<number> {
    const rows = this.messageTable.locator("tbody tr");
    return await rows.count();
  }

  async findMessageByCustomerName(customerName: string): Promise<Locator | null> {
    const rows = this.messageTable.locator("tbody tr");
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const nameCell = row.locator("td").nth(0);
      const text = await nameCell.textContent();

      if (text && text.includes(customerName)) {
        return row;
      }
    }
    return null;
  }

  async clickMessageByCustomerName(customerName: string) {
    const row = await this.findMessageByCustomerName(customerName);
    if (row) {
      // Click the "Details" or first action link in the row
      const detailsLink = row.locator("a").first();
      await detailsLink.click();
      await this.page.locator("p").first().waitFor({ state: "visible" });
    }
  }

  async getMessageText(): Promise<string> {
    // Get the message content paragraph (first p before the Replies heading)
    const messageContent = this.page.locator("p").first();
    await messageContent.waitFor({ state: "visible" });
    return await messageContent.textContent() || "";
  }

  async addReply(replyText: string) {
    // Fill the reply text field
    const textField = this.page.locator("textarea").first();
    await textField.fill(replyText);

    // Click submit/reply button
    const submitButton = this.page.getByRole("button", { name: /Reply|Submit|Send/i }).first();
    await submitButton.click();

    // Wait for reply to appear in the DOM
    await this.page.locator(".card-text", { hasText: replyText }).first().waitFor({ state: "visible" });
  }

}
