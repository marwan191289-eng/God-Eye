const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const BINANCE_BASES = [
  'https://api.binance.com/api/v3',
  'https://api1.binance.com/api/v3',
  'https://api2.binance.com/api/v3',
  'https://api3.binance.com/api/v3',
];

const SYMBOL_RE = /^[A-Z0-9]{4,20}$/;
const ALLOWED_INTERVALS = new Set(['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M']);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function fetchFromBinance(path: string) {
  let lastError = 'Binance request failed';
  for (const base of BINANCE_BASES) {
    try {
      const response = await fetch(`${base}${path}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'TradeXRay-WarRoom/1.0' },
      });
      const text = await response.text();
      if (response.ok) return new Response(text, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=15' },
      });
      lastError = `Binance ${response.status}: ${text.slice(0, 180)}`;
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  return json({ error: lastError }, 502);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const url = new URL(req.url);
  const kind = url.searchParams.get('kind') || 'klines';
  const symbol = (url.searchParams.get('symbol') || '').toUpperCase();
  if (!SYMBOL_RE.test(symbol)) return json({ error: 'Invalid symbol' }, 400);

  if (kind === 'ticker') {
    return fetchFromBinance(`/ticker/24hr?symbol=${encodeURIComponent(symbol)}`);
  }

  if (kind === 'klines') {
    const interval = url.searchParams.get('interval') || '1h';
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 1), 500);
    if (!ALLOWED_INTERVALS.has(interval)) return json({ error: 'Invalid interval' }, 400);
    return fetchFromBinance(`/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`);
  }

  return json({ error: 'Invalid kind' }, 400);
});
