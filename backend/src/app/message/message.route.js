import { Router } from "express";
import * as messageController from "./controllers/message.controller.js";
import { guard } from "../../lib/auth/guard.js";

const messageRouter = Router();

messageRouter.post("/", messageController.sendMessage);
messageRouter.post("/public", guard, messageController.sendMessage);
messageRouter.get("/public", guard, messageController.getAllMessages);
// for notes in your own inbox
messageRouter.delete("/:id", guard, messageController.deleteMessage);
messageRouter.post("/:id/block", guard, messageController.blockSender);
messageRouter.post("/:id/report", guard, messageController.reportMessage);

export default messageRouter;
