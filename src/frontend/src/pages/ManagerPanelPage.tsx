import { useState } from "react";
import { RegistrationForm } from "../components/registration/RegistrationForm";
import { useActor } from "../hooks/useActor";
import { useRooms } from "../hooks/useQueries";
import { loginWithCredentialsFromBackend } from "../lib/backendRegistrationApi";
import {
  clearCurrentSession,
  saveUpdateRequest,
  setCurrentSession,
} from "../lib/registrationStore";
import type { ApprovedUser, UpdateRequest } from "../lib/registrationStore";

const FEATURES = [
  {
    icon: "🍽️",
    label: "Room-wise Food Consumption",
    desc: "Track food and beverage consumption per conference room in real time.",
  },
  {
    icon: "👥",
    label: "Staff Activity Monitoring",
    desc: "Monitor staff assignments, task progress, and daily check-ins.",
  },
  {
    icon: "📝",
    label: "Daily Report Submission",
    desc: "Submit end-of-day consumption and activity summaries.",
  },
  {
    icon: "📊",
    label: "Trend Analytics",
    desc: "View weekly and monthly consumption patterns across all rooms.",
  },
];

// ─── Manager Dashboard ────────────────────────────────────────────────────────

function ManagerDashboard({
  user,
  onLogout,
}: {
  user: ApprovedUser;
  onLogout: () => void;
}) {
  const roomsQuery = useRooms();
  const [activeSection, setActiveSection] = useState<"overview" | "request">(
    "overview",
  );
  const [dataType, setDataType] = useState("stock_entry");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!description.trim()) {
      setSubmitError("Please provide a description of the change needed.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const req: UpdateRequest = {
        id: `upd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        requestedBy: user.tempUserId,
        requestedByName: user.name,
        role: "Manager",
        dataType,
        description: description.trim(),
        payload: { dataType, description },
        status: "pending",
        submittedAt: Date.now(),
      };
      saveUpdateRequest(req);
      setSubmitting(false);
      setSubmitSuccess(true);
      setDescription("");
      setTimeout(() => setSubmitSuccess(false), 4000);
    }, 800);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "#e2e8f0",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "6px",
    letterSpacing: "0.5px",
  };

  return (
    <div
      data-ocid="manager-panel.manager-dashboard.panel"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(145deg, #1a0d2e 0%, #150a28 40%, #0a1628 100%)",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: "#e2e8f0",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: "4px",
          background: "linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)",
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
          background: "rgba(26,13,46,0.7)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
            }}
          >
            <span style={{ fontSize: "22px" }}>💼</span>
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
              Manager Dashboard
            </div>
            <div
              style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 500 }}
            >
              EBC Stock Management Tracker
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "50px",
              background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.3)",
            }}
          >
            <span style={{ fontSize: "14px" }}>👤</span>
            <span
              style={{ color: "#c4b5fd", fontSize: "13px", fontWeight: 600 }}
            >
              {user.name}
            </span>
            <span
              style={{
                background: "rgba(124,58,237,0.3)",
                color: "#a78bfa",
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "50px",
                letterSpacing: "0.5px",
              }}
            >
              MANAGER
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#fca5a5",
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
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "40px 24px 64px",
        }}
      >
        {/* Welcome */}
        <div
          style={{
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#f1f5f9",
                margin: "0 0 6px",
              }}
            >
              Welcome, {user.name} 👋
            </h1>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>
              User ID:{" "}
              <span style={{ color: "#c4b5fd", fontFamily: "monospace" }}>
                {user.tempUserId}
              </span>{" "}
              &nbsp;·&nbsp; Role:{" "}
              <span style={{ color: "#a78bfa", fontWeight: 600 }}>Manager</span>
            </div>
          </div>
          <div style={{ color: "#64748b", fontSize: "12px" }}>
            🔒 Secure Session Active
          </div>
        </div>

        {/* Section Tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          {(["overview", "request"] as const).map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              style={{
                background:
                  activeSection === section
                    ? "rgba(124,58,237,0.2)"
                    : "rgba(255,255,255,0.04)",
                border: `1px solid ${
                  activeSection === section
                    ? "rgba(124,58,237,0.5)"
                    : "rgba(255,255,255,0.1)"
                }`,
                color: activeSection === section ? "#c4b5fd" : "#64748b",
                borderRadius: "8px",
                padding: "8px 20px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {section === "overview"
                ? "📊 Stock Overview"
                : "📝 Submit Update Request"}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeSection === "overview" && (
          <div>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#e2e8f0",
                marginBottom: "16px",
              }}
            >
              Conference Rooms Overview
            </h2>
            {roomsQuery.isPending ? (
              <div
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  padding: "24px",
                  textAlign: "center",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Loading room data...
              </div>
            ) : !roomsQuery.data || roomsQuery.data.length === 0 ? (
              <div
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  padding: "32px",
                  textAlign: "center",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏢</div>
                No data available
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                {roomsQuery.data.map((room) => (
                  <div
                    key={String(room.id)}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "20px",
                        marginBottom: "8px",
                      }}
                    >
                      🏛️
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#e2e8f0",
                        marginBottom: "4px",
                      }}
                    >
                      {room.name}
                    </div>
                    {room.description && (
                      <div
                        style={{
                          color: "#64748b",
                          fontSize: "12px",
                          lineHeight: 1.5,
                        }}
                      >
                        {room.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div
              style={{
                marginTop: "20px",
                padding: "14px 16px",
                background: "rgba(124,58,237,0.06)",
                border: "1px solid rgba(124,58,237,0.15)",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "12px",
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: "#c4b5fd", fontWeight: 600 }}>
                  View Only:{" "}
                </span>
                To modify room data, use the "Submit Update Request" tab. Your
                request will be reviewed by the Application Admin.
              </div>
            </div>
          </div>
        )}

        {/* Update Request Form */}
        {activeSection === "request" && (
          <div style={{ maxWidth: "560px" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#e2e8f0",
                marginBottom: "4px",
              }}
            >
              Submit Update Request
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: "13px",
                marginBottom: "20px",
              }}
            >
              Describe the data change you need. The Application Admin will
              review and approve your request.
            </p>

            {submitSuccess && (
              <div
                style={{
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  color: "#86efac",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                ✅ Your update request has been sent to Application Administer
                for approval.
              </div>
            )}

            <form
              onSubmit={handleSubmitRequest}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label htmlFor="update-data-type" style={labelStyle}>
                  DATA TYPE
                </label>
                <select
                  id="update-data-type"
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="stock_entry">Stock Entry</option>
                  <option value="room_info">Room Info</option>
                  <option value="item_info">Item Info</option>
                </select>
              </div>

              <div>
                <label htmlFor="update-description" style={labelStyle}>
                  DESCRIPTION
                </label>
                <textarea
                  id="update-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the change you need in detail..."
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "100px",
                  }}
                />
              </div>

              {submitError && (
                <div
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    color: "#fca5a5",
                    fontSize: "13px",
                  }}
                >
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                data-ocid="manager-panel.update-request.submit_button"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  border: "none",
                  color: "white",
                  borderRadius: "10px",
                  padding: "13px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  boxShadow: "0 6px 20px rgba(124,58,237,0.35)",
                  transition: "opacity 0.2s",
                }}
              >
                {submitting ? "Submitting..." : "Submit Update Request"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function ManagerPanelPage() {
  const { actor } = useActor();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<ApprovedUser | null>(null);

  const handleBack = () => {
    window.location.hash = "";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!userId || !password) {
      setError("Please enter your User ID and Password.");
      return;
    }
    if (!actor) {
      setError("Connection not ready. Please try again.");
      return;
    }
    setLoading(true);
    try {
      const user = await loginWithCredentialsFromBackend(
        actor,
        userId.trim(),
        password,
      );
      if (!user) {
        setError("Your account is pending administrative approval.");
        return;
      }
      if (user.role !== "Manager") {
        setError(
          "Access Denied. This account does not have Manager privileges.",
        );
        return;
      }
      if (user.status !== "active") {
        setError("Your account is pending administrative approval.");
        return;
      }
      setCurrentSession(user);
      setLoggedInUser(user);
    } catch {
      setError("Login failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearCurrentSession();
    setLoggedInUser(null);
    setUserId("");
    setPassword("");
    setError("");
    setShowRegistration(false);
  };

  // If logged in, show the manager dashboard
  if (loggedInUser) {
    return <ManagerDashboard user={loggedInUser} onLogout={handleLogout} />;
  }

  return (
    <div
      data-ocid="manager-panel.page"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(145deg, #1a0d2e 0%, #150a28 40%, #0a1628 100%)",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: "#e2e8f0",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: "4px",
          background: "linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)",
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
          background: "rgba(26,13,46,0.7)",
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
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
            }}
          >
            <span style={{ fontSize: "22px" }}>💼</span>
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
              Manager Access Panel
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
          data-ocid="manager-panel.back.button"
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
              background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.3)",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#7c3aed",
                display: "inline-block",
                boxShadow: "0 0 0 3px rgba(124,58,237,0.25)",
              }}
            />
            <span
              style={{
                color: "#c4b5fd",
                fontWeight: 700,
                fontSize: "12px",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              Manager Access
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
            Manager{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Operations
            </span>{" "}
            Center
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
            Monitor room-wise consumption, track staff activity, and submit
            daily operational reports from one central hub.
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
                    background: "rgba(124,58,237,0.15)",
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

          <div
            style={{
              marginTop: "24px",
              padding: "14px 16px",
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.2)",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                color: "#c4b5fd",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              ℹ️ Access Note
            </div>
            <div
              style={{ color: "#64748b", fontSize: "11px", lineHeight: 1.5 }}
            >
              Manager accounts must be approved by the Application Admin before
              first login. Contact admin for new account setup.
            </div>
          </div>
        </div>

        {/* Right: login form or registration */}
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
          {showRegistration ? (
            <RegistrationForm
              userRole="Manager"
              onBack={() => setShowRegistration(false)}
            />
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "18px",
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "30px",
                    margin: "0 auto 14px",
                    boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
                  }}
                >
                  💼
                </div>
                <h2
                  style={{
                    fontWeight: 800,
                    fontSize: "20px",
                    color: "#f1f5f9",
                    margin: "0 0 6px",
                  }}
                >
                  Manager Login
                </h2>
                <p style={{ color: "#64748b", fontSize: "13px" }}>
                  Enter your manager credentials to access the panel
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    htmlFor="manager-userid"
                    style={{
                      display: "block",
                      color: "#94a3b8",
                      fontSize: "12px",
                      fontWeight: 600,
                      marginBottom: "6px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    USER ID
                  </label>
                  <input
                    id="manager-userid"
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="e.g. CSM1025"
                    data-ocid="manager-panel.userid.input"
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
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label
                    htmlFor="manager-password"
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
                      id="manager-password"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      data-ocid="manager-panel.password.input"
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
                      autoComplete="current-password"
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
                    data-ocid="manager-panel.error_state"
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
                  data-ocid="manager-panel.login.submit_button"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    border: "none",
                    color: "white",
                    borderRadius: "10px",
                    padding: "13px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    boxShadow: "0 6px 20px rgba(124,58,237,0.35)",
                    transition: "opacity 0.2s",
                  }}
                >
                  {loading ? "Verifying..." : "Access Manager Panel"}
                </button>

                {/* Register link */}
                <div style={{ textAlign: "center", paddingTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setShowRegistration(true)}
                    data-ocid="manager-panel.register-link.button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#a78bfa",
                      fontSize: "13px",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: "4px",
                    }}
                  >
                    First time? Register here
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
