# Reddit-Like Platform Features

This roadmap uses the MoSCoW prioritization framework. The current project has `User`, `Subreddit`, and `Thread` models, so the Must Have features establish a complete discussion platform while the Should Have features improve retention, usability, and community quality.

## Must Have

| Feature | User capability | Implementation complexity | Priority justification |
|---|---|---|---|
| Account registration and login | Create an account, sign in, sign out, and maintain a session. | Moderate | Identity is required for authorship, voting, permissions, and personalization. Passwords must be securely hashed. |
| User profiles | View usernames, join dates, authored content, karma, and profile settings. | Moderate | Gives contributions a persistent identity and helps users assess who they interact with. |
| Community creation and management | Create communities, edit descriptions/settings, and assign owners or moderators. | Moderate | Extends the existing `Subreddit` model into a usable community system. |
| Post creation and editing | Publish text/link posts, edit or delete them, and mark posts as spoilers or NSFW. | Moderate | Posts are the platform's primary content loop. |
| Threaded comments and replies | Comment on posts, reply at arbitrary depth, edit/delete comments, and collapse branches. | Complex | Discussion is the defining Reddit-like behavior. This requires a referenced `Comment` model with parent-child relationships. |
| Per-user voting | Upvote, downvote, remove votes, and switch vote direction without duplicate votes. | Complex | Existing aggregate counters cannot enforce one vote per user. A `Vote` model with unique constraints is needed. |
| Home and community feeds | Browse newest, top, and trending posts with pagination. | Complex | Feed discovery is essential for continued use and requires ranking, indexes, and efficient pagination. |
| Search and filtering | Search titles/content and filter by community, author, date, flair, or sort order. | Moderate | Users need to find useful discussions once the platform grows beyond a small dataset. |
| Authorization | Restrict edits/deletes to authors and community settings to owners/moderators. | Complex | Prevents impersonation and destructive actions across the application. |
| Moderation tools | Remove content, lock threads, ban or mute users, and soft-delete content. | Complex | Public communities need safety controls and recoverable moderation actions. |
| Reporting system | Report posts, comments, or users and allow moderators to resolve reports. | Moderate | Converts safety concerns into a manageable moderation workflow. |
| Validation and abuse protection | Enforce content limits, sanitize input, rate-limit actions, and protect authentication endpoints. | Complex | Protects against spam, injection, abuse, and accidental misuse. |

## Should Have

| Feature | User capability | Implementation complexity | Priority justification |
|---|---|---|---|
| Community subscriptions | Follow communities and manage a personalized list. | Simple | Makes the home feed relevant with a relatively small data-model addition. |
| Saved posts and comments | Bookmark content in a private saved list. | Simple | Encourages users to return and is straightforward to implement. |
| Notifications | Receive alerts for replies, mentions, moderation actions, and post activity. | Complex | Improves retention but requires event handling, read state, and notification preferences. |
| Mentions | Mention other users in posts and comments with profile links. | Moderate | Encourages direct conversation and provides useful notification triggers. |
| Community flairs | Apply community-defined labels to posts and filter by them. | Moderate | Makes feeds easier to scan and helps communities organize content. |
| Post and comment ranking | Sort by hot, new, top, controversial, or oldest. | Moderate | Makes voting meaningful by affecting content visibility and discovery. |
| Edit history | View earlier versions of posts and comments. | Moderate | Improves transparency, trust, and moderation review. |
| Karma and contribution history | View post/comment scores and community-specific reputation. | Moderate | Adds recognition and status without making reputation mandatory for participation. |
| Notification preferences | Choose which events generate notifications and through which channel. | Moderate | Prevents notification fatigue and makes alerts usable. |
| Responsive accessible client | Use the platform on desktop and mobile with keyboard navigation and accessible controls. | Complex | Core functionality must work across devices and abilities. |
| Admin analytics | View active communities, retention, reports, response times, and activity trends. | Moderate | Helps operators identify unhealthy growth and prioritize improvements. |
