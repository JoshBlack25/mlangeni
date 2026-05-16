import Link from "next/link";

export default function LoginPage() {
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
        <div className="mgh-auth-box">
          <p className="mgh-auth-small-title">Welcome back</p>
          <h2>Sign in to your account</h2>

          <form className="mgh-auth-form">
            <div className="mgh-input-box">
              <UserIcon />
              <input type="email" placeholder="Email address" />
            </div>

            <div className="mgh-input-box">
              <LockIcon />
              <input type="password" placeholder="Password" />
              <button type="button" className="mgh-eye-btn">
                <EyeIcon />
              </button>
            </div>

            <div className="mgh-auth-options">
              <label>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <Link href="#">Forgot password?</Link>
            </div>

            <button type="submit" className="mgh-auth-main-btn">
              SIGN IN
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
            Don&apos;t have an account?{" "}
            <Link href="/register">Create account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function UserIcon() {
  return (
    <svg className="mgh-field-icon" viewBox="0 0 24 24">
      <circle cx="12" cy="7.5" r="4.5" />
      <path d="M4.5 21c1.2-5 4.7-8 7.5-8s6.3 3 7.5 8" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="mgh-field-icon" viewBox="0 0 24 24">
      <rect x="5" y="10" width="14" height="10" rx="1.8" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15" r="1.2" />
    </svg>
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
