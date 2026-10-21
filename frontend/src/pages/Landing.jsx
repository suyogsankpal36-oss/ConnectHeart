import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Navbar from "../components/Navbar";

const CURRENT_YEAR = new Date().getFullYear();

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loader-screen">
        <div className="pulsing-heart-loader">♥</div>
        <p>Connecting Hearts...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/discover" replace />;
  }

  return (
    <div className="landing-page">
      {/* Background Ambient Glow Orbs */}
      <div className="ambient-glow glow-1" aria-hidden="true" />
      <div className="ambient-glow glow-2" aria-hidden="true" />

      {/* Top Shared Sticky Header */}
      <Navbar />

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container hero-grid">
          <div className="hero-text-col">
            <div className="hero-badge-pill">
              <span className="sparkle-icon">✨</span>
              <span>THE CURATED DATING EXPERIENCE</span>
            </div>

            <h1 className="hero-title">
              Where Deep Chemistry <br />
              <span className="gold-text-shimmer">Meets Modern Elegance.</span>
            </h1>

            <p className="hero-description">
              ConnectHearts is crafted for intentional individuals seeking real sparks,
              authentic conversations, and genuine chemistry. Explore verified members,
              discover shared passions, and connect in real time.
            </p>

            <div className="hero-cta-group">
              <Link to="/register" className="primary-btn hero-main-btn">
                <span>Create Free Profile</span>
                <span className="btn-arrow">→</span>
              </Link>
              <Link to="/login" className="secondary-btn hero-sec-btn">
                <span>Sign In</span>
              </Link>
            </div>

            <div className="hero-trust-badges">
              <div className="trust-item">
                <span className="trust-icon">🔒</span>
                <div>
                  <strong>End-to-End Privacy</strong>
                  <small>Your details remain protected</small>
                </div>
              </div>
              <div className="trust-item">
                <span className="trust-icon">👑</span>
                <div>
                  <strong>100% Verified</strong>
                  <small>Curated genuine members</small>
                </div>
              </div>
              <div className="trust-item">
                <span className="trust-icon">💬</span>
                <div>
                  <strong>Live Real-Time Chat</strong>
                  <small>Instant audio, video & text</small>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-visual-col">
            <div className="floating-card-mockup">
              <div className="mockup-img-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80"
                  alt="Aria Sharma - ConnectHearts Featured Match"
                  loading="eager"
                />
                <div className="mockup-gradient" />

                <div className="mockup-affinity-chip">
                  <span className="pulse-dot" />
                  <span>98% High Chemistry</span>
                </div>

                <div className="mockup-info">
                  <div className="mockup-name-row">
                    <h3>Aria Sharma, 24</h3>
                    <span className="verified-crest" title="Verified Member">✓</span>
                  </div>
                  <p className="mockup-city">📍 Mumbai • Architect & Cellist</p>
                  
                  <div className="mockup-quote-pill">
                    <em>&ldquo;Looking for someone who laughs at terrible puns and loves midnight jazz.&rdquo;</em>
                  </div>

                  <div className="mockup-tags">
                    <span className="tag-pill">☕ Espresso</span>
                    <span className="tag-pill">🎻 Indie Jazz</span>
                    <span className="tag-pill">🎨 Architecture</span>
                    <span className="tag-pill">✈️ Florence</span>
                  </div>
                </div>
              </div>

              {/* Floating Match Celebration Notification */}
              <div className="mockup-match-bubble">
                <div className="bubble-avatar-pair">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Aria" />
                  <span className="bubble-heart-badge">💖</span>
                  <div className="bubble-partner-avatar">You</div>
                </div>
                <div className="bubble-content">
                  <strong>Mutual Spark Ignited!</strong>
                  <p>You and Aria liked each other</p>
                  <span className="bubble-time">Just now</span>
                </div>
              </div>

              {/* Compatibility Badge */}
              <div className="mockup-stat-tag">
                <span className="stat-number">4.9★</span>
                <span className="stat-label">Member Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Metrics Ticker Bar */}
      <section className="landing-metrics-bar">
        <div className="landing-container metrics-inner">
          <div className="metric-box">
            <div className="metric-val">48,500+</div>
            <div className="metric-label">Meaningful Connections</div>
          </div>
          <div className="metric-divider" />
          <div className="metric-box">
            <div className="metric-val">94.2%</div>
            <div className="metric-label">Mutual Chemistry Rate</div>
          </div>
          <div className="metric-divider" />
          <div className="metric-box">
            <div className="metric-val">&lt; 48 Hrs</div>
            <div className="metric-label">Average Time to First Date</div>
          </div>
          <div className="metric-divider" />
          <div className="metric-box">
            <div className="metric-val">Zero Bots</div>
            <div className="metric-label">100% Curated &amp; Verified</div>
          </div>
        </div>
      </section>

      {/* 3-Step Journey Section */}
      <section className="landing-journey">
        <div className="landing-container">
          <div className="section-title-center">
            <span className="eyebrow">HOW MAGIC HAPPENS</span>
            <h2>Three Steps to Your Next Great Love Story</h2>
            <p className="section-subtitle">
              Intelligent design paired with intentional relationship science to save you time and spark genuine connection.
            </p>
          </div>

          <div className="journey-steps-grid">
            <div className="journey-step-card">
              <div className="step-num-pill">01</div>
              <div className="step-icon">🎨</div>
              <h3>Curate Your Editorial Story</h3>
              <p>
                Showcase your genuine personality through magazine-grade portrait galleries,
                lifestyle badges, and thoughtful Hinge-style prompt responses.
              </p>
            </div>

            <div className="journey-step-card featured">
              <div className="step-num-pill gold">02</div>
              <div className="step-icon">✨</div>
              <h3>Discover High-Chemistry Souls</h3>
              <p>
                Our multi-dimensional affinity algorithm analyzes lifestyle, relationship intent,
                and mutual passions to surface only your most compatible matches.
              </p>
            </div>

            <div className="journey-step-card">
              <div className="step-num-pill">03</div>
              <div className="step-icon">🥂</div>
              <h3>Converse &amp; Virtual Date</h3>
              <p>
                Break the ice effortlessly with opening notes, real-time Socket.IO chat, voice memos,
                and real-time virtual date simulation rooms before meeting in person.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights & Features Section */}
      <section className="landing-features">
        <div className="landing-container">
          <div className="section-title-center">
            <span className="eyebrow">WHY CHOOSE CONNECTHEARTS</span>
            <h2>Dating Reimagined with Heart, Luxury &amp; Safety</h2>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">✨</div>
              <h3>Affinity Chemistry Scoring</h3>
              <p>
                Instant percentage calculations based on lifestyle synergy, values, and dating goals
                so you spend time with people who truly align with your future.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Personal Prompts &amp; Opening Notes</h3>
              <p>
                Move beyond superficial bios. Answer witty prompts and attach thoughtful notes
                directly with likes to eliminate awkward small talk.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">↺</div>
              <h3>Intuitive Swipe Physics &amp; Rewind</h3>
              <p>
                Fluid rotational inertia with live stamps (&ldquo;LIKE&rdquo;, &ldquo;PASS&rdquo;, &ldquo;SUPERLIKE&rdquo;). Accidentally passed?
                One-tap rewind instantly restores previous profiles.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎥</div>
              <h3>Virtual Date Video Rooms</h3>
              <p>
                Simulated real-time video rendezvous with romantic mood ambient filters and built-in
                icebreaker cards for safe, memorable first conversations.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎙️</div>
              <h3>Voice Notes &amp; Real-Time Receipts</h3>
              <p>
                Hear the tone and laugh behind the profile with voice memos, live typing bubbles,
                and clear read receipts.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Comprehensive Safety Controls</h3>
              <p>
                Instant profile blocking, reporting, precise discovery radius filters, and permanent
                account deletion safeguards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Member Testimonials / Love Stories */}
      <section className="landing-testimonials">
        <div className="landing-container">
          <div className="section-title-center">
            <span className="eyebrow">REAL SPARKS</span>
            <h2>Stories from Our Members</h2>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="quote-stars">★★★★★</div>
              <p className="quote-text">
                &ldquo;The difference with ConnectHearts is the intentionality. The prompt cards and chemistry score led me to Julian on day two. We just celebrated our six-month anniversary in Goa.&rdquo;
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">P</div>
                <div>
                  <strong>Priya &amp; Julian</strong>
                  <small>Matched in Mumbai • Dating 6 Months</small>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="quote-stars">★★★★★</div>
              <p className="quote-text">
                &ldquo;I was exhausted by mindless swiping apps. ConnectHearts feels like stepping into a private members club. The dark luxury design, audio date simulation, and verified profiles are unmatched.&rdquo;
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">R</div>
                <div>
                  <strong>Rohan K.</strong>
                  <small>Bengaluru • Architect</small>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="quote-stars">★★★★★</div>
              <p className="quote-text">
                &ldquo;The voice memos feature is brilliant. Being able to hear Kabir&apos;s voice before our first virtual date made our real dinner feel like meeting an old friend.&rdquo;
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">A</div>
                <div>
                  <strong>Ananya &amp; Kabir</strong>
                  <small>Delhi • Engaged</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action Banner */}
      <section className="landing-cta-banner">
        <div className="landing-container">
          <div className="cta-banner-inner">
            <span className="banner-eyebrow">YOUR JOURNEY AWAITS</span>
            <h2>Ready to Experience Intentional Romance?</h2>
            <p>Join thousands of verified members finding genuine sparks every day.</p>
            <div className="banner-cta-group">
              <Link to="/register" className="primary-btn banner-btn">
                <span>Create Your Free Account</span>
                <span className="btn-arrow">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container footer-content">
          <div className="footer-brand">
            <span className="heart animated-heart">♥</span>
            <strong>ConnectHearts</strong>
            <p className="footer-tagline">Crafted for genuine chemistry &amp; modern elegance.</p>
          </div>

          <div className="footer-links">
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
            <Link to="/forgot-password">Account Recovery</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>

        <div className="landing-container footer-bottom">
          <p>© {CURRENT_YEAR} ConnectHearts. All rights reserved. Private, secure, and encrypted.</p>
        </div>
      </footer>
    </div>
  );
}
