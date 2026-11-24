import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/images/logoTransparent.png";
export default function Invitation() {
  const { token } = useParams();
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    sessionStorage.setItem("flowe-invite", token);
    api("/invitations/" + token)
      .then((d) => live && setInvite(d))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [token]);
  async function accept() {
    setBusy(true);
    setError("");
    try {
      const data = await api("/invitations/" + token + "/accept", {
        method: "POST",
      });
      sessionStorage.removeItem("flowe-invite");
      sessionStorage.setItem("flowe-workspace", data.workspaceId);
      navigate("/workspace");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="fh-invitation-page">
      <section className="fh-modal">
        <span className="fh-modal-orb">
          <img src={logo} alt="" width="38" height="38" />
        </span>
        <span className="fh-label">GOOD THINGS GROW TOGETHER</span>
        <h1>
          {invite
            ? `You’re invited to ${invite.workspaceName}.`
            : "An invitation to grow."}
        </h1>
        <p>Sign in with the email address that received this invitation.</p>
        {error && (
          <p role="alert" className="flowe-error">
            {error}
          </p>
        )}
        {loading ? (
          <p>Checking your session…</p>
        ) : (
          invite &&
          (user ? (
            <>
              <p>
                Signed in as <strong>{user.email}</strong>
              </p>
              <button disabled={busy} className="fh-primary" onClick={accept}>
                Join workspace <ArrowRight size={17} />
              </button>
              <button
                className="fh-pill"
                onClick={async () => {
                  try {
                    await logout();
                    navigate("/login");
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                Use another account
              </button>
            </>
          ) : (
            <div className="fh-actions">
              <Link className="fh-primary" to="/login">
                Sign in
              </Link>
              <Link className="fh-pill" to="/signup">
                Create an account
              </Link>
            </div>
          ))
        )}
        <p>
          <Link
            to="/workspace"
            onClick={() => sessionStorage.removeItem("flowe-invite")}
          >
            Back to my workspaces
          </Link>
        </p>
      </section>
    </main>
  );
}
