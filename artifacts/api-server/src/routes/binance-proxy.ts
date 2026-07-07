import { Router } from "express";

const router = Router();
const BINANCE_BASE = "https://api.binance.com";

router.use(async (req, res) => {
  const url = `${BINANCE_BASE}${req.url}`;
  try {
    const upstream = await fetch(url);
    const contentType = upstream.headers.get("content-type") ?? "application/json";
    const body = await upstream.text();
    res.status(upstream.status).set("content-type", contentType).send(body);
  } catch (err: any) {
    res.status(502).json({ error: "Binance proxy error", detail: err?.message });
  }
});

export default router;
