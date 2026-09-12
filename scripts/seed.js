import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

import User from "../models/User.js";
import Subreddit from "../models/Subreddit.js";
import Thread from "../models/Thread.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const dataDirectory = path.join(projectRoot, "data");

dotenv.config({ path: path.join(projectRoot, ".env") });

const collections = [
  { name: "users", model: User, file: "users.json" },
  { name: "subreddits", model: Subreddit, file: "subreddits.json" },
  { name: "threads", model: Thread, file: "threads.json" },
];

async function readFixture({ name, file }) {
  const filePath = path.join(dataDirectory, file);
  const records = JSON.parse(await fs.readFile(filePath, "utf8"));

  if (!Array.isArray(records)) {
    throw new Error(`Fixture ${file} must contain a JSON array`);
  }

  console.log(`Loaded ${records.length} ${name} from ${file}`);
  return records;
}

function validateFixtures(users, subreddits, threads) {
  const expectedCounts = [
    ["users", users, 10],
    ["subreddits", subreddits, 6],
    ["threads", threads, 20],
  ];

  for (const [name, records, expectedCount] of expectedCounts) {
    if (records.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} ${name}, found ${records.length}`);
    }
  }

  const allIds = [...users, ...subreddits, ...threads].map((record) => record._id);
  const uniqueIds = new Set(allIds);

  if (allIds.some((id) => !mongoose.isValidObjectId(id))) {
    throw new Error("Every fixture _id must be a valid MongoDB ObjectId");
  }

  if (uniqueIds.size !== allIds.length) {
    throw new Error("Fixture _id values must be unique across all models");
  }

  const userIds = new Set(users.map((user) => user._id));
  const subredditIds = new Set(subreddits.map((subreddit) => subreddit._id));

  for (const subreddit of subreddits) {
    if (!userIds.has(subreddit.author)) {
      throw new Error(`Subreddit ${subreddit.name} references a missing user`);
    }
  }

  for (const thread of threads) {
    if (!userIds.has(thread.author)) {
      throw new Error(`Thread ${thread.title} references a missing user`);
    }
    if (!subredditIds.has(thread.subreddit)) {
      throw new Error(`Thread ${thread.title} references a missing subreddit`);
    }
    if (thread.voteCount !== thread.upvotes - thread.downvotes) {
      throw new Error(`Thread ${thread.title} has an inconsistent voteCount`);
    }
  }
}

async function clearDatabase() {
  console.log("Clearing existing threads...");
  await Thread.deleteMany({});
  console.log("Clearing existing subreddits...");
  await Subreddit.deleteMany({});
  console.log("Clearing existing users...");
  await User.deleteMany({});
  console.log("Existing data cleared");
}

async function seedDatabase() {
  const fixtures = await Promise.all(collections.map(readFixture));
  const [users, subreddits, threads] = fixtures;

  validateFixtures(users, subreddits, threads);
  console.log("Fixture validation passed");

  await clearDatabase();

  console.log("Inserting users...");
  await User.insertMany(users, { ordered: true });
  console.log(`Inserted ${users.length} users`);

  console.log("Inserting subreddits...");
  await Subreddit.insertMany(subreddits, { ordered: true });
  console.log(`Inserted ${subreddits.length} subreddits`);

  console.log("Inserting threads...");
  await Thread.insertMany(threads, { ordered: true });
  console.log(`Inserted ${threads.length} threads`);
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from the project .env file");
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    await seedDatabase();
    console.log("Database seed completed successfully");
  } finally {
    if (mongoose.connection.readyState !== mongoose.ConnectionStates.disconnected) {
      await mongoose.disconnect();
      console.log("MongoDB connection closed");
    }
  }
}

main().catch((error) => {
  console.error("Database seed failed:", error.message);
  process.exitCode = 1;
});