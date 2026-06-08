import serverless from "serverless-http";
import app from "../../server/app.js";

export default serverless(app);

export const config = {
  path: [
    "/api/pastors",
    "/api/pastors/*",
    "/api/auth/*",
    "/api/upload/*",
    "/api/youtube/*",
  ],
};