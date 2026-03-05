import { useEffect, useState } from "react";
import {
  getAdminByCredentials,
  seedDefaultAdminIfNeeded,
} from "../lib/registrationStore";

const FEATURES = [
  {
    icon: "🛡️",
    label: "Full Monitoring Control",
    desc: "Real-time visibility across all system activity and data.",
  },
  {
    icon: "✅",
    label: "User Approval Management",
    desc: "Approve or reject staff registration requests instantly.",
  },
  {
    icon: "🎭",
    label: "Role Assignment",
    desc: "Assign and modify roles for all registered users.",
  },
  {
    icon: "📊",
    label: "Real-time Data Visibility",
    desc: "Live Firebase data dashboard with analytics.",
  },
];

export function AppAdminPanelPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Seed default admin credentials on first load
  useEffect(() => {
    seedDefaultAdminIfNeeded();
  }, []);

  const handleBack = () => {
    window.location.hash = "";
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!userId || !password) {
      setError("Please enter your User ID and Password.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const admin = getAdminByCredentials(userId.trim(), password);
      if (admin) {
        // Login success -- go to admin dashboard
        window.location.hash = "admin-dashboard";
        return;
      }
      setError("Invalid User ID or Password. Please try again.");
    }, 1200);
  };

  return (
    <div
      data-ocid="app-admin-panel.page"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(145deg, #0a1628 0%, #0f2044 40%, #1a1060 100%)",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: "#e2e8f0",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: "4px",
          background: "linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)",
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
          background: "rgba(10,22,40,0.7)",
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
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(59,130,246,0.4)",
            }}
          >
            <span style={{ fontSize: "22px" }}>🛡️</span>
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
              Application Admin Panel
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
          data-ocid="app-admin-panel.back.button"
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
        {/* Left: info */}
        <div>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 18px",
              borderRadius: "50px",
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#3b82f6",
                display: "inline-block",
                boxShadow: "0 0 0 3px rgba(59,130,246,0.25)",
              }}
            />
            <span
              style={{
                color: "#93c5fd",
                fontWeight: 700,
                fontSize: "12px",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              Restricted Access
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
            Application{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Admin
            </span>{" "}
            Control Center
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
            Full-access system administration panel. Manage all users, approve
            registrations, assign roles, and monitor real-time platform data.
          </p>

          {/* Feature list */}
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
                    background: "rgba(59,130,246,0.15)",
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
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                margin: "0 auto 14px",
                boxShadow: "0 8px 24px rgba(59,130,246,0.4)",
              }}
            >
              🛡️
            </div>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "20px",
                color: "#f1f5f9",
                margin: "0 0 6px",
              }}
            >
              Secure Admin Login
            </h2>
            <p style={{ color: "#64748b", fontSize: "13px" }}>
              Application Administrator credentials required
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label
                htmlFor="app-admin-userid"
                style={{
                  display: "block",
                  color: "#94a3b8",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "6px",
                  letterSpacing: "0.5px",
                }}
              >
                EMAIL / USER ID
              </label>
              <input
                id="app-admin-userid"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your Email or User ID"
                data-ocid="app-admin-panel.userid.input"
                autoComplete="username"
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
                htmlFor="app-admin-password"
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
                  id="app-admin-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  data-ocid="app-admin-panel.password.input"
                  autoComplete="current-password"
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
                data-ocid="app-admin-panel.error_state"
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

            <button
              type="submit"
              disabled={loading}
              data-ocid="app-admin-panel.login.submit_button"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                border: "none",
                color: "white",
                borderRadius: "10px",
                padding: "13px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 6px 20px rgba(59,130,246,0.35)",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Authenticating..." : "Access Admin Panel"}
            </button>
          </form>

          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#fca5a5",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              <span>🔒</span> Unauthorized access attempts are logged and
              reported
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
