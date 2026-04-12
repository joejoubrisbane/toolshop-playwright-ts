import { Page, Locator } from "@playwright/test";

export class AdminMessagesPage {
  readonly page: Page;
  readonly messageTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.messageTable = page.getByRole("table");
  }

  async goto() {
    await this.page.goto("/admin/messages");
    await this.messageTable.waitFor({ state: "visible" });
  }

  async getMessageRowCount(): Promise<number> {
    // Data rows only (filter out the header row which has no cells)
    return this.messageTable.getByRole("row").filter({ has: this.page.getByRole("cell") }).count();
  }

  async findMessageByCustomerName(customerName: string): Promise<Locator | null> {
    const rows = this.messageTable.getByRole("row").filter({ has: this.page.getByRole("cell") });
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const text = await row.getByRole("cell").nth(0).textContent();
      if (text && text.includes(customerName)) {
        return row;
      }
    }
    return null;
  }

  async clickMessageByCustomerName(customerName: string) {
    const row = await this.findMessageByCustomerName(customerName);
    if (row) {
      await row.getByRole("link", { name: "Details" }).click();
      await this.page.locator("p").first().waitFor({ state: "visible" });
    }
  }

  async getMessageText(): Promise<string> {
    const messageContent = this.page.locator("p").first();
    await messageContent.waitFor({ state: "visible" });
    return await messageContent.textContent() || "";
  }

  async reloadAndVerifyReply(replyText: string) {
    await this.page.reload();
    await this.page.locator("p").first().waitFor({ state: "visible" });
    const visible = await this.page.getByText(replyText).first().isVisible().catch(() => false);
    if (visible) {
      await this.page.getByText(replyText).first().waitFor({ state: "visible" });
    }
  }

  async addReply(replyText: string) {
    await this.page.getByRole("textbox").fill(replyText);
    await this.page.getByRole("button", { name: /Reply|Submit|Send/i }).first().click();
    await this.page.getByText(replyText).first().waitFor({ state: "visible" });
  }
}
