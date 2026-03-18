import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import messagesRouter from "./messages";
import phoneRouter from "./phone";
import supportRouter from "./support";
import contactRouter from "./contact";
import manageRouter from "./manage";
import passwordResetRouter from "./password-reset";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(messagesRouter);
router.use(phoneRouter);
router.use(supportRouter);
router.use(contactRouter);
router.use(manageRouter);
router.use(passwordResetRouter);

export default router;
