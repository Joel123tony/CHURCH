import serverless from "serverless-http";
import app from "../../server/app.js"; // OR correct path

export const handler = serverless(app);

export const config = {
  path: [
    "/api/pastors",
    "/api/pastors/*",
    "/api/auth/*",
    "/api/upload/*",
    "/api/youtube/*",
  ],
};