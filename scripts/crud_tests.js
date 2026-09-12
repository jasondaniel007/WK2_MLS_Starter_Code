import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "../models/User.js";
import Subreddit from "../models/Subreddit.js";
import Thread from "../models/Thread.js";

dotenv.config();

const runId = `crud-test-${Date.now()}`;
const testEmail = `${runId}@example.com`;
let testUser;
let testSubreddit;
let testThread;
let passed = 0;
let connected = false;

async function test(number, description, callback) {
  await callback();
  passed += 1;
  console.log(`PASS ${number}. ${description}`);
}

async function removeTestRecords() {
  await Thread.deleteMany({ title: { $regex: `^${runId}` } });
  await Subreddit.deleteMany({ name: { $regex: `^${runId}` } });
  await User.deleteMany({ email: testEmail });
}

async function runTests() {
  await removeTestRecords();

  await test(1, "creates a user", async () => {
    testUser = await User.create({
      name: `${runId} User`,
      email: testEmail,
      password: "crud-test-password",
      createdAt: new Date(),
    });

    assert.ok(testUser._id);
    assert.equal(testUser.email, testEmail);
  });

  await test(2, "reads the created user by email", async () => {
    const user = await User.findOne({ email: testEmail });

    assert.ok(user);
    assert.equal(user._id.toString(), testUser._id.toString());
  });

  await test(3, "creates a subreddit linked to the user", async () => {
    testSubreddit = await Subreddit.create({
      name: runId,
      description: "Temporary subreddit for CRUD tests",
      author: testUser._id,
      createdAt: new Date(),
    });

    assert.ok(testSubreddit._id);
    assert.equal(testSubreddit.author.toString(), testUser._id.toString());
  });

  await test(4, "reads the created subreddit by name", async () => {
    const subreddit = await Subreddit.findOne({ name: runId });

    assert.ok(subreddit);
    assert.equal(subreddit._id.toString(), testSubreddit._id.toString());
  });

  await test(5, "creates a thread linked to the user and subreddit", async () => {
    testThread = await Thread.create({
      title: `${runId} Thread`,
      content: "Initial CRUD test content",
      author: testUser._id,
      subreddit: testSubreddit._id,
      createdAt: new Date(),
    });

    assert.ok(testThread._id);
    assert.equal(testThread.upvotes, 0);
    assert.equal(testThread.downvotes, 0);
    assert.equal(testThread.voteCount, 0);
  });

  await test(6, "reads the created thread by title", async () => {
    const thread = await Thread.findOne({ title: `${runId} Thread` });

    assert.ok(thread);
    assert.equal(thread._id.toString(), testThread._id.toString());
  });

  await test(7, "reads all temporary records with find", async () => {
    const users = await User.find({ email: testEmail });
    const subreddits = await Subreddit.find({ name: runId });
    const threads = await Thread.find({ title: `${runId} Thread` });

    assert.equal(users.length, 1);
    assert.equal(subreddits.length, 1);
    assert.equal(threads.length, 1);
  });

  await test(8, "populates thread author and subreddit references", async () => {
    const thread = await Thread.findById(testThread._id)
      .populate("author")
      .populate("subreddit");

    assert.equal(thread.author.email, testEmail);
    assert.equal(thread.subreddit.name, runId);
  });

  await test(9, "updates the user name", async () => {
    const result = await User.updateOne(
      { _id: testUser._id },
      { $set: { name: `${runId} Updated User` } },
    );

    assert.equal(result.matchedCount, 1);
    assert.equal(result.modifiedCount, 1);
  });

  await test(10, "persists the updated user name", async () => {
    const user = await User.findById(testUser._id);

    assert.equal(user.name, `${runId} Updated User`);
  });

  await test(11, "updates the subreddit description", async () => {
    const subreddit = await Subreddit.findByIdAndUpdate(
      testSubreddit._id,
      { description: "Updated CRUD test description" },
      { new: true, runValidators: true },
    );

    assert.equal(subreddit.description, "Updated CRUD test description");
  });

  await test(12, "updates thread content", async () => {
    const result = await Thread.updateOne(
      { _id: testThread._id },
      { $set: { content: "Updated CRUD test content" } },
    );

    assert.equal(result.matchedCount, 1);
    assert.equal(result.modifiedCount, 1);
  });

  await test(13, "increments thread votes", async () => {
    const thread = await Thread.findByIdAndUpdate(
      testThread._id,
      { $inc: { upvotes: 3, downvotes: 1, voteCount: 2 } },
      { new: true, runValidators: true },
    );

    assert.equal(thread.upvotes, 3);
    assert.equal(thread.downvotes, 1);
    assert.equal(thread.voteCount, 2);
  });

  await test(14, "confirms updated thread values can be read", async () => {
    const thread = await Thread.findById(testThread._id);

    assert.equal(thread.content, "Updated CRUD test content");
    assert.equal(thread.voteCount, thread.upvotes - thread.downvotes);
  });

  await test(15, "deletes the temporary thread", async () => {
    const deletedThread = await Thread.findByIdAndDelete(testThread._id);

    assert.ok(deletedThread);
    assert.equal(deletedThread._id.toString(), testThread._id.toString());
  });

  await test(16, "confirms the thread was deleted", async () => {
    const thread = await Thread.findById(testThread._id);

    assert.equal(thread, null);
  });

  await test(17, "deletes the temporary subreddit", async () => {
    const deletedSubreddit = await Subreddit.findByIdAndDelete(
      testSubreddit._id,
    );

    assert.ok(deletedSubreddit);
    assert.equal(
      deletedSubreddit._id.toString(),
      testSubreddit._id.toString(),
    );
  });

  await test(18, "confirms the subreddit was deleted", async () => {
    const subreddit = await Subreddit.findById(testSubreddit._id);

    assert.equal(subreddit, null);
  });

  await test(19, "deletes the temporary user", async () => {
    const deletedUser = await User.findByIdAndDelete(testUser._id);

    assert.ok(deletedUser);
    assert.equal(deletedUser._id.toString(), testUser._id.toString());
  });

  await test(20, "confirms the user was deleted", async () => {
    const user = await User.findById(testUser._id);

    assert.equal(user, null);
  });
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from the project .env file");
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    connected = true;
    console.log("Connected to MongoDB");
    await runTests();
    console.log(`\n${passed}/20 CRUD tests passed`);
  } finally {
    if (connected) {
      await removeTestRecords();
      await mongoose.disconnect();
      console.log("MongoDB connection closed");
    }
  }
}

main().catch((error) => {
  console.error(`\nCRUD tests failed after ${passed}/20 tests`);
  console.error(error);
  process.exitCode = 1;
});