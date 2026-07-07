import { Router } from "express";

const router = Router();
const FUTURES_BASE = "https://fapi.binance.com";

router.use(async (req, res) => {
  // Binance Futures has two base paths:
  // /fapi/v1/* → market data (fundingRate, premiumIndex, openInterest, klines...)
  // /futures/data/* → data endpoints (openInterestHist, topLongShort...)
  const path = req.url;
  const upstreamPath = path.startsWith("/futures/data/") ? path : `/fapi${path}`;
  const url = `${FUTURES_BASE}${upstreamPath}`;
  try {
    const upstream = await fetch(url);
    const contentType = upstream.headers.get("content-type") ?? "application/json";
    const body = await upstream.text();
    res.status(upstream.status).set("content-type", contentType).send(body);
  } catch (err: any) {
    res.status(502).json({ error: "Binance Futures proxy error", detail: err?.message });
  }
});

export default router;
