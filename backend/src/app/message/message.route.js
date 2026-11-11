import { Router } from "express";
import * as messageController from "./controllers/message.controller.js";
import { guard } from "../../lib/auth/guard.js";

const messageRouter = Router();

// anonymous: no login, the sender isn't recorded
messageRouter.post("/", messageController.sendMessage);
// logged in: the sender is recorded
messageRouter.post("/public", guard, messageController.sendMessage);
// the logged-in user's inbox
messageRouter.get("/public", guard, messageController.getAllMessages);

export default messageRouter;
