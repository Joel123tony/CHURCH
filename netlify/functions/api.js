import serverless from "serverless-http";
import app from "../../server/app.js";

export default serverless(app);

export const config = {
  path: [
    "/api/pastors",
    "/api/pastors/search",
    "/api/pastors/current/:id",
    "/api/pastors/:id",
    "/api/auth/login",
    "/api/auth/register",
    "/api/upload/image",
    "/api/youtube/live",
  ],
};
