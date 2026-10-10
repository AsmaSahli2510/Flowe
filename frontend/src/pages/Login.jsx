import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  Check,
  ArrowUpRight,
} from "lucide-react";
import logo from "../images/logoTransparent.png";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  return (
    <main className="flowe-login">
      <section className="login-art" aria-label="Flowe brand illustration">
        <div className="art-top">
          <div className="art-brand">
            <img src={logo} alt="" />
            <span>
              flowe<span className="brand-dot">.</span>
            </span>
          </div>
          <span className="art-edition">
            YOUR SPACE TO BLOOM <Sparkles size={14} />
          </span>
        </div>
        <div className="art-middle">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="flower-scene">
            <img className="large-logo" src={logo} alt="Flowe" />

          </div>
          <div className="mini-note">
            <span className="note-check">
              <Check size={15} />
            </span>
            <span>
              <strong>Ideas in motion</strong>
              <small>Everything, beautifully organized</small>
            </span>
            <ArrowUpRight size={16} />
          </div>
        </div>
        <div className="art-bottom">
          <div className="art-label">
            <span className="label-line" /> THE CREATIVE WORKSPACE
          </div>
          <h1>
            Make room for
            <br />
            <em>great things.</em>
          </h1>
          <p>
            Bring your people, projects, and bright ideas together in one
            beautiful place.
          </p>
          <div className="art-pagination" aria-label="Creative workspace highlights">
            <span className="active" />
            <span />
            <span />
          </div>
        </div>
      </section>
      <section className="login-form-side">
        <div className="mobile-brand">
          <img src={logo} alt="" /> flowe.
        </div>
        <div className="login-form-wrap">
          <div className="login-eyebrow">
            <span className="eyebrow-sun"></span>{" "}
          </div>
          <h2>
            Welcome <span>back.</span>
          </h2>
          <p className="login-subtitle">
            A little more flow, a lot less chaos. Sign in to pick up where your
            ideas left off.
          </p>
          <form onSubmit={(e) => e.preventDefault()} noValidate>
            <label htmlFor="flowe-email">Email address</label>
            <div className="login-field">
              <Mail size={18} />
              <input
                id="flowe-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="password-label">
              <label htmlFor="flowe-password">Password</label>
              <span className="demo-hint"></span>
            </div>
            <div className="login-field">
              <LockKeyhole size={18} />
              <input
                id="flowe-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="password-eye"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />{" "}
                Remember me
              </label>

            </div>
            <button className="login-submit" type="submit">
              Enter your workspace{" "}
              <span>
                <ArrowRight size={19} />
              </span>
            </button>
            <div className="social-divider">
              <span /> OR CONTINUE WITH <span />
            </div>
            <div className="social-login">
              <button className="social-button" type="button">
                <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.45a5.51 5.51 0 0 1-2.39 3.62v3.01h3.87c2.27-2.09 3.56-5.17 3.56-8.66Z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3.01c-1.07.72-2.44 1.14-4.08 1.14-3.14 0-5.8-2.12-6.75-4.97H1.25v3.1A12 12 0 0 0 12 24Z" />
                  <path fill="#FBBC05" d="M5.25 14.25A7.22 7.22 0 0 1 4.87 12c0-.78.13-1.54.38-2.25v-3.1H1.25A12 12 0 0 0 0 12c0 1.93.46 3.75 1.25 5.35l4-3.1Z" />
                  <path fill="#EA4335" d="M12 4.78c1.76 0 3.34.61 4.59 1.81l3.44-3.44C17.95 1.18 15.24 0 12 0A12 12 0 0 0 1.25 6.65l4 3.1C6.2 6.9 8.86 4.78 12 4.78Z" />
                </svg>
                Google
              </button>
              <button className="social-button" type="button">
                <svg className="outlook-mark" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#0078D4" d="M13 3.5 22 2v20l-9-1.5V3.5Z" />
                  <path fill="#0364B8" d="M2 6.5 13 5v14L2 17.5v-11Z" />
                  <path fill="#28A8EA" d="M13 5 22 2v7l-9 5V5Z" />
                  <path fill="#0078D4" d="m13 14 9-5v7l-9 3v-5Z" />
                  <path fill="#1490DF" d="M2 6.5 8 8v8l-6 1.5v-11Z" />
                  <path fill="#fff" d="M5.9 9.4c1.42 0 2.38 1.03 2.38 2.72s-.96 2.72-2.38 2.72-2.37-1.03-2.37-2.72.95-2.72 2.37-2.72Zm0 4.3c.62 0 1.02-.57 1.02-1.58s-.4-1.58-1.02-1.58-1.01.57-1.01 1.58.4 1.58 1.01 1.58Z" />
                </svg>
                Outlook
              </button>
            </div>
          </form>

        </div>
        <div className="login-footer">
          <span></span>
          <span>
            Made for minds that make things{" "}
            <span className="footer-flower"></span>
          </span>
        </div>
      </section>
    </main>
  );
}
