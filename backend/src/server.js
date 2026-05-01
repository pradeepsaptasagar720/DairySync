import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env, validateEnv } from "./config/env.js";
import { startNotificationScheduler } from "./services/scheduler.service.js";

/**
 * Bootstrap server
 */
async function startServer() {
  try {
    /* Validate required env variables */
    validateEnv();

    /* Connect MongoDB */
    await connectDB();

    /* Start notification scheduler */
    startNotificationScheduler();

    /* Start server */
    app.listen(env.PORT, () => {
      console.log(
        `🚀 Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`
      );
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
