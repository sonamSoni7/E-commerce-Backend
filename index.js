const bodyParser = require("body-parser");
const express = require("express");
const dbConnect = require("./config/dbConnect");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const app = express();
const dotenv = require("dotenv").config();
const PORT = process.env.PORT || 5000;
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
});

// Make io accessible to routes
app.set("io", io);

// Import routes
const authRouter = require("./routes/authRoute");
const authEnhancedRouter = require("./routes/authEnhancedRoute");
const productRouter = require("./routes/productRoute");
const categoryRouter = require("./routes/prodcategoryRoute");
const colorRouter = require("./routes/colorRoute");
const enqRouter = require("./routes/enqRoute");
const couponRouter = require("./routes/couponRoute");
const uploadRouter = require("./routes/uploadRoute");
const locationRouter = require("./routes/locationRoute");
const searchRouter = require("./routes/searchRoute");
const recommendationRouter = require("./routes/recommendationRoute");
const deliverySlotRouter = require("./routes/deliverySlotRoute");
const reviewRouter = require("./routes/reviewRoute");
const notificationRouter = require("./routes/notificationRoute");
const chatRouter = require("./routes/chatRoute");
const faqRouter = require("./routes/faqRoute");
const orderTrackingRouter = require("./routes/orderTrackingRoute");

// Connect to database
dbConnect();

// Middlewares
app.use(morgan("dev"));
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.ADMIN_URL || "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server and curl requests
      if (allowedOrigins.includes(origin) || origin.startsWith("http://localhost")) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static("public"));

// API Routes
app.use("/api/user", authRouter);
app.use("/api/auth", authEnhancedRouter);
app.use("/api/product", productRouter);
app.use("/api/category", categoryRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/color", colorRouter);
app.use("/api/enquiry", enqRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/location", locationRouter);
app.use("/api/search", searchRouter);
app.use("/api/recommendations", recommendationRouter);
app.use("/api/delivery-slots", deliverySlotRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/chat", chatRouter);
app.use("/api/faq", faqRouter);
app.use("/api/order-tracking", orderTrackingRouter);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Join order tracking room
  socket.on("join_order_tracking", (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Client joined order tracking: ${orderId}`);
  });

  // Leave order tracking room
  socket.on("leave_order_tracking", (orderId) => {
    socket.leave(`order_${orderId}`);
    console.log(`Client left order tracking: ${orderId}`);
  });

  // Join chat conversation room
  socket.on("join_chat", (conversationId) => {
    socket.join(`chat_${conversationId}`);
    console.log(`Client joined chat: ${conversationId}`);
  });

  // Leave chat room
  socket.on("leave_chat", (conversationId) => {
    socket.leave(`chat_${conversationId}`);
    console.log(`Client left chat: ${conversationId}`);
  });

  // Handle delivery location updates
  socket.on("update_delivery_location", (data) => {
    io.to(`order_${data.orderId}`).emit("location_updated", {
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: Date.now(),
    });
  });

  // Handle chat messages
  socket.on("send_chat_message", (data) => {
    io.to(`chat_${data.conversationId}`).emit("new_message", data);
  });

  // Handle typing indicator
  socket.on("typing", (data) => {
    socket.to(`chat_${data.conversationId}`).emit("user_typing", {
      userId: data.userId,
      isTyping: data.isTyping,
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
  console.log(`Socket.io server is ready for real-time connections`);
});
