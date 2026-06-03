import { createServer } from "http";
import { connectDatabase, setMockDatabaseStatus } from "./config/db";
import { app } from "./app";
import { createMockApp } from "./mock/mockApp";
import { env, useMockDatabase } from "./config/env";

async function main() {
  const serverApp = useMockDatabase ? createMockApp() : app;

  if (!useMockDatabase) {
    try {
      await connectDatabase();
    } catch (error) {
      console.warn("MongoDB connection failed, falling back to mock mode.");
      console.warn(error);
      setMockDatabaseStatus();
      const fallbackServer = createServer(createMockApp());
      fallbackServer.listen(env.PORT, () => {
        console.log(`API listening on port ${env.PORT} in mock mode`);
      });
      return;
    }
  } else {
    setMockDatabaseStatus();
  }

  const server = createServer(serverApp);
  server.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}${useMockDatabase ? " in mock mode" : ""}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
