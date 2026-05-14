# ProTrack Manager Security Specification

## Data Invariants
- A task cannot exist without a valid project ID.
- A user can only see projects they are members of (unless they are a global Admin).
- Only project members can create/edit tasks in that project.
- A task's `assigneeId` must be a valid project member.
- Global Admins have full read/write access to all collections.
- `createdAt` is immutable.
- `ownerId` of a project is immutable.

## The "Dirty Dozen" Payloads (Deny Test Cases)
1. **Unauthenticated Write**: Attempting to create a user profile without auth.
2. **Identity Spoofing**: User A trying to create a User profile for User B (userId mismatch).
3. **Privilege Escalation**: User trying to set their own global `role` to 'admin' during signup.
4. **Orphaned Task**: Creating a task in a project that doesn't exist.
5. **Unauthorized Task Creation**: User C trying to create a task in Project X where they aren't a member.
6. **Assigning Non-Member**: Setting `assigneeId` on a task to a user who is not in the project's `members` subcollection.
7. **Shadow Update**: Adding a `verified: true` field to a Task update.
8. **Bypassing Status Logic**: Changing a 'completed' task's status back to 'todo' (if terminal logic applied).
9. **Malicious ID**: Creating a project with a document ID of 2KB of junk characters.
10. **Immutable Field Attack**: Trying to change `ownerId` on a Project.
11. **PII Leak**: Non-admin user trying to list all emails in the `/users` collection.
12. **System Field Injection**: Trying to write to a `systemMetrics` field directly.

## Rules Draft Strategy
- Use `isValidId` and `isValid[Entity]` for all writes.
- Master Gate: `hasMemberAccess(projectId)` helper.
- Global `isAdmin()` check.
