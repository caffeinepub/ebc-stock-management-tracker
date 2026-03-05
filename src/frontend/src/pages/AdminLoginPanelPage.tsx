import { useState } from "react";

// Admin credentials for the standalone Admin Login Panel
const ADMIN_EMAIL = "admin@ebc.com";
const ADMIN_PASSWORD = "Admin@123";

const FEATURES = [
  {
    icon: "🔐",
    label: "Secure Login",
    desc: "Enterprise-grade authentication with account lockout protection.",
  },
  {
    icon: "📈",
    label: "Dashboard Overview",
    desc: "High-level summary of stock, rooms, and system health.",
  },
  {
    icon: "📋",
    label: "Reports & Analytics",
    desc: "Generate and export detailed consumption and activity reports.",
  },
  {
    icon: "🔔",
    label: "Notifications",
    desc: "Real-time alerts for pending approvals and stock thresholds.",
  },
];

export function AdminLoginPanelPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleBack = () => {
    window.location.hash = "";
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (attempts >= 3) {
      setError(
        "Account locked after 3 failed attempts. Please contact your system administrator.",
      );
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Check credentials
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Login success -- redirect to admin dashboard
        window.location.hash = "admin-dashboard";
        return;
      }
      // Wrong credentials
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setError(
          "Account locked after 3 failed attempts. Please contact your system administrator.",
        );
      } else {
        setError(
          `Invalid credentials. ${3 - newAttempts} attempt(s) remaining before lockout.`,
        );
      }
    }, 1200);
  };

  const isLocked = attempts >= 3;

  return (
    <div
      data-ocid="admin-login-panel.page"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(145deg, #0c1a14 0%, #0a2010 40%, #061a30 100%)",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: "#e2e8f0",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: "4px",
          background: "linear-gradient(90deg, #059669, #0891b2, #0369a1)",
        }}
      />

      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(6,26,16,0.7)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #059669, #0891b2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(5,150,105,0.4)",
            }}
          >
            <span style={{ fontSize: "22px" }}>🔐</span>
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: "16px",
                color: "#f1f5f9",
                letterSpacing: "-0.3px",
              }}
            >
              Admin Login Panel
            </div>
            <div
              style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 500 }}
            >
              EBC Stock Management Tracker
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleBack}
          data-ocid="admin-login-panel.back.button"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#94a3b8",
            borderRadius: "8px",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← Back to Home
        </button>
      </header>

      {/* Main */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "48px 24px 64px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "48px",
          alignItems: "start",
        }}
      >
        {/* Left */}
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 18px",
              borderRadius: "50px",
              background: "rgba(5,150,105,0.15)",
              border: "1px solid rgba(5,150,105,0.3)",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#059669",
                display: "inline-block",
                boxShadow: "0 0 0 3px rgba(5,150,105,0.25)",
              }}
            />
            <span
              style={{
                color: "#6ee7b7",
                fontWeight: 700,
                fontSize: "12px",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              Admin Access
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(26px, 3.5vw, 40px)",
              fontWeight: 900,
              lineHeight: 1.15,
              margin: "0 0 16px",
              letterSpacing: "-0.5px",
              color: "#f1f5f9",
            }}
          >
            Admin{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #059669, #0891b2)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Dashboard
            </span>{" "}
            & Analytics
          </h1>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "15px",
              lineHeight: 1.7,
              marginBottom: "32px",
              maxWidth: "440px",
            }}
          >
            Access the admin command center for dashboard overviews, reports,
            analytics, and approval workflows.
          </p>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.label}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(5,150,105,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "14px",
                      color: "#e2e8f0",
                      marginBottom: "4px",
                    }}
                  >
                    {f.label}
                  </div>
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "12px",
                      lineHeight: 1.5,
                    }}
                  >
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Security note */}
          <div
            style={{
              marginTop: "24px",
              padding: "14px 16px",
              background: "rgba(5,150,105,0.08)",
              border: "1px solid rgba(5,150,105,0.2)",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                color: "#6ee7b7",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              🔒 Security Policy
            </div>
            <div
              style={{ color: "#64748b", fontSize: "11px", lineHeight: 1.5 }}
            >
              Account will be locked after 3 consecutive failed login attempts.
              All login activity is logged.
            </div>
          </div>
        </div>

        {/* Right: login form */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px",
            padding: "36px",
            backdropFilter: "blur(16px)",
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #059669, #0891b2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                margin: "0 auto 14px",
                boxShadow: "0 8px 24px rgba(5,150,105,0.4)",
              }}
            >
              🔐
            </div>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "20px",
                color: "#f1f5f9",
                margin: "0 0 6px",
              }}
            >
              Admin Login
            </h2>
            <p style={{ color: "#64748b", fontSize: "13px" }}>
              Enter your admin credentials to continue
            </p>
          </div>

          {isLocked ? (
            <div
              data-ocid="admin-login-panel.locked.error_state"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>🔒</div>
              <div
                style={{
                  color: "#fca5a5",
                  fontWeight: 700,
                  fontSize: "15px",
                  marginBottom: "6px",
                }}
              >
                Account Locked
              </div>
              <div
                style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.5 }}
              >
                Too many failed attempts. Contact your system administrator to
                unlock.
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label
                  htmlFor="admin-login-email"
                  style={{
                    display: "block",
                    color: "#94a3b8",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    letterSpacing: "0.5px",
                  }}
                >
                  ADMIN EMAIL
                </label>
                <input
                  id="admin-login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  data-ocid="admin-login-panel.email.input"
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    color: "#e2e8f0",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="admin-login-password"
                  style={{
                    display: "block",
                    color: "#94a3b8",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    letterSpacing: "0.5px",
                  }}
                >
                  PASSWORD
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="admin-login-password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    data-ocid="admin-login-panel.password.input"
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "10px",
                      padding: "12px 44px 12px 16px",
                      color: "#e2e8f0",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748b",
                      fontSize: "16px",
                    }}
                  >
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  data-ocid="admin-login-panel.error_state"
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    color: "#fca5a5",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </div>
              )}

              {/* Attempt indicator */}
              {attempts > 0 && !isLocked && (
                <div
                  style={{ display: "flex", gap: "6px", alignItems: "center" }}
                >
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: "4px",
                        borderRadius: "2px",
                        background:
                          i <= attempts ? "#ef4444" : "rgba(255,255,255,0.1)",
                        transition: "background 0.3s",
                      }}
                    />
                  ))}
                  <span
                    style={{
                      color: "#94a3b8",
                      fontSize: "11px",
                      flexShrink: 0,
                    }}
                  >
                    {3 - attempts} left
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                data-ocid="admin-login-panel.login.submit_button"
                style={{
                  background: "linear-gradient(135deg, #059669, #0891b2)",
                  border: "none",
                  color: "white",
                  borderRadius: "10px",
                  padding: "13px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  boxShadow: "0 6px 20px rgba(5,150,105,0.35)",
                  transition: "opacity 0.2s",
                }}
              >
                {loading ? "Verifying..." : "Login to Admin Panel"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
