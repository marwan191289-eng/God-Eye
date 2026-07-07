import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import signalsRouter from "./signals-enhanced";
import meRouter from "./me";
import authRouter from "./auth";
import subscriptionsRouter from "./subscriptions";
import rlRouter from "./rl";
import binanceProxyRouter from "./binance-proxy";
import binanceFuturesProxyRouter from "./binance-futures-proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/admin", adminRouter);
router.use("/signals", signalsRouter);
router.use("/me", meRouter);
router.use("/auth", authRouter);
router.use("/subscriptions", subscriptionsRouter);
router.use("/rl", rlRouter);
router.use("/binance", binanceProxyRouter);
router.use("/fapi", binanceFuturesProxyRouter);

export default router;
