import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
)

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from './routes/user.routes.js';
import supervisorRouter from './routes/supervisor.routes.js';

app.use("/api/o1/user", userRouter);
app.use("/api/o1/supervisor", supervisorRouter);

export { app }