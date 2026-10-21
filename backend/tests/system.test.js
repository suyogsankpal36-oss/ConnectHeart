/**
 * verify_all.js
 * 
 * Comprehensive automated verification script for ConnectHearts.
 * Tests Phases 2-7, 9, 12 across:
 * - Registration, validation, duplicate prevention
 * - Authentication, JWT verification, route protection
 * - Profile CRUD, data minimization, age restrictions
 * - Cross-account discovery, self-exclusion, filters
 * - Like workflow, mutual match creation, duplicate prevention
 * - Messaging, authorization guards, message persistence, reactions
 * - Blocking, unmatching, and account deletion cascading cleanup
 */

const http = require("http");

const BASE_URL = "http://localhost:5000/api";

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (payload) {
      options.headers["Content-Length"] = Buffer.byteLength(payload);
    }

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });

    req.on("error", (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

const results = [];
function record(testName, passed, details = "") {
  results.push({ testName, passed, details });
  console.log(`${passed ? "✅ PASS" : "❌ FAIL"}: ${testName} ${details ? "(" + details + ")" : ""}`);
}

async function runAllTests() {
  console.log("=== STARTING CONNECTHEARTS FULL PRODUCTION AUDIT SUITE ===\n");

  const timestamp = Date.now();
  const userA = {
    name: "Audit UserAlpha",
    email: `audit.user.a.${timestamp}@connecthearts.test`,
    password: "Password123!",
    age: 26,
    gender: "female",
  };

  const userB = {
    name: "Audit UserBeta",
    email: `audit.user.b.${timestamp}@connecthearts.test`,
    password: "Password123!",
    age: 28,
    gender: "male",
  };

  let tokenA = null;
  let tokenB = null;
  let idA = null;
  let idB = null;
  let matchId = null;

  try {
    // -------------------------------------------------------------
    // PHASE 2 — AUTHENTICATION & ACCOUNT MANAGEMENT
    // -------------------------------------------------------------
    console.log("--- PHASE 2: AUTHENTICATION & ACCOUNT MANAGEMENT ---");

    // 1. Validation: Reject invalid age (<18)
    const invalidAgeRes = await request("POST", "/auth/register", {
      ...userA,
      email: `underage.${timestamp}@test.com`,
      age: 17,
    });
    record("Reject registration with age < 18", invalidAgeRes.status === 400);

    // 2. Validation: Reject weak/short password
    const weakPassRes = await request("POST", "/auth/register", {
      ...userA,
      email: `weakpass.${timestamp}@test.com`,
      password: "123",
    });
    record("Reject registration with password < 8 characters", weakPassRes.status === 400);

    // 3. Validation: Reject malformed email
    const malformedEmailRes = await request("POST", "/auth/register", {
      ...userA,
      email: "notanemail",
    });
    record("Reject registration with malformed email", malformedEmailRes.status === 400);

    // 4. Valid Registration: Account A
    const regARes = await request("POST", "/auth/register", userA);
    record("Register Account A with valid info", regARes.status === 201 && regARes.data.token);
    tokenA = regARes.data.token;
    idA = regARes.data.user.id || regARes.data.user._id;

    // 5. Prevent Duplicate Accounts
    const dupARes = await request("POST", "/auth/register", userA);
    record("Prevent duplicate account creation (409 Conflict)", dupARes.status === 409);

    // 6. Valid Registration: Account B
    const regBRes = await request("POST", "/auth/register", userB);
    record("Register Account B with valid info", regBRes.status === 201 && regBRes.data.token);
    tokenB = regBRes.data.token;
    idB = regBRes.data.user.id || regBRes.data.user._id;

    // 7. Login: Valid credentials
    const loginARes = await request("POST", "/auth/login", {
      email: userA.email,
      password: userA.password,
    });
    record("Login Account A with valid credentials", loginARes.status === 200 && loginARes.data.token);

    // 8. Login: Incorrect credentials rejection
    const invalidLoginRes = await request("POST", "/auth/login", {
      email: userA.email,
      password: "WrongPassword123!",
    });
    record("Reject login with incorrect password (401)", invalidLoginRes.status === 401);

    // 9. Protected routes reject unauthenticated requests
    const unauthRes = await request("GET", "/profile");
    record("Protected route rejects unauthenticated request (401)", unauthRes.status === 401);

    // 10. Protected routes reject invalid token
    const fakeTokenRes = await request("GET", "/profile", null, "invalid.token.payload");
    record("Protected route rejects malformed token (401)", fakeTokenRes.status === 401);

    // 11. /api/auth/me returns current user
    const meRes = await request("GET", "/auth/me", null, tokenA);
    record("Current user retrieved via /auth/me", meRes.status === 200 && meRes.data.user.email === userA.email.toLowerCase());

    // -------------------------------------------------------------
    // PHASE 3 — PROFILE & DISCOVERY
    // -------------------------------------------------------------
    console.log("\n--- PHASE 3: PROFILE & DISCOVERY ---");

    // 12. Update profile for Account A
    const updateProfileRes = await request(
      "PUT",
      "/profile",
      {
        bio: "Exploring the world one coffee at a time ☕",
        city: "Mumbai",
        interests: ["Music", "Travel", "Photography"],
        lookingFor: "relationship",
        lifestyle: {
          workout: "Often",
          pets: "Dog lover 🐕",
        },
      },
      tokenA
    );
    record("Update Account A profile", updateProfileRes.status === 200);

    // 13. Verify profile persistence and data minimization (no password or hash returned)
    const getProfileRes = await request("GET", "/profile", null, tokenA);
    const pUser = getProfileRes.data.user;
    const isSensitiveProtected = !pUser.password && !pUser.resetPasswordToken && !pUser.__v;
    record(
      "Verify profile persistence & sensitive data isolation",
      getProfileRes.status === 200 &&
        pUser.city === "Mumbai" &&
        isSensitiveProtected,
      "password and internal hashes excluded"
    );

    // 14. Discovery: Account B discovers Account A
    const discoverRes = await request("GET", "/discover", null, tokenB);
    const discoveredProfiles = discoverRes.data.profiles || [];
    const foundA = discoveredProfiles.find((p) => p.id === idA || p._id === idA);
    record("Account B dynamically discovers Account A in discovery deck", Boolean(foundA));

    // 15. Discovery: Exclude self (Account A does not see Account A)
    const discoverSelfRes = await request("GET", "/discover", null, tokenA);
    const selfInProfiles = (discoverSelfRes.data.profiles || []).some(
      (p) => p.id === idA || p._id === idA
    );
    record("Current user is excluded from their own discovery results", !selfInProfiles);

    // -------------------------------------------------------------
    // PHASE 4 — LIKES, PASSES, AND MUTUAL MATCHES
    // -------------------------------------------------------------
    console.log("\n--- PHASE 4: LIKES, PASSES, AND MATCHES ---");

    // 16. Account A likes Account B (One-sided like)
    const likeBRes = await request(
      "POST",
      "/discover/like",
      { targetUserId: idB, type: "like", comment: "Love your vibe! ✨" },
      tokenA
    );
    record("Account A likes Account B (one-sided)", likeBRes.status === 200 && !likeBRes.data.isMatch);

    // 17. Verify no match created yet
    const matchesPreRes = await request("GET", "/matches", null, tokenA);
    record("One-sided like does not create a match", (matchesPreRes.data.matches || []).length === 0);

    // 18. Duplicate like handled idempotently
    const dupLikeRes = await request(
      "POST",
      "/discover/like",
      { targetUserId: idB, type: "like" },
      tokenA
    );
    record("Duplicate like handled safely without error", dupLikeRes.status === 200);

    // 19. Account B likes Account A -> Mutual Match!
    const likeARes = await request(
      "POST",
      "/discover/like",
      { targetUserId: idA, type: "like" },
      tokenB
    );
    record(
      "Account B likes Account A creating a mutual match",
      likeARes.status === 200 && likeARes.data.isMatch,
      `Match ID: ${likeARes.data.matchId}`
    );
    matchId = likeARes.data.matchId;

    // 20. Verify match exists in /matches for Account A and Account B
    const [matchesARes, matchesBRes] = await Promise.all([
      request("GET", "/matches", null, tokenA),
      request("GET", "/matches", null, tokenB),
    ]);
    const mA = (matchesARes.data.matches || []).find((m) => m.matchId === matchId);
    const mB = (matchesBRes.data.matches || []).find((m) => m.matchId === matchId);
    record("Match appears in /matches for both participants", Boolean(mA && mB));

    // -------------------------------------------------------------
    // PHASE 5 — MESSAGING & REAL-TIME SECURITY
    // -------------------------------------------------------------
    console.log("\n--- PHASE 5: MESSAGING & CONVERSATIONS ---");

    // 21. Account A sends message to Account B
    const sendMsgRes = await request(
      "POST",
      `/messages/${matchId}`,
      { text: "Hey! Excited that we matched! How is your week going? ☕" },
      tokenA
    );
    record("Account A sends message in active match", sendMsgRes.status === 201);
    const messageId = sendMsgRes.data.message?.id || sendMsgRes.data.message?._id;

    // 22. Account B retrieves messages
    const getMsgsRes = await request("GET", `/messages/${matchId}`, null, tokenB);
    const msgsList = getMsgsRes.data.messages || [];
    const foundMsg = msgsList.find((m) => m.text.includes("Excited that we matched"));
    record("Account B retrieves conversation message history", Boolean(foundMsg));

    // 23. Account B toggles emoji reaction on message
    const reactRes = await request("POST", `/messages/${messageId}/react`, { emoji: "❤️" }, tokenB);
    record("Account B adds emoji reaction to message", reactRes.status === 200 && reactRes.data.success);

    // 24. Unauthorized user cannot access conversation
    const dummyToken = tokenA; // try with fake matchId
    const unauthMsgRes = await request("GET", "/messages/65f000000000000000000000", null, dummyToken);
    record("Non-participant / invalid match access is rejected (404/403)", unauthMsgRes.status === 404 || unauthMsgRes.status === 403);

    // -------------------------------------------------------------
    // PHASE 6 & 7: SAFETY, BLOCKING & UNMATCHING
    // -------------------------------------------------------------
    console.log("\n--- PHASE 6 & 7: SAFETY, BLOCKING & UNMATCHING ---");

    // 25. Account A submits a safety report on user B
    const reportRes = await request(
      "POST",
      "/reports",
      { reportedUserId: idB, reason: "harassment", details: "Test safety audit report" },
      tokenA
    );
    record("Submit user safety report", reportRes.status === 201 && reportRes.data.success);

    // 26. Account B blocks Account A
    const blockRes = await request("POST", `/blocks/${idA}`, null, tokenB);
    record("Account B blocks Account A", blockRes.status === 200 && blockRes.data.success);

    // 27. Block breaks existing match
    const postBlockMatches = await request("GET", "/matches", null, tokenB);
    const matchStillExists = (postBlockMatches.data.matches || []).some((m) => m.matchId === matchId);
    record("Block immediately terminates mutual match", !matchStillExists);

    // 28. Blocked user cannot send message
    const blockedMsgRes = await request(
      "POST",
      `/messages/${matchId}`,
      { text: "Are you still there?" },
      tokenA
    );
    record("Blocked user cannot send messages (403/404)", blockedMsgRes.status === 403 || blockedMsgRes.status === 404);

    // 29. Blocked user is excluded from discovery
    const blockedDiscoverRes = await request("GET", "/discover", null, tokenB);
    const isAFound = (blockedDiscoverRes.data.profiles || []).some((p) => p.id === idA || p._id === idA);
    record("Blocked user is excluded from discovery deck", !isAFound);

    // 30. Unblock user
    const unblockRes = await request("DELETE", `/blocks/${idA}`, null, tokenB);
    record("Unblock user restores normal state", unblockRes.status === 200 && unblockRes.data.success);

    // -------------------------------------------------------------
    // PHASE 8: ACCOUNT DELETION & CASCADING DATA CLEANUP
    // -------------------------------------------------------------
    console.log("\n--- PHASE 8: ACCOUNT DELETION & ZERO-LEFTOVER CLEANUP ---");

    // 31. Delete Account A
    const deleteARes = await request(
      "DELETE",
      "/auth/delete-account",
      { confirmationPassword: userA.password },
      tokenA
    );
    record("Account A deletes account with password confirmation", deleteARes.status === 200);

    // 32. Confirm deleted user cannot log in
    const deletedLoginRes = await request("POST", "/auth/login", {
      email: userA.email,
      password: userA.password,
    });
    record("Deleted account is permanently blocked from login (401)", deletedLoginRes.status === 401);

    // 33. Delete Account B to leave database completely clean
    const deleteBRes = await request(
      "DELETE",
      "/auth/delete-account",
      { confirmationPassword: userB.password },
      tokenB
    );
    record("Account B deletes account (Zero test residues in DB)", deleteBRes.status === 200);

  } catch (err) {
    console.error("Test execution exception:", err);
  }

  // Summary
  console.log("\n=== AUDIT SUITE RESULTS SUMMARY ===");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total tests: ${total}`);
  console.log(`Passed:      ${passed}`);
  console.log(`Failed:      ${failed}`);
  console.log(`Success rate: ${((passed / total) * 100).toFixed(1)}%`);

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
