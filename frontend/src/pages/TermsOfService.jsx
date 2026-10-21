import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function TermsOfService() {
  return (
    <div className="landing-page dark-luxury-root">
      <Navbar />

      <main className="policy-container" style={{ maxWidth: "860px", margin: "40px auto 80px", padding: "0 24px" }}>
        <div className="policy-header" style={{ marginBottom: "32px", textAlign: "center" }}>
          <span className="eyebrow" style={{ color: "var(--color-primary, #FF477E)", fontSize: "12px", letterSpacing: "2px", fontWeight: "700" }}>LEGAL &amp; COMPLIANCE</span>
          <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: "36px", marginTop: "8px", color: "var(--color-text-main, #F5F5F5)" }}>Terms of Service</h1>
          <p style={{ color: "var(--color-text-muted, #9E9E9E)", fontSize: "14px", marginTop: "4px" }}>Last Updated: October 2026 • Beta Edition</p>
        </div>

        <article className="policy-content" style={{ color: "var(--color-text-main, #E0E0E0)", lineHeight: "1.75", fontSize: "15px" }}>
          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "var(--color-primary, #FF477E)", fontSize: "20px", marginBottom: "12px" }}>1. Acceptance of Terms</h2>
            <p>
              By accessing, registering for, or using <strong>ConnectHearts</strong>, you agree to be bound by these Terms of Service. If you do not agree to every provision in these terms, please refrain from using our application.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "var(--color-primary, #FF477E)", fontSize: "20px", marginBottom: "12px" }}>2. Member Eligibility</h2>
            <p>
              To create an account or interact on ConnectHearts, you must be <strong>at least 18 years of age</strong>. By registering, you confirm and warrant that:
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
              <li style={{ marginBottom: "6px" }}>You are at least 18 years old and legally competent to enter into an agreement.</li>
              <li style={{ marginBottom: "6px" }}>You have not previously been suspended or permanently removed from ConnectHearts for safety violations.</li>
              <li style={{ marginBottom: "6px" }}>You maintain only one personal account representing your true identity.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "var(--color-primary, #FF477E)", fontSize: "20px", marginBottom: "12px" }}>3. Community Code of Conduct</h2>
            <p>
              ConnectHearts is dedicated to respectful, authentic dating. We enforce a zero-tolerance policy regarding the following prohibited actions:
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
              <li style={{ marginBottom: "6px" }}><strong>Harassment &amp; Abuse:</strong> Threatening, stalking, insulting, or non-consensual sexually explicit messaging.</li>
              <li style={{ marginBottom: "6px" }}><strong>Impersonation &amp; Fraud:</strong> Using photos of other people, claiming false identities, or attempting financial scams.</li>
              <li style={{ marginBottom: "6px" }}><strong>Hate Speech:</strong> Promoting discrimination, bigotry, racism, or hatred based on race, religion, gender, disability, or orientation.</li>
              <li style={{ marginBottom: "6px" }}><strong>Commercial Exploitation:</strong> Advertising products, soliciting transactions, promoting external services, or distributing automated spam bots.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "var(--color-primary, #FF477E)", fontSize: "20px", marginBottom: "12px" }}>4. Safety, Reporting, and Account Suspension</h2>
            <p>
              Members have instant access to self-protection tools:
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
              <li style={{ marginBottom: "6px" }}><strong>Instant Blocking:</strong> Immediately removes another member from your discovery and messages, preventing further contact.</li>
              <li style={{ marginBottom: "6px" }}><strong>Abuse Reporting:</strong> Directly alerts our moderation review desk with detailed categories (harassment, fake profiles, inappropriate media).</li>
              <li style={{ marginBottom: "6px" }}><strong>Termination:</strong> We reserve the right to suspend or permanently terminate any account that violates our safety standards.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "var(--color-primary, #FF477E)", fontSize: "20px", marginBottom: "12px" }}>5. Virtual Dating &amp; Content Disclaimer</h2>
            <p>
              Virtual dating rooms and voice messaging are provided for interpersonal enjoyment. While we implement safeguards, ConnectHearts cannot guarantee the offline behavior of members. We strongly urge members to follow dating safety best practices when communicating or meeting in person.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "var(--color-primary, #FF477E)", fontSize: "20px", marginBottom: "12px" }}>6. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, ConnectHearts shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform or conduct of other members.
            </p>
          </section>
        </article>

        <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" style={{ color: "var(--color-primary, #FF477E)", textDecoration: "none", fontWeight: "600" }}>← Back to Home</Link>
          <Link to="/privacy" style={{ color: "var(--color-primary, #FF477E)", textDecoration: "none", fontWeight: "600" }}>View Privacy Policy →</Link>
        </div>
      </main>
    </div>
  );
}
