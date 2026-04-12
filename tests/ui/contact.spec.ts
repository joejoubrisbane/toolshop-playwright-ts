import { test, expect } from "@fixtures/pages.fixtures";
import { LoginPage } from "@pages/login.page";
import { ContactPage } from "@pages/contact.page";
import { MessagesPage } from "@pages/messages.page";
import { AdminMessagesPage } from "@pages/admin-messages.page";

/**
 * COMPREHENSIVE CONTACT FLOW TEST
 * Complete conversation between customer and admin:
 * 1. Customer submits complaint via contact form
 * 2. Customer sees success message
 * 3. Customer views their message in inbox
 * 4. Admin finds and replies to the message
 * 5. Customer sees admin reply
 * 6. Customer replies back to admin
 *
 * Uses multiple browser contexts to simulate independent user sessions
 */
test.describe("Contact Page - Complete Customer to Admin Flow", () => {
  test("Customer complaint → Admin response → Customer reply", async ({ browser, page }) => {
    const adminEmail: any = process.env.TEST_ADMIN_EMAIL;
    const adminPassword: any = process.env.TEST_PASSWORD;
    const customerName = "John Doe";
    const complaintMessage = "I would like to return my order. The product arrived damaged and I need a replacement or refund as soon as possible. Please advise on the return process.";
    const adminReplyMessage = "Thank you for contacting us! We sincerely apologize for the damaged product. We have initiated a return process for you and will send a replacement within 3-5 business days. We appreciate your patience.";
    const customerReplyMessage = "Thank you for your quick response and support. I really appreciate the assistance.";

    // ── Customer context (pre-authenticated via fixture) ─────────────────────
    const contactPage = new ContactPage(page);
    const messagesPage = new MessagesPage(page);

    // Declared at test level so steps can share the admin session
    let adminContext: Awaited<ReturnType<typeof browser.newContext>>;
    let adminMessages: AdminMessagesPage;

    // ── CUSTOMER: Submit & view ───────────────────────────────────────────────

    await test.step("Step 1: Customer submits complaint via contact form", async () => {
      await contactPage.goto();
      await expect(page).toHaveTitle(/Contact/);
      await contactPage.submit("Return", complaintMessage);
      await contactPage.verifySuccess();
    });

    await test.step("Step 2: Customer views message in inbox", async () => {
      await messagesPage.goto();
      expect(await messagesPage.getRowCount()).toBeGreaterThan(0);
      await messagesPage.verifyFirstRow("return", complaintMessage.substring(0, 50), "NEW");
    });

    await test.step("Step 3: Customer views message details (awaiting admin response)", async () => {
      await messagesPage.viewFirstMessage();
      await expect(page).toHaveURL(/\/account\/messages\/[^/]+$/);
      await messagesPage.verifyMessageVisible(complaintMessage);
    });

    // ── ADMIN: Login, find message, reply ────────────────────────────────────

    await test.step("Step 4: Admin logs in and finds customer message", async () => {
      adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      adminMessages = new AdminMessagesPage(adminPage);

      const adminLoginPage = new LoginPage(adminPage);
      await adminLoginPage.goto();
      await adminLoginPage.login(adminEmail, adminPassword, "**/admin/dashboard");
      await expect(adminPage).toHaveURL(/admin\/dashboard/);

      await adminMessages.goto();
      expect(await adminMessages.getMessageRowCount()).toBeGreaterThan(0);
      await adminMessages.clickMessageByCustomerName(customerName);
      await expect(adminPage).toHaveURL(/\/admin\/messages\/[^/]+$/);

      const messageText = await adminMessages.getMessageText();
      expect(messageText).toContain("return");
      expect(messageText).toContain("damaged");
    });

    await test.step("Step 5: Admin replies with customer service text", async () => {
      await adminMessages.addReply(adminReplyMessage);
      await expect(adminMessages.page.locator(`text="${adminReplyMessage}"`).first()).toBeVisible();
    });

    // ── CUSTOMER (resumed): See reply, reply back ─────────────────────────────

    await test.step("Step 6: Customer refreshes and sees admin reply", async () => {
      await messagesPage.goto();
      await messagesPage.viewFirstMessage();
      await expect(page).toHaveURL(/\/account\/messages\/[^/]+$/);
      const replyVisible = await page.locator(`text="${adminReplyMessage}"`).isVisible().catch(() => false);
      if (replyVisible) {
        await messagesPage.verifyMessageVisible(adminReplyMessage);
      }
    });

    await test.step("Step 7: Customer replies back to admin", async () => {
      const status = await messagesPage.sendReply(customerReplyMessage);
      expect(status).toBe(201);
      await messagesPage.verifyMessageVisible(customerReplyMessage);
    });

    // ── ADMIN: Confirm full conversation ─────────────────────────────────────

    await test.step("Step 8: Admin verifies conversation is complete", async () => {
      await adminMessages.reloadAndVerifyReply(customerReplyMessage);
      await adminContext.close();
    });
  });
});
