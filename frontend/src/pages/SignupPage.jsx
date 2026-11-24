import { api, afterLogin } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  Check,
  ArrowUpRight,
  UserRound,
} from "lucide-react";
import logo from "../assets/images/logoTransparent.png";
import "../styles/auth.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    new URLSearchParams(window.location.search).get("error") || "",
  );
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await api("/auth/signup", {
        method: "POST",
        body: { name, email, password },
      });
      setUser(data.user);
      navigate(afterLogin(), { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
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
          <div
            className="art-pagination"
            aria-label="Creative workspace highlights"
          >
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
            <span className="eyebrow-sun"></span>
          </div>
          <h2>
            Start <span>fresh.</span>
          </h2>
          <p className="login-subtitle">
            A little more flow, a lot less chaos. Create your account and make
            room for great things.
          </p>
          {error && (
            <p className="flowe-error" role="alert">
              {error}
            </p>
          )}
          <form onSubmit={submit} aria-busy={busy}>
            <label htmlFor="signup-name">Full name</label>
            <div className="login-field">
              <UserRound size={18} />
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <label htmlFor="signup-email">Email address</label>
            <div className="login-field">
              <Mail size={18} />
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="password-label">
              <label htmlFor="signup-password">Password</label>
            </div>
            <div className="login-field">
              <LockKeyhole size={18} />
              <input
                id="signup-password"
                minLength={8}
                maxLength={72}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="password-eye"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button className="login-submit" type="submit" disabled={busy}>
              Create your account{" "}
              <span>
                <ArrowRight size={19} />
              </span>
            </button>
            <div className="social-divider">
              <span /> OR CONTINUE WITH <span />
            </div>
            <div className="social-login">
              <button
                type="button"
                className="social-button"
                onClick={() => window.location.assign("/api/auth/google")}
              >
                Google
              </button>
              <button
                type="button"
                className="social-button"
                onClick={() => window.location.assign("/api/auth/outlook")}
              >
                Outlook
              </button>
            </div>
          </form>
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
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
