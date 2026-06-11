import serverless from "serverless-http";
import app from "../../server/app.js";

export const handler = serverless(app);

import express from "express";

const app = express();

export const handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "API working" }),
  };
};