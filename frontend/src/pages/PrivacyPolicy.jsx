import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function PrivacyPolicy() {
  return (
    <div className="landing-page dark-luxury-root">
      <Navbar />

      <main className="policy-container" style={{ maxWidth: "860px", margin: "40px auto 80px", padding: "0 24px" }}>
        <div className="policy-header" style={{ marginBottom: "32px", textAlign: "center" }}>
          <span className="eyebrow" style={{ color: "var(--color-primary, #FF477E)", fontSize: "12px", letterSpacing: "2px", fontWeight: "700" }}>LEGAL &amp; PRIVACY</span>
          <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: "36px", marginTop: "8px", color: "var(--color-text-main, #F5F5F5)" }}>Privacy Policy</h1>
          <p style={{ color: "var(--color-text-muted, #9E9E9E)", fontSize: "14px", marginTop: "4px" }}>Effective Date: October 2026 • Version 1.0 (Beta Release)</p>
        </div>

        <article className="policy-content" style={{ color: "var(--color-text-main, #E0E0E0)", lineHeight: "1.75", fontSize: "15px" }}>
          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "var(--color-primary, #FF477E)", fontSize: "20px", marginBottom: "12px" }}>1. Introduction &amp; Commitment</h2>
            <p>
              Welcome to <strong>ConnectHearts</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). We are committed to protecting your privacy and personal integrity. This Privacy Policy details how we collect, store, encrypt, process, and permanently erase your information when you access or use the ConnectHearts dating platform, mobile web application, or associated services.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "var(--color-primary, #FF477E)", fontSize: "20px", marginBottom: "12px" }}>2. Information We Collect</h2>
            <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
              <li style={{ marginBottom: "8px" }}><strong>Account Credentials:</strong> Full name, verified email address, cryptographically hashed passwords (using bcrypt with 12 salt rounds), age (18+ requirement), and gender identity.</li>
              <li style={{ marginBottom: "8px" }}><strong>Dating Profile &amp; Preferences:</strong> Biography, city location, selected interests, dating intention (relationship, friendship, or casual), custom prompt cards, lifestyle attributes (zodiac, workout, pets, education), and discovery distance/age filters.</li>
              <li style={{ marginBottom: "8px" }}><strong>Photographs &amp; Media:</strong> Profile avatar and user-submitted gallery photos uploaded for dating verification and member discovery.</li>
              <li style={{ marginBottom: "8px" }}><strong>Communications:</strong> Encrypted chat messages, emoji reactions, voice note memos, and call signaling records exchanged between matched members.</li>
              <li style={{ marginBottom: "8px" }}><strong>Safety &amp; Moderation Records:</strong> Safety reports, block records, and authentication audit logs required to ensure community integrity and abuse prevention.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "var(--color-primary, #FF477E)", fontSize: "20px", marginBottom: "12px" }}>3. How We Use Your Information</h2>
            <p>We process your data strictly to facilitate authentic, intentional dating connections:</p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
              <li style={{ marginBottom: "6px" }}>Calculating mutual compatibility scores based on shared interests and preferences.</li>
              <li style={{ marginBottom: "6px" }}>Delivering real-time messages, voice notes, and virtual date rooms between confirmed matches.</li>
              <li style={{ marginBottom: "6px" }}>Filtering discovery feeds according to your age, gender, and geographic preferences.</li>
              <li style={{ marginBottom: "6px" }}>Detecting, preventing, and addressing fraud, impersonation, underage access, and abusive conduct.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "var(--color-primary, #FF477E)", fontSize: "20px", marginBottom: "12px" }}>4. Data Security &amp; Encryption</h2>
            <p>
              We implement industry-standard technical safeguards: all web and API traffic is strictly transmitted over HTTPS/TLS; passwords are never saved in plaintext; access tokens (JWT) are signed with protected, high-entropy secrets; database instances are protected by network isolation and access controls; and profile endpoints prevent mass-assignment privilege escalation.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "var(--color-primary, #FF477E)", fontSize: "20px", marginBottom: "12px" }}>5. Permanent Account &amp; Data Deletion</h2>
            <p>
              You maintain total ownership over your data. You may permanently delete your ConnectHearts account at any time from your <strong>Settings &gt; Danger Zone</strong>. Upon confirmation:
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
              <li style={{ marginBottom: "6px" }}>Your user profile is immediately removed from all discovery decks.</li>
              <li style={{ marginBottom: "6px" }}>All associated likes, mutual matches, chat messages, notifications, and media files are cascadingly and permanently deleted from our database.</li>
              <li style={{ marginBottom: "6px" }}>This action is non-reversible and leaves no orphaned access credentials.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "var(--color-primary, #FF477E)", fontSize: "20px", marginBottom: "12px" }}>6. Third-Party Hosting &amp; Infrastructure</h2>
            <p>
              ConnectHearts operates on certified cloud infrastructure, including MongoDB Atlas (database hosting), Render (backend web services), and Vercel (frontend edge delivery). We never sell, rent, or trade your personal data to marketing third parties or data brokers.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "var(--color-primary, #FF477E)", fontSize: "20px", marginBottom: "12px" }}>7. Privacy Contact &amp; Inquiries</h2>
            <p>
              If you have any questions or data access requests regarding this policy, please reach out to our privacy desk at: <a href="mailto:privacy@connecthearts.com" style={{ color: "var(--color-primary, #FF477E)" }}>privacy@connecthearts.com</a>.
            </p>
          </section>
        </article>

        <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" style={{ color: "var(--color-primary, #FF477E)", textDecoration: "none", fontWeight: "600" }}>← Back to Home</Link>
          <Link to="/terms" style={{ color: "var(--color-primary, #FF477E)", textDecoration: "none", fontWeight: "600" }}>View Terms of Service →</Link>
        </div>
      </main>
    </div>
  );
}
