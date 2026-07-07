---
name: WhaleEye data truth
description: Honest data source facts for WhaleEye — prevents re-introducing misleading claims
---

## Rule
WhaleEye uses ONLY Binance public REST polling. There is NO WebSocket connection.

**Why:** Binance WebSocket is blocked in the Replit proxy environment (CORS/proxy restriction). All depth/ticker data is REST polling via `/api/binance` Express proxy.

## Data polling intervals
- Order book depth: REST `/api/v3/depth` every 1s (useLiveDepth)
- Ticker: REST `/api/v3/ticker/24hr` every 2s (useLiveTicker)
- Multi-ticker: REST every 5s (useLiveTickers)  
- Klines: REST every 15s (useQuery + fetchKlines)

## CVD and OFI
- CVD is price-direction proxy × book notional × imbalance amplifier — NOT aggTrade WebSocket
- OFI is Δ between consecutive REST book snapshots (~1s delta) — NOT tick-by-tick

## RL Agent
- RLAgentPanel.tsx runs a full REINFORCE algorithm entirely in-browser (client-side JS)
- Randomly initialized on every page load — NOT a pre-trained model
- `/api/rl/action` endpoint exists but is NOT called by the main dashboard — it's dead code
- The panel is labeled "محاكاة محلية تجريبية" (local experimental simulation)

## How to apply
Never use "WebSocket", "بث مباشر", or "LIVE" to describe the data connection.
Always use "REST polling", "استطلاع REST", or specify the interval (~1s/~2s/~15s).
