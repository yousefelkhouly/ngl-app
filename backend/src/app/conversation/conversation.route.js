import { Router } from "express";
import * as conversationController from "./controllers/conversation.controller.js";
import { guard } from "../../lib/auth/guard.js";

const conversationRouter = Router();

conversationRouter.get("/", guard, conversationController.getConversations);
conversationRouter.get("/:id", guard, conversationController.getConversation);
conversationRouter.post(
  "/:id/messages",
  guard,
  conversationController.sendMessage,
);

export default conversationRouter;
