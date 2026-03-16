import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import messagesRouter from "./messages";
import phoneRouter from "./phone";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(messagesRouter);
router.use(phoneRouter);

export default router;
