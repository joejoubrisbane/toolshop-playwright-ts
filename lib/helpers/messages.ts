import { expect,request } from "@playwright/test";
import * as fs from "fs";

function getAuthToken(filePath: string): string {
  const authData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const authToken = authData.origins[0].localStorage.find(
    (item: any) => item.name === 'auth-token'
  );
  return authToken?.value || '';
}
export async function createMessage(subject: string, message: string, path: string, name?:string) {
    
    const apiUrl = process.env.API_URL;
    const createRequestContext = await request.newContext({
      extraHTTPHeaders: {
        Authorization: `Bearer ${getAuthToken(path)}`,
      },
    });
    const response = await createRequestContext.post(`${apiUrl}/messages`, {
      data: {
        name: name,
        subject: subject,
        message: message,
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    console.log("Message created with ID:", body.id);
    return body;
}