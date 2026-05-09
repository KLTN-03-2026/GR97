import { createServer } from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { runSeeders } from "./services/seed.service.js";
import { initializeSocket } from "./services/socket.service.js";

const PORT = process.env.PORT || 5001;

const start = async () => {
  try {
    if (process.env.IN_MEMORY_AUTH !== "1") {
      await connectDB();
      await runSeeders();
    } else {
      console.log("IN_MEMORY_AUTH=1, skip MongoDB connection");
    }
    
    // Create HTTP server
    const httpServer = createServer(app);
    
    // Initialize WebSocket
    initializeSocket(httpServer);
    
    httpServer.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
