import mongoose from "mongoose";

const subredditSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  createdAt: {
    type: Date,
    required: true,
  },
});

const Subreddit = mongoose.model("Subreddit", subredditSchema);

export default Subreddit;
