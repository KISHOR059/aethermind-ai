import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { Express, RequestHandler } from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { registerEventListeners } from "./shared/events/listeners/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { requestIdMiddleware } from "./middlewares/request-id.middleware.js";
import { requestLogger } from "./lib/logger.js";
import apiRouter from "./routes/index.js";

const app: Express = express();

registerEventListeners();

const helmetMiddleware = (
  typeof helmet === "function"
    ? helmet
    : (helmet as unknown as { default: () => RequestHandler }).default
) as () => RequestHandler;

app.use(requestIdMiddleware);
app.use(helmetMiddleware());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === env.WEB_ORIGIN) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.use(apiRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
