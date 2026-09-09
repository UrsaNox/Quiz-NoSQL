const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const express = require("express");
const Quiz = require("./models/Quiz");
const { createClient } = require("redis");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const redisClient = createClient({
  url: "redis://localhost:6379"
});
app.use(express.json());

mongoose
  .connect("mongodb://localhost:27017/quiz")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

redisClient
  .connect()
  .then(() => console.log("Redis Connected"))
  .catch(err => console.log(err));
  
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join-room", (roomCode) => {
    socket.join(roomCode);

    console.log(`User joined room: ${roomCode}`);
  });

  socket.on("test-message", (message) => {
    console.log("Received:", message);

    io.emit("test-message", message);
  });
});

app.post("/quizzes", async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/quizzes", async (req, res) => {
  const quizzes = await Quiz.find();
  res.json(quizzes);
});
/*test secion delete later*/
app.get("/leaderboard/test", async (req, res) => {
  await redisClient.zAdd("quiz:leaderboard", [
    { score: 10, value: "Mahir" },
    { score: 20, value: "Alex" },
    { score: 15, value: "John" }
  ]);

  const leaderboard = await redisClient.zRangeWithScores(
    "quiz:leaderboard",
    0,
    -1,
    { REV: true }
  );

  res.json(leaderboard);
});

app.get("/score/test", (req, res) => {
  const basePoints = 500;
  const remainingTime = 8;
  const totalTime = 10;

  const speedBonus = Math.round(
    500 * remainingTime / totalTime
  );

  const score = basePoints + speedBonus;

  res.json({
    basePoints,
    remainingTime,
    totalTime,
    speedBonus,
    score
  });
});

app.get("/score/redis-test", async (req, res) => {
  const roomCode = "ABC123";
  const studentId = "Mahir";

  await redisClient.zIncrBy(
    `room:${roomCode}:leaderboard`,
    900,
    studentId
  );

  const leaderboard = await redisClient.zRangeWithScores(
    `room:${roomCode}:leaderboard`,
    0,
    9,
    { REV: true }
  );

  res.json(leaderboard);
});

app.get("/leaderboard/live-test", async (req, res) => {
  const roomCode = "ABC123";

  const leaderboard = await redisClient.zRangeWithScores(
    `room:${roomCode}:leaderboard`,
    0,
    9,
    { REV: true }
  );

  io.to(roomCode).emit("leaderboardUpdated", leaderboard);

  res.json({
    message: "Leaderboard sent",
    leaderboard
  });
});
/*till here*/

app.post("/rooms", async (req, res) => {
  const roomCode = req.body.roomCode;

  await redisClient.set(`room:${roomCode}`, "active");

  res.json({
    message: "Room created",
    roomCode: roomCode
  });
});

app.post("/rooms/:roomCode/join", async (req, res) => {
  const roomCode = req.params.roomCode;
  const studentName = req.body.studentName;

  await redisClient.sAdd(`room:${roomCode}:students`, studentName);

  res.json({
    message: "Student joined",
    roomCode: roomCode,
    studentName: studentName
  });
});
app.get("/", (req, res) => {
  res.send("Quiz Server is Working");
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});