/**
 * googleAuthService.js
 * 
 * Cryptographically verifies Google and Firebase ID tokens for ConnectHearts.
 * Prevents account takeover attacks (S1) by guaranteeing that client-provided emails
 * and UIDs are signed and verified by Google / Firebase before session creation.
 */

const jwt = require("jsonwebtoken");

let cachedCerts = null;
let certsExpiry = 0;

/**
 * Fetch and cache Google public x509 certificates used to sign Firebase Auth ID tokens.
 */
async function getGooglePublicCerts() {
  const now = Date.now();
  if (cachedCerts && now < certsExpiry) {
    return cachedCerts;
  }

  const response = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
    { signal: AbortSignal.timeout(5000) }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Google public certificates: HTTP ${response.status}`);
  }

  cachedCerts = await response.json();
  // Cache for 1 hour or respect HTTP cache-control max-age
  certsExpiry = now + 60 * 60 * 1000;
  return cachedCerts;
}

/**
 * Verify a Google ID token or Firebase Auth ID token.
 * 
 * @param {string} idToken - The JWT ID token issued by Google or Firebase Auth.
 * @returns {Promise<{email: string, uid: string, name: string, photoURL: string, emailVerified: boolean}>}
 */
async function verifyGoogleOrFirebaseToken(idToken) {
  if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
    throw new Error("Google authentication token (idToken) is required.");
  }

  const trimmedToken = idToken.trim();
  const decodedComplete = jwt.decode(trimmedToken, { complete: true });

  if (!decodedComplete || !decodedComplete.header || !decodedComplete.payload) {
    throw new Error("Malformed Google authentication token.");
  }

  const { header, payload } = decodedComplete;
  const issuer = payload.iss || "";

  // 1. Firebase Auth ID Token (iss: https://securetoken.google.com/<projectId>)
  if (issuer.startsWith("https://securetoken.google.com/")) {
    const certs = await getGooglePublicCerts();
    const cert = certs[header.kid];
    if (!cert) {
      throw new Error(`Unrecognized key ID in Firebase token (${header.kid}).`);
    }

    const verified = jwt.verify(trimmedToken, cert, {
      algorithms: ["RS256"],
    });

    const email = verified.email ? verified.email.trim().toLowerCase() : null;
    if (!email) {
      throw new Error("Firebase token does not contain an email address.");
    }

    if (verified.email_verified !== true) {
      throw new Error("Firebase account email address is not verified.");
    }

    return {
      email,
      uid: verified.sub || verified.user_id,
      name: verified.name || verified.display_name || "",
      photoURL: verified.picture || "",
      emailVerified: true,
      authProvider: "google",
    };
  }

  // 2. Standard Google OAuth2 ID Token (iss: accounts.google.com or https://accounts.google.com)
  if (issuer === "accounts.google.com" || issuer === "https://accounts.google.com") {
    const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(trimmedToken)}`;
    const response = await fetch(tokenInfoUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`Google OAuth token verification failed (HTTP ${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const email = data.email ? data.email.trim().toLowerCase() : null;
    if (!email) {
      throw new Error("Google OAuth token does not contain an email address.");
    }

    const isVerified = data.email_verified === "true" || data.email_verified === true;
    if (!isVerified) {
      throw new Error("Google account email is not verified.");
    }

    return {
      email,
      uid: data.sub,
      name: data.name || "",
      photoURL: data.picture || "",
      emailVerified: true,
      authProvider: "google",
    };
  }

  throw new Error(`Unsupported token issuer: "${issuer}". Only Google and Firebase tokens are accepted.`);
}

module.exports = {
  verifyGoogleOrFirebaseToken,
};
