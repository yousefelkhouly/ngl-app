import { Router } from "express";
import * as requestController from "./controllers/request.controller.js";
import { guard } from "../../lib/auth/guard.js";

const requestRouter = Router();
requestRouter.patch("/:id/accept", guard, requestController.acceptRequest);
requestRouter.patch("/:id/decline", guard, requestController.declineRequest);

export default requestRouter;
