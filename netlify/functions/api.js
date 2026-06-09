import serverless from "serverless-http";
import app from "../../server/app.js";

// wrap express app for Netlify
export const handler = serverless(app);