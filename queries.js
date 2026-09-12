import mongoose from 'mongoose';
import dotenv from 'dotenv';

import User from "./models/User.js"
import Subreddit from './models/Subreddit.js';
import Thread from './models/Thread.js';


async function query1() {
    // Write code for Query 1 here
}

async function query2() {
    // Write code for Query 2 here
}

async function query3() {
    // Write code for Query 3 here
}

async function query4() {
    // Write code for Query 4 here
}

// more queries

async function runQueries() {
    // Uncomment the query you want to run
    // await query1();
    // await query2();
    // await query3();
    // await query4();
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