import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="mgh-auth-page">
      <section className="mgh-auth-left">
        <img src="/logos/logo2.png" alt="MGH Logo" className="mgh-auth-logo" />

        <div className="mgh-auth-copy">
          <p className="mgh-gold">We create</p>

          <h1>
            Unforgettable
            <br />
            experiences
          </h1>

          <div className="mgh-line"></div>

          <p>
            From intermate gatherings to grand celebrations, we creaft moments
            that leave a lasting impression
          </p>
        </div>

        <div className="mgh-auth-features">
          <div className="mgh-feature">
            <CalendarIcon />
            <h3>Mlangeni Events</h3>
            <p>We plan , You celebrate</p>
          </div>

          <div className="mgh-feature has-border">
            <ServingIcon />
            <h3>Hospitality Collection</h3>
            <p>Luxury stays. Lasting comfort.</p>
          </div>

          <div className="mgh-feature has-border">
            <GlassIcon />
            <h3>Unforgettable Moments</h3>
            <p>
              Crafted with care,
              <br />
              remembered forever.
            </p>
          </div>
        </div>
      </section>

      <section className="mgh-auth-right">
        <div className="mgh-auth-box mgh-register-box">
          <h2 className="mgh-register-title">Create Account</h2>

          <form className="mgh-auth-form">
            <div className="mgh-input-box no-icon">
              <input type="text" placeholder="Full Name" />
            </div>

            <div className="mgh-input-box no-icon">
              <input type="email" placeholder="Email address" />
            </div>

            <div className="mgh-input-box no-icon">
              <input type="tel" placeholder="Phone Number" />
            </div>

            <div className="mgh-input-box no-icon">
              <input type="password" placeholder="Password" />

              <button type="button" className="mgh-eye-btn">
                <EyeIcon />
              </button>
            </div>

            <div className="mgh-auth-options register-check">
              <label>
                <input type="checkbox" />
                <span>I agree to the Terms &amp; Conditions</span>
              </label>
            </div>

            <button type="submit" className="mgh-auth-main-btn">
              REGISTER
            </button>
          </form>

          <div className="mgh-divider">
            <span></span>
            <p>OR</p>
            <span></span>
          </div>

          <button className="mgh-google-btn">
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <p className="mgh-auth-bottom">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function GoogleIcon() {
  return <span className="mgh-google-icon">G</span>;
}

function CalendarIcon() {
  return (
    <svg className="mgh-feature-icon" viewBox="0 0 24 24">
      <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
      <path d="M7 3v4M17 3v4M3.5 9h17M7 13h2.5M14.5 13H17M7 16.5h2.5M14.5 16.5H17" />
    </svg>
  );
}

function ServingIcon() {
  return (
    <svg className="mgh-feature-icon" viewBox="0 0 24 24">
      <path d="M5 18h14M7 18c.4-4.8 3-8 5-8s4.6 3.2 5 8M12 7V4M10 4h4M4 20h16" />
    </svg>
  );
}

function GlassIcon() {
  return (
    <svg className="mgh-feature-icon" viewBox="0 0 24 24">
      <path d="M7 3h6l-1 8a3 3 0 0 1-4 0L7 3zM10 12v7M7.5 20h5M14 5h5l-.8 7a2.6 2.6 0 0 1-3.4 0L14 5zM16.5 13v6M14.5 20h4" />
    </svg>
  );
}