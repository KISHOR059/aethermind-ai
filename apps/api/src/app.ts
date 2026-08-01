import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { Express } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import apiRouter from "./routes/index.js";

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(apiRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
