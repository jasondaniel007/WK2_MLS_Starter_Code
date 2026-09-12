import mongoose from 'mongoose';
import dotenv from 'dotenv';

import User from "./models/User.js"
import Subreddit from './models/Subreddit.js';
import Thread from './models/Thread.js';


async function query1() {
    // Write code for Query 1 here
    const userbyemail = await User.find({}, { email: "diana@example.com" });
    console.log("userbyemail", userbyemail);
}

async function query2() {
    // Write code for Query 2 here
    const subredditprogramming = await Subreddit.find({ name: "programming" });
    console.log("subredditprogramming", subredditprogramming);

    const getThreadsbysubredditprogramming = await Thread.find({ subreddit: subredditprogramming[0]._id });
    console.log("getThreadsbysubredditprogramming", getThreadsbysubredditprogramming   );
}


async function query3() {
    // Write code for Query 3 here
    const usersWhoPostedThreads = await User.find({ _id: { $in: (await Thread.find({}, { author: 1 })).map(thread => thread.author) } });
    console.log("usersWhoPostedThreads", usersWhoPostedThreads);  
}

async function query4() {
    // Write code for Query 4 here
    const threadsAfterJan2024 = await Thread.find({ createdAt: { $gte: new Date("2024-01-01") } });
    console.log("threadsAfterJan2024", threadsAfterJan2024);
}

// more queries

async function query5() {
    // Write code for Query 5 here
    const newThread = await Thread.create({
        title: "New DevOps Thread",
        content: "Discussion about DevOps practices.",
        subreddit: (await Subreddit.findOne({ name: "devops" }))._id,
        author: (await User.findOne({ name: "Ethan" }))._id,
        createdAt: new Date()
    });
    console.log("newThread", newThread);
}


async function query6() {
    // Write code for Query 6 here
    await Thread.updateOne({ title: "New DevOps Thread" }, { $set: { title: "Docker and kubernetes" } });
    console.log("Thread title updated successfully");
}


async function query7() {
    // Write code for Query 7 here
    const subreddits = await Subreddit.find({});
    const subredditIds = subreddits.map(subreddit => subreddit._id);
    await Thread.deleteMany({ subreddit: { $in: subredditIds } });
    await Subreddit.deleteMany({});
    console.log("All subreddits and their associated threads have been deleted"); 
}


async function query8() {
    // Write code for Query 8 here
    const mostActiveUser = await Thread.aggregate([
        { $group: { _id: "$author", threadCount: { $sum: 1 } } },
        { $sort: { threadCount: -1 } },
        { $limit: 1 }
    ]);
    console.log("mostActiveUser", mostActiveUser);  
}

async function runQueries() {
    // Uncomment the query you want to run
    await query1();
    await query2();
    await query3();
    await query4();
    await query5();
    await query6(); 
    await query7();
    await query8();
    // more
}

async function main() {
  try {
    dotenv.config();
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");
    await runQueries();
  } catch (err) {
    console.error("DB connection failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from DB");
  }
}

main();