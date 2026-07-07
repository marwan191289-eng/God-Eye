import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { httpProxyMiddleware } from "http-proxy-middleware";

const app = express();

// Middleware
app.use(
  pinoHttp({
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  })
);

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

const ALLOWED_ORIGINS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /\.lovable\.app$/,
  /\.lovable\.dev$/,
  /\.replit\.dev$/,
  /\.repl\.co$/,
  /\.replit\.app$/,
];

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.some((r) => r.test(origin))) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(clerkMiddleware());

// Routes
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

export default app;
