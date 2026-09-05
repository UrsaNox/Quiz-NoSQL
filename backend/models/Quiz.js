const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  title: String,
  questions: [
    {
      question: String,
      options: [String],
      answer: String
    }
  ]
});

module.exports = mongoose.model("Quiz", quizSchema);