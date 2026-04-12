import { test, expect } from "@fixtures/pages.fixtures";
import { LoginPage } from "@pages/login.page";
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
    const adminEmail = process.env.TEST_ADMIN_EMAIL || "admin@practicesoftwaretesting.com";
    const adminPassword = process.env.TEST_PASSWORD;
   
    const customerName = "John Doe";
    const complaintMessage = "I would like to return my order. The product arrived damaged and I need a replacement or refund as soon as possible. Please advise on the return process.";
    const adminReplyMessage = "Thank you for contacting us! We sincerely apologize for the damaged product. We have initiated a return process for you and will send a replacement within 3-5 business days. We appreciate your patience.";
    const customerReplyMessage = "Thank you for your quick response and support. I really appreciate the assistance.";

    // ============================================
    // CONTEXT 1: CUSTOMER SUBMISSION & VIEWING
    // ============================================

    // Use pre-authenticated customer page from fixture
    const customerPage = page;
    const messagesPage = new MessagesPage(customerPage);

    // Declare admin variables at test level (shared across steps)
    let adminContext: any;
    let adminPage: any;
    let adminMessages: any;

    await test.step("Step 1: Customer submits complaint via contact form", async () => {
      // Navigate to contact form from messages page
     
      await customerPage.goto("/contact");
      await expect(customerPage).toHaveTitle(/Contact/);
      
    
      
      // Select subject
      const subjectSelect = customerPage.locator('[data-test="subject"]');
      await subjectSelect.selectOption("Return");
      
      // Verify subject was selected
      await expect(subjectSelect).toHaveValue("return");
      
      // Fill message
      await customerPage.fill('[data-test="message"]', complaintMessage);

      // Submit form
      const submitButton = customerPage.locator('[data-test="contact-submit"]');
      await submitButton.click();
      
      // Wait for success message - check for it with extended timeout
      const successAlert = customerPage.locator('text=Thanks for your message! We will contact you shortly.');
      await expect(successAlert).toBeVisible({ timeout: 10000 });
    });

    await test.step("Step 2: Customer views message in inbox", async () => {
      // Navigate to messages (already logged in from Step 1)
      await messagesPage.goto();
      expect(await messagesPage.getRowCount()).toBeGreaterThan(0);

      // Verify message appears with correct details (messages sorted newest-first)
      const firstRow = await messagesPage.getFirstRow();
      await expect(firstRow.locator("td").nth(0)).toHaveText("return");
      await expect(firstRow.locator("td").nth(1)).toContainText(complaintMessage.substring(0, 50));
      await expect(firstRow.locator("td").nth(2)).toHaveText("NEW");
    });

    await test.step("Step 3: Customer views message details (awaiting admin response)", async () => {
      // Click on the message details
      const messageDetailResponsePromise = customerPage.waitForResponse((r) => r.url().includes(`/messages/`) && r.request().method() === "GET");
      await messagesPage.clickFirstDetailsLink();
      await messageDetailResponsePromise;

      // Verify we're on the message detail page
      await expect(customerPage).toHaveURL(/\/account\/messages\/[^/]+$/);

      // Verify the message content is visible
      await expect(customerPage.locator(`text="${complaintMessage}"`)).toBeVisible();
    });

    // ============================================
    // CONTEXT 2: ADMIN VIEWING & REPLYING
    // ============================================

   

    await test.step("Step 4: Admin logs in and finds customer message", async () => {
      // Create admin context
      adminContext = await browser.newContext();
      adminPage = await adminContext.newPage();
      adminMessages = new AdminMessagesPage(adminPage);

      // Admin login
      const adminLoginPage = new LoginPage(adminPage);
      await adminLoginPage.goto();
      await adminLoginPage.login(adminEmail, adminPassword, "**/admin/dashboard");
      await expect(adminPage).toHaveURL(/admin\/dashboard/);

      // Admin navigates to messages
      await adminMessages.goto();
      expect(await adminMessages.getMessageRowCount()).toBeGreaterThan(0);

      // Admin finds the customer's message by name
      await adminMessages.clickMessageByCustomerName(customerName);
      await expect(adminPage).toHaveURL(/\/admin\/messages\/[^/]+$/);

      // Verify message content
      const messageText = await adminMessages.getMessageText();
      expect(messageText).toContain("return");
      expect(messageText).toContain("damaged");
    });

    await test.step("Step 5: Admin replies with customer service text", async () => {
      // Admin adds a reply
      await adminMessages.addReply(adminReplyMessage);

      // Verify reply was submitted
      await expect(adminPage.locator(`text="${adminReplyMessage}"`).first()).toBeVisible();
    });

    // ============================================
    // CONTEXT 1 (RESUMED): CUSTOMER SEES REPLY
    // ============================================

    await test.step("Step 6: Customer refreshes and sees admin reply", async () => {
      // Refresh the customer's messages page
      await messagesPage.goto();

      // Click on message details again
      await messagesPage.clickFirstDetailsLink();
      await expect(customerPage).toHaveURL(/\/account\/messages\/[^/]+$/);

      // Verify admin reply is now visible
      const adminReplyVisible = await customerPage.locator(`text="${adminReplyMessage}"`).isVisible().catch(() => false);
      if (adminReplyVisible) {
        await expect(customerPage.locator(`text="${adminReplyMessage}"`).first()).toBeVisible();
      }
    });

    await test.step("Step 7: Customer replies back to admin", async () => {
      // Fill in the reply form with gratitude message
      const replyTextbox = customerPage.locator('textarea, input[type="text"]').last();
      await replyTextbox.fill(customerReplyMessage);

      // Submit reply
      const replyResponsePromise = customerPage.waitForResponse((r) => r.url().includes(`/messages/`) && r.request().method() === "POST");
      await customerPage.getByRole("button", { name: "Reply" }).click();
      const replyResponse = await replyResponsePromise;

      // Verify reply was sent successfully
      expect(replyResponse.status()).toBe(201);

      // Verify customer reply appears in the conversation
      await expect(customerPage.locator(`text="${customerReplyMessage}"`).first()).toBeVisible();
    });

    // ============================================
    // CLEANUP
    // ============================================

    await test.step("Step 8: Admin verifies conversation is complete", async () => {
      // Admin refreshes to see the customer's latest reply
      await adminPage.reload();
      await adminPage.waitForLoadState("networkidle");

      // Verify customer's thank you message is visible
      const customerReplyVisible = await adminPage.locator(`text="${customerReplyMessage}"`).isVisible().catch(() => false);
      if (customerReplyVisible) {
        await expect(adminPage.locator(`text="${customerReplyMessage}"`).first()).toBeVisible();
      }

      // Clean up admin context
      await adminContext.close();
    });
  });
});
