import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/apiClient";
import logo from "../assets/images/logoTransparent.png";
import "../features/board/components/cards/CardEditor.css";
export default function PasswordReset() {
  const [params] = useSearchParams(),
    token = params.get("token"),
    [value, setValue] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "linear-gradient(135deg,#faf7f2,#f3edf9,#eef8f1)",
      }}
    >
      <section className="at-modal">
        <header>
          <div>
            <img src={logo} width="42" alt="Flowe" />
            <h2>Find your flow again.</h2>
            <small>
              {token ? "CHOOSE A NEW PASSWORD" : "RECOVER YOUR ACCOUNT"}
            </small>
          </div>
        </header>
        <form
          className="at-body"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const d = await api(
                "/auth/" + (token ? "reset-password" : "forgot-password"),
                {
                  method: "POST",
                  body: token ? { token, password: value } : { email: value },
                },
              );
              setMessage(d.message);
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {error && (
            <p role="alert" className="at-error">
              {error}
            </p>
          )}
          {message ? (
            <p role="status">{message}</p>
          ) : (
            <>
              <p className="at-hint">
                {token
                  ? "Your new password must have at least 8 characters."
                  : "We’ll email you a secure, single-use reset link."}
              </p>
              <label>
                {token ? "New password" : "Email address"}
                <input
                  required
                  autoComplete={token ? "new-password" : "email"}
                  type={token ? "password" : "email"}
                  minLength={token ? 8 : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
              <button className="at-primary" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : token
                    ? "Save new password"
                    : "Send reset link"}
              </button>
            </>
          )}
          <p>
            <Link to="/login">Back to sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
