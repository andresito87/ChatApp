import { beforeEach, describe, expect, test } from "bun:test";
import { createInMemoryApp } from "../src/controllers/main";

describe("chat tests", () => {
  let app: ReturnType<typeof createInMemoryApp>;
  beforeEach(async () => {
    app = createInMemoryApp();
  });

  // Function to get a authorization token
  async function getToken(email = "test@test.com"): Promise<string> {
    await app.request("/api/v1/auth/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: "password123",
        name: "Chat User",
      }),
    });
    const loginResponse = await app.request("/api/v1/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: "password123",
      }),
    });
    const token = ((await loginResponse.json()) as any).token;
    return token!;
  }

  // Function to create a chat
  async function createChat(token: string): Promise<number> {
    const createChatResponse = await app.request("/api/v1/chat/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "Test Chat" }),
    });
    const response = await createChatResponse.json();
    const chatId = (response as any).data.id;
    return chatId;
  }

  /******* CHATS ********/
  test("GET /chat/ - get user chats", async () => {
    const token = await getToken();
    const chatId = await createChat(token);
    const response = await app.request("/api/v1/chat/", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    const responseData = await response.json();
    const data = (responseData as any).data;
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(chatId);
  });

  test("GET /chat/ - get user chats when multiple chat and users are available", async () => {
    const token = await getToken();
    const token2 = await getToken("email@email.com");

    const chatId = await createChat(token);
    const response = await app.request("/api/v1/chat/", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    const responseData = await response.json();
    const data = (responseData as any).data;
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(chatId);

    const chatId2 = await createChat(token2);
    const response2 = await app.request("/api/v1/chat/", {
      method: "GET",
      headers: { Authorization: `Bearer ${token2}` },
    });
    expect(response2.status).toBe(200);
    const responseData2 = await response2.json();
    const data2 = (responseData2 as any).data;
    expect(Array.isArray(data2)).toBeTruthy();
    expect(data2.length).toBe(1);
    expect(data2[0].id).toBe(chatId2);
  });

  /******* CHAT DETAILS ********/
  test("GET /chat/:id - get chat details", async () => {
    const token = await getToken();
    const chatId = await createChat(token);
    const response = await app.request(`/api/v1/chat/${chatId}/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    const responseData = await response.json();
    const data = (responseData as any).data;
    expect(data.id).toBe(chatId);
    expect(data.name).toBe("Test Chat");
  });

  /******* CHAT MESSAGES ********/
  test("POST, GET /chat/:id/message/ - create and get chat messages", async () => {
    const token = await getToken();
    const chatId = await createChat(token);
    await app.request(`/api/v1/chat/${chatId}/message/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: "This is a new message" }),
    });
    const response = await app.request(`/api/v1/chat/${chatId}/message/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    const messages = await response.json();
    expect((messages as any).data).toBeInstanceOf(Array);
    expect((messages as any).data.length).toBe(2);
    expect((messages as any).data[0].message).toBe("This is a new message");
    expect((messages as any).data[1].message).toBe("dummy response");
  });

  /******* ZOD VALIDATIONS ********/
  test("POST /chat - incorrect body", async () => {
    const token = await getToken();
    const jsonBody = {
      name: "",
    };
    const response = await app.request("/api/v1/chat/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(jsonBody),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        issues: [
          {
            code: "too_small",
            minimum: 1,
            type: "string",
            inclusive: true,
            exact: false,
            message: "String must contain at least 1 character(s)",
            path: ["name"],
          },
        ],
        name: "ZodError",
      },
    });
  });

  test("POST /chat/:id/message - incorrect body", async () => {
    const token = await getToken();
    const response = await app.request(`/api/v1/chat/a/message/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            received: "undefined",
            path: ["message"],
            message: "Required",
          },
        ],
        name: "ZodError",
      },
    });
  });
});
