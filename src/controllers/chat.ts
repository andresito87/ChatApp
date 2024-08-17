import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { ContextVariables } from "../constants";
import type {
  DBChat,
  DBCreateChat,
  DBCreateMessage,
  DBMessage,
} from "../models/db";
import type { IDatabaseResource } from "../storage/types";

const idSchema = z.object({
  id: z.string().min(1),
});

const chatSchema = z.object({
  name: z.string().min(1),
});

const messageSchema = z.object({
  message: z.string().min(1),
});
export const CHAT_PREFIX = "/chat/";
const CHAT_ROUTE = "";
const CHAT_DETAIL_ROUTE = ":id/";
const CHAT_MESSAGE_ROUTE = ":id/message/";
export function createChatApp(
  chatResource: IDatabaseResource<DBChat, DBCreateChat>,
  messageResource: IDatabaseResource<DBMessage, DBCreateMessage>
) {
  const chatApp = new Hono<ContextVariables>();

  chatApp.post(CHAT_ROUTE, zValidator("json", chatSchema), async (c) => {
    const userId = c.get("userId");
    const { name } = c.req.valid("json");
    const data = await chatResource.create({ name, ownerId: userId });
    const res = { data };
    c.get("cache").clearPath(c.req.path);
    return c.json(res, 201);
  });

  chatApp.get(CHAT_ROUTE, async (c) => {
    const userId = c.get("userId");
    const data = await chatResource.findAll({ ownerId: userId });
    const res = { data };
    c.get("cache").cache(res);
    return c.json(res);
  });

  chatApp.get(CHAT_DETAIL_ROUTE, zValidator("param", idSchema), async (c) => {
    const { id } = c.req.valid("param");
    const userId = c.get("userId");
    const data = await chatResource.find({ id, ownerId: userId });
    const res = { data };
    c.get("cache").cache(res);
    return c.json(res);
  });

  chatApp.get(CHAT_MESSAGE_ROUTE, zValidator("param", idSchema), async (c) => {
    const { id: chatId } = c.req.valid("param");
    const data = await messageResource.findAll({ chatId });
    const res = { data };
    c.get("cache").cache(res);
    return c.json(res);
  });

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
      const res = { data };
      c.get("cache").clearPath(c.req.path);
      return c.json(res, 201);
    }
  );

  // Endpoints delete a message in a chat room for a user
  chatApp.delete(CHAT_ROUTE, zValidator("json", idSchema), async (c) => {
    const { id } = c.req.valid("json");
    const data = await messageResource.delete(id);
    return c.json({ data });
  });

  return chatApp;
}
