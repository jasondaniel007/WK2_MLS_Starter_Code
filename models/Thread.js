import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  subreddit: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Subreddit",
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  downvotes: {
    type: Number,
    default: 0,
  },
  voteCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    required: true,
  },
});

const Thread = mongoose.model("Thread", threadSchema);

export default Thread;
