import dotenv from "dotenv";
import app from "./app.js";
import { env } from './config/env.js';



const server = app.listen(env.port, () => {
    console.log(`NexERP server running on port ${env.port}`);
});

server.on("error", (error) => {
    console.error("SERVER ERROR:", error);
});