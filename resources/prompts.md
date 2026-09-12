#### A. Recreate Mongoose Models (Agent Mode)

```
Create Mongoose models based on the following schema definitions. Each model should be in its own file inside the /models folder. Use the specified data types, constraints, and references.

**User**

| Field     | Type   | Constraints      |
| --------- | ------ | ---------------- |
| name      | String | required         |
| email     | String | required, unique |
| password  | String | required         |
| createdAt | Date   | required         |

**Subreddit**

| Field       | Type     | Constraints          |
| ----------- | -------- | -------------------- |
| name        | String   | required, unique     |
| description | String   | —                    |
| author      | ObjectId | required, ref → User |
| createdAt   | Date     | required             |

**Thread**

| Field     | Type     | Constraints               |
| --------- | -------- | ------------------------- |
| title     | String   | required                  |
| content   | String   | required                  |
| author    | ObjectId | required, ref → User      |
| subreddit | ObjectId | required, ref → Subreddit |
| upvotes   | Number   | default 0                 |
| downvotes | Number   | default 0                 |
| voteCount | Number   | default 0                 |
| createdAt | Date     | required                  |
```

---

#### B. Generate a Seed Script (Agent Mode)

```
Create a production-ready database seed script for the application.

CONTEXT:
- All Mongoose models already exist inside /models folder.
- The MongoDB connection string is stored in a .env file as the MONGODB_URI variable.

Your task is as follows:
1. Create the following test data including:
   - 10 users
   - 6 subreddits
   - 20 threads, distributed across subreddits
   - Randomly assign authors to threads
   - CreatedAt timestamps spread across last 60 days
   - Random upvotes/downvotes
2. Maintain referential integrity — use ObjectIds correctly
3. Ensure all ObjectIds are unique
4. Create the sample data in separate json files for each model and save them in the /data folder
5. Create a single script file to seed the database at /scripts/seed.js
6. The script must clear existing data at the start, insert data in proper order, and log meaningful progress
```

---

#### C. Generate a Test Script

```
I want to create a script to test the CRUD operations of my MongoDB database. I have already implemented the Mongoose models and seeded the DB.

Help me create a set of 20 tests to test the CRUD operations of the database. Do not use a testing framework — the tests should be implemented in a standalone script in a single file located at /scripts/ that can be run with Node.js.
```


#### F. Brainstorm Features (Plan Mode)

```
I want to build a Reddit-like platform where users can share and discuss content. Help me brainstorm a comprehensive list of features for this application.

Organize the features by priority using the MoSCoW framework.

For each feature, include:
- User capability - What users can do with this feature
- Implementation complexity - Relative difficulty (Simple / Moderate / Complex)
- Priority justification - Why it belongs in this tier

Think of interesting and creative features that would differentiate the application and drive usage.
```

```
Save the Must have and the Should have features from the above list in a markdown file named features.md in the root of the project.
```

#### G. Design a MongoDB Schema (Plan Mode)

```
As a senior backend architect and MongoDB expert help me design an optimal MongoDB schema. I am building a Reddit-like application in the MERN stack. I have attached a file #file:features.md that contains a detailed list of application features.

Your task is to:

1. Carefully analyze the features.
2. Identify:
   - The core entities
   - Relationships between entities
   - Expected query patterns (read-heavy vs write-heavy)
3. Design an optimal MongoDB schema. For each collection include:
   - Fields
   - Data types
   - Relationships
   - Index recommendations (if any)

Outline two possible schema designs. Give the pros and cons of each and recommend the best one based on the application features.
```