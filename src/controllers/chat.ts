import { Hono } from "hono";
import type { ContextVariables } from "../constants";
import type {
  DBChat,
  DBCreateChat,
  DBCreateMessage,
  DBMessage,
} from "../models/db";
import type { IDatabaseResource } from "../storage/types";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const CHAT_PREFIX = "/chat/";
const CHAT_ROUTE = "";
const CHAT_MESSAGE_ROUTE = ":id/message/";
const CHAT_DETAIL_ROUTE = ":id/";

// Validation schemas
const idSchema = z.object({
  id: z.string().min(1),
});
const chatSchema = z.object({
  name: z.string().min(1),
});
const messageSchema = z.object({
  message: z.string().min(1),
});

export function createChatApp(
  chatResource: IDatabaseResource<DBChat, DBCreateChat>,
  messageResource: IDatabaseResource<DBMessage, DBCreateMessage>
) {
  const chatApp = new Hono<ContextVariables>();

  // Endpoints create a chat for a user
  chatApp.post(CHAT_ROUTE, zValidator("json", chatSchema), async (c) => {
    const userId = c.get("userId");
    const { name } = c.req.valid("json");
    const data = await chatResource.create({ name, ownerId: userId });
    return c.json({ data });
  });

  // Endpoints get all chats owned by a user
  chatApp.get(CHAT_ROUTE, async (c) => {
    const userId = c.get("userId");
    const data = await chatResource.findAll({ ownerId: userId });
    return c.json({ data });
  });

  chatApp.get(CHAT_DETAIL_ROUTE, zValidator("param", idSchema), async (c) => {
    const { id } = c.req.valid("param");
    const userId = c.get("userId");
    const data = await chatResource.find({ id, ownerId: userId });
    return c.json({ data });
  });

  // Endpoints get all messages in a chat room
  chatApp.get(CHAT_MESSAGE_ROUTE, zValidator("param", idSchema), async (c) => {
    const { id: chatId } = c.req.valid("param");
    const data = await messageResource.findAll({ chatId });
    return c.json({ data });
  });

  // Endpoints create a message in a chat room for a user
  chatApp.post(
    CHAT_MESSAGE_ROUTE,
    zValidator("param", idSchema),
    zValidator("json", messageSchema),
    async (c) => {
      const { id: chatId } = c.req.valid("param");
      const { message } = c.req.valid("json");
      const userMessage: DBCreateMessage = { message, chatId, type: "user" };
      await messageResource.create(userMessage);
      const responseMessage: DBCreateMessage = {
        message: "dummy response",
        chatId,
        type: "system",
      };
      const data = await messageResource.create(responseMessage);
      return c.json({ data });
    }
  );

  return chatApp;
}
