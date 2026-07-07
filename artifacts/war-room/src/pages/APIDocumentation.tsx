import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Code, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  example: string;
  response: string;
}

const APIDocumentation = () => {
  useDocumentMeta({
    title: "API Documentation — TradeXRay AI",
    description: "REST API reference for TradeXRay AI: programmatic access to trading signals, auth, and account endpoints.",
    canonicalPath: "/api-docs",
  });
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const endpoints: APIEndpoint[] = [
    {
      method: "GET",
      path: "/api/signals",
      description: "Get all trading signals",
      auth: true,
      example: `curl -X GET https://api.tradexray.com/api/signals \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      response: `[
  {
    "id": "sig_123",
    "symbol": "BTC/USD",
    "side": "LONG",
    "entry": 45000,
    "stop": 44000,
    "target": 50000,
    "confidence": 0.85,
    "outcome": "WIN",
    "pnlPct": 10.5,
    "createdAt": "2024-05-17T10:30:00Z"
  }
]`,
    },
    {
      method: "POST",
      path: "/api/signals",
      description: "Create a new trading signal",
      auth: true,
      example: `curl -X POST https://api.tradexray.com/api/signals \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "symbol": "ETH/USD",
    "side": "SHORT",
    "entry": 2500,
    "stop": 2600,
    "target": 2300,
    "confidence": 0.75
  }'`,
      response: `{
  "id": "sig_456",
  "symbol": "ETH/USD",
  "side": "SHORT",
  "entry": 2500,
  "stop": 2600,
  "target": 2300,
  "confidence": 0.75,
  "createdAt": "2024-05-17T11:00:00Z"
}`,
    },
    {
      method: "PATCH",
      path: "/api/signals/:id/outcome",
      description: "Update signal outcome",
      auth: true,
      example: `curl -X PATCH https://api.tradexray.com/api/signals/sig_123/outcome \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "outcome": "WIN",
    "pnlPct": 10.5
  }'`,
      response: `{
  "id": "sig_123",
  "outcome": "WIN",
  "pnlPct": 10.5,
  "resolvedAt": "2024-05-17T12:00:00Z"
}`,
    },
    {
      method: "GET",
      path: "/api/signals/analytics",
      description: "Get signal analytics",
      auth: true,
      example: `curl -X GET "https://api.tradexray.com/api/signals/analytics?days=30" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      response: `{
  "summary": {
    "totalSignals": 45,
    "resolvedSignals": 38,
    "winRate": 68.42,
    "avgPnl": 2.35
  },
  "bySymbol": {
    "BTC/USD": {
      "count": 15,
      "wins": 11,
      "avgPnl": 3.2
    }
  }
}`,
    },
  ];

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">API Documentation</h1>
          <p className="text-slate-400">Integrate TradeXray signals into your applications</p>
        </div>

        {/* Getting Started */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Quick start guide for API integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-white mb-2">1. Get Your API Key</h3>
                <p className="text-slate-300">
                  Go to Settings → API Keys to generate your API key. Keep it secure and never share it publicly.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">2. Base URL</h3>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 font-mono text-sm text-emerald-400">
                  https://api.tradexray.com/api
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">3. Authentication</h3>
                <p className="text-slate-300 mb-2">Include your API key in the Authorization header:</p>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 font-mono text-sm text-emerald-400">
                  Authorization: Bearer YOUR_API_KEY
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>Available endpoints and their usage</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="0" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-700">
                {endpoints.map((_, idx) => (
                  <TabsTrigger key={idx} value={String(idx)} className="text-xs">
                    {endpoints[idx].method}
                  </TabsTrigger>
                ))}
              </TabsList>

              {endpoints.map((endpoint, idx) => (
                <TabsContent key={idx} value={String(idx)} className="space-y-4">
                  <div className="space-y-4">
                    {/* Endpoint Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${
                            endpoint.method === "GET"
                              ? "bg-blue-900 border-blue-700 text-blue-300"
                              : endpoint.method === "POST"
                              ? "bg-green-900 border-green-700 text-green-300"
                              : "bg-yellow-900 border-yellow-700 text-yellow-300"
                          }`}
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="text-white font-mono">{endpoint.path}</code>
                      </div>
                      <p className="text-slate-300">{endpoint.description}</p>
                      {endpoint.auth && (
                        <Badge variant="outline" className="bg-red-900 border-red-700 text-red-300 w-fit">
                          Requires Authentication
                        </Badge>
                      )}
                    </div>

                    {/* Example Request */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-white">Example Request</h4>
                      <div className="relative bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <pre className="text-sm text-emerald-400 overflow-x-auto font-mono">
                          {endpoint.example}
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label="Copy example request"
                          className="absolute top-2 right-2 border-slate-600"
                          onClick={() => copyToClipboard(endpoint.example, `example-${idx}`)}
                        >
                          {copied === `example-${idx}` ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Example Response */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-white">Example Response</h4>
                      <div className="relative bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <pre className="text-sm text-blue-400 overflow-x-auto font-mono">
                          {endpoint.response}
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label="Copy example response"
                          className="absolute top-2 right-2 border-slate-600"
                          onClick={() => copyToClipboard(endpoint.response, `response-${idx}`)}
                        >
                          {copied === `response-${idx}` ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Error Handling */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>Error Handling</CardTitle>
            <CardDescription>Common error responses and their meanings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { code: 400, message: "Bad Request", description: "Invalid request parameters" },
                { code: 401, message: "Unauthorized", description: "Missing or invalid API key" },
                { code: 403, message: "Forbidden", description: "Insufficient permissions" },
                { code: 404, message: "Not Found", description: "Resource not found" },
                { code: 429, message: "Too Many Requests", description: "Rate limit exceeded" },
                { code: 500, message: "Internal Server Error", description: "Server error" },
              ].map((error) => (
                <div key={error.code} className="flex items-start gap-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                  <div className="font-mono font-bold text-red-400 min-w-fit">{error.code}</div>
                  <div>
                    <p className="font-semibold text-white">{error.message}</p>
                    <p className="text-sm text-slate-400">{error.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>Rate Limiting</CardTitle>
            <CardDescription>API rate limits by plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { plan: "Free", limit: "100 requests/hour" },
                { plan: "Professional", limit: "10,000 requests/hour" },
                { plan: "Elite", limit: "Unlimited" },
              ].map((tier) => (
                <div key={tier.plan} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                  <p className="font-semibold text-white">{tier.plan}</p>
                  <p className="text-sm text-slate-400">{tier.limit}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>Get support for API integration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-slate-300">
                For API support, documentation, and integration help:
              </p>
              <div className="flex gap-3">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Code className="w-4 h-4 mr-2" />
                  View Code Examples
                </Button>
                <Button variant="outline" className="border-slate-600">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default APIDocumentation;
