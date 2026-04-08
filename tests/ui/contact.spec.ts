import { test, expect } from "@fixtures/pages.fixtures";
import { registerUser } from "@datafactory/register";
import { createMessage } from "@helpers/messages";

test.describe("Contact Page", () => {
  test("should be able to send contact form and view it", async ({ page, context, loginPage, messagesPage }) => {

    const email = `customer+${Date.now()}_${Math.random().toString(36).substring(2, 7)}@practicesoftwaretesting.com`;
    const password = process.env.NEW_USER_PASSWORD!;
    const dropdownOption = "payments";
    const message = "This is a test message created via data factory and it has to be long enough to pass the validation check in the contact form.";
    const authFile = ".auth/contact_user.json";
    let messageId: string;

    await test.step("Register a new user and log in", async () => {
      await registerUser(email, password);
      await loginPage.goto();
      await loginPage.login(email, password);
      await context.storageState({ path: authFile });
    });

    await test.step("Create a message via datafactory", async () => {
      const response = await createMessage(dropdownOption, message, authFile, "Joe Bloggs");
      messageId = response.id;
    });

    await test.step("Can see the created message in the messages page", async () => {
      await messagesPage.goto();
      expect(await messagesPage.getRowCount()).toBeGreaterThan(0);
      const lastRow = await messagesPage.getLastRow();
      await expect(lastRow.locator("td").nth(0)).toHaveText(dropdownOption);
      await expect(lastRow.locator("td").nth(1)).toContainText(message.substring(0, 50));
      await expect(lastRow.locator("td").nth(2)).toHaveText("NEW");
    });

    await test.step("Can reply to the message details", async () => {
      const replyMessage = "This is a reply to the message";
     // without waiting for the message detail response, the form is blank
      const messageDetailResponsePromise = page.waitForResponse(
        (r) => r.url().includes(`/messages/${messageId}`) && r.request().method() === "GET"
      );
      await messagesPage.clickLastDetailsLink();
      await messageDetailResponsePromise;
      await expect(page).toHaveURL(new RegExp(`/account/messages/${messageId}$`));

      await messagesPage.fillReply(replyMessage);
      const replyResponsePromise = page.waitForResponse(
        (r) => r.url().includes(`/messages/${messageId}/reply`) && r.request().method() === "POST"
      );
      await messagesPage.clickReplyButton();
      const body = await (await replyResponsePromise).json();
      expect(body.message).toBe(replyMessage);
    });
  });
});
