const mongoose = require("mongoose");
const express = require("express");
const Quiz = require("./models/Quiz");

const app = express();

mongoose
  .connect("mongodb://localhost:27017/quiz")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.use(express.json());

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

app.get("/", (req, res) => {
  res.send("LiveQuiz Server is Working");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});