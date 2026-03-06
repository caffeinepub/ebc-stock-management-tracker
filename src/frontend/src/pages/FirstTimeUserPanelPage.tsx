import { useEffect, useRef, useState } from "react";
import { CorporateNotificationPopup } from "../components/shared/CorporateNotificationPopup";
import { useActor } from "../hooks/useActor";
import { useNotificationPoller } from "../hooks/useNotificationPoller";
import { submitRegistrationToBackend } from "../lib/backendRegistrationApi";

const FEATURES = [
  {
    icon: "🆔",
    label: "Instant Registration",
    desc: "Submit your registration request in seconds. Admin will review and approve.",
  },
  {
    icon: "🔑",
    label: "Auto Credentials",
    desc: "After approval, you receive a unique User ID and temporary password.",
  },
  {
    icon: "📱",
    label: "Multi-Device Access",
    desc: "Access the system from any phone, laptop, or PC after approval.",
  },
  {
    icon: "🛡️",
    label: "Secure Onboarding",
    desc: "Corporate IT-grade security with admin-controlled access management.",
  },
];

// Generate a truly unique ID using available browser APIs
function generateUniqueId(prefix: string): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}_${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  // Fallback: timestamp + random
  const ts = Date.now();
  const rand1 = Math.random().toString(36).slice(2, 9);
  const rand2 = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${ts}_${rand1}${rand2}`;
}

export function FirstTimeUserPanelPage() {
  const { actor } = useActor();
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  const [name, setName] = useState("");
  const [contactType, setContactType] = useState<"email" | "mobile">("email");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [submittedContact, setSubmittedContact] = useState("");

  const { currentNotification, dismissNotification } =
    useNotificationPoller(submittedContact);

  const handleBack = () => {
    window.location.hash = "";
  };

  // Wait up to 40 seconds for actor
  const waitForActor = (): Promise<typeof actor> => {
    return new Promise((resolve) => {
      if (actorRef.current) {
        resolve(actorRef.current);
        return;
      }
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (actorRef.current) {
          clearInterval(interval);
          resolve(actorRef.current);
        } else if (attempts >= 80) {
          clearInterval(interval);
          resolve(null);
        }
      }, 500);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (contactType === "email" && !email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (contactType === "mobile" && !mobile.trim()) {
      setError("Mobile number is required.");
      return;
    }

    setLoading(true);
    try {
      const resolvedActor = await waitForActor();
      if (!resolvedActor) {
        setError(
          "Connection to server timed out. Please refresh the page and try again.",
        );
        setLoading(false);
        return;
      }

      const req = {
        // Unique ID: prefix + timestamp + crypto random
        id: generateUniqueId("ftu"),
        name: name.trim(),
        email: contactType === "email" ? email.trim() : "",
        mobile: contactType === "mobile" ? mobile.trim() : "",
        role: "First Time User",
      };

      // Retry up to 5 times
      let lastError: unknown = null;
      let submitted = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await submitRegistrationToBackend(resolvedActor, req);
          submitted = true;
          break;
        } catch (err) {
          lastError = err;
          if (attempt < 4) {
            await new Promise((r) => setTimeout(r, 2000));
            const freshActor = actorRef.current;
            if (freshActor && freshActor !== resolvedActor) {
              try {
                await submitRegistrationToBackend(freshActor, req);
                submitted = true;
                break;
              } catch {
                // continue
              }
            }
          }
        }
      }

      if (!submitted) {
        throw lastError;
      }

      const contactKey = contactType === "email" ? email.trim() : mobile.trim();
      setSubmittedName(name.trim());
      setSubmittedContact(contactKey);
      setShowSuccess(true);
    } catch {
      setError(
        "Failed to submit request. Please check your internet connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForAnother = () => {
    setName("");
    setEmail("");
    setMobile("");
    setContactType("email");
    setError("");
    setSubmittedContact("");
    setShowSuccess(false);
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
      data-ocid="first-time-user.page"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(145deg, #0a1628 0%, #0c2010 40%, #0f1a30 100%)",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: "#e2e8f0",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: "4px",
          background: "linear-gradient(90deg, #0891b2, #059669, #10b981)",
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
              background: "linear-gradient(135deg, #0891b2, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(8,145,178,0.4)",
            }}
          >
            <span style={{ fontSize: "22px" }}>🆕</span>
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
              First Time User Registration
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
          data-ocid="first-time-user.back.button"
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
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 18px",
              borderRadius: "50px",
              background: "rgba(8,145,178,0.15)",
              border: "1px solid rgba(8,145,178,0.3)",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#0891b2",
                display: "inline-block",
                boxShadow: "0 0 0 3px rgba(8,145,178,0.25)",
              }}
            />
            <span
              style={{
                color: "#67e8f9",
                fontWeight: 700,
                fontSize: "12px",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              New User Access
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
            Register as{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #0891b2, #059669)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              First Time User
            </span>
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
            Submit your registration request to the Application Admin. Once
            approved, you will receive your personal User ID and temporary
            password to access the system.
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
                    background: "rgba(8,145,178,0.15)",
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

        {/* Right: registration form */}
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
          {/* Corporate Notification Popup */}
          <CorporateNotificationPopup
            notification={currentNotification}
            onClose={dismissNotification}
          />

          {showSuccess ? (
            /* ── Success State ── */
            <div
              data-ocid="first-time-user.success.modal"
              style={{ textAlign: "center", padding: "8px 0" }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "rgba(8,145,178,0.15)",
                  border: "2px solid #0891b2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  margin: "0 auto 20px",
                  boxShadow: "0 0 24px rgba(8,145,178,0.35)",
                }}
              >
                ✅
              </div>
              <h3
                style={{
                  fontWeight: 800,
                  fontSize: "18px",
                  color: "#f1f5f9",
                  margin: "0 0 12px",
                }}
              >
                Registration Request Submitted
              </h3>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  margin: "0 0 20px",
                  padding: "0 4px",
                }}
              >
                Your registration request has been submitted to Application
                Administer for approval. You will receive your temporary login
                credentials once approved.
              </p>
              <div
                style={{
                  background: "rgba(8,145,178,0.1)",
                  border: "1px solid rgba(8,145,178,0.25)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "24px",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    color: "#67e8f9",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  📋 Registration Details
                </div>
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "12px",
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ color: "#94a3b8" }}>Name:</strong>{" "}
                  {submittedName}
                  <br />
                  <strong style={{ color: "#94a3b8" }}>Contact:</strong>{" "}
                  {submittedContact}
                  <br />
                  <strong style={{ color: "#94a3b8" }}>Role:</strong> First Time
                  User
                  <br />
                  <strong style={{ color: "#94a3b8" }}>Status:</strong>{" "}
                  <span style={{ color: "#fcd34d" }}>Pending Approval</span>
                </div>
              </div>
              <button
                type="button"
                onClick={resetForAnother}
                data-ocid="first-time-user.success.register_another_button"
                style={{
                  background: "linear-gradient(135deg, #0891b2, #059669)",
                  border: "none",
                  color: "white",
                  borderRadius: "10px",
                  padding: "13px 32px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(8,145,178,0.35)",
                  width: "100%",
                  marginBottom: "10px",
                }}
              >
                Register Another Person
              </button>
              <button
                type="button"
                onClick={handleBack}
                data-ocid="first-time-user.success.back_button"
                style={{
                  background: "none",
                  border: "1px solid rgba(8,145,178,0.3)",
                  color: "#67e8f9",
                  borderRadius: "10px",
                  padding: "11px 32px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Back to Home
              </button>
            </div>
          ) : (
            /* ── Registration Form ── */
            <>
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "18px",
                    background: "linear-gradient(135deg, #0891b2, #059669)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "30px",
                    margin: "0 auto 14px",
                    boxShadow: "0 8px 24px rgba(8,145,178,0.4)",
                  }}
                >
                  🆕
                </div>
                <h2
                  style={{
                    fontWeight: 800,
                    fontSize: "20px",
                    color: "#f1f5f9",
                    margin: "0 0 6px",
                  }}
                >
                  New User Registration
                </h2>
                <p style={{ color: "#64748b", fontSize: "13px" }}>
                  Submit your details for admin approval
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Full Name */}
                <div>
                  <label htmlFor="ftu-name" style={labelStyle}>
                    FULL NAME
                  </label>
                  <input
                    id="ftu-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    data-ocid="first-time-user.name.input"
                    style={inputStyle}
                    autoComplete="name"
                  />
                </div>

                {/* Contact Type Toggle */}
                <div>
                  <div style={{ ...labelStyle, marginBottom: "10px" }}>
                    CONTACT METHOD
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    {(["email", "mobile"] as const).map((type) => (
                      <label
                        key={type}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          background:
                            contactType === type
                              ? "rgba(8,145,178,0.15)"
                              : "rgba(255,255,255,0.04)",
                          border: `1px solid ${
                            contactType === type
                              ? "rgba(8,145,178,0.4)"
                              : "rgba(255,255,255,0.1)"
                          }`,
                          transition: "all 0.15s",
                          flex: 1,
                        }}
                      >
                        <input
                          type="radio"
                          name="ftu-contactType"
                          value={type}
                          checked={contactType === type}
                          onChange={() => setContactType(type)}
                          style={{ accentColor: "#0891b2" }}
                        />
                        <span
                          style={{
                            color: contactType === type ? "#67e8f9" : "#64748b",
                            fontSize: "13px",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {type === "email" ? "Email" : "Mobile Number"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Email or Mobile */}
                {contactType === "email" ? (
                  <div>
                    <label htmlFor="ftu-email" style={labelStyle}>
                      EMAIL ADDRESS
                    </label>
                    <input
                      id="ftu-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@company.com"
                      data-ocid="first-time-user.email.input"
                      style={inputStyle}
                      autoComplete="email"
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="ftu-mobile" style={labelStyle}>
                      MOBILE NUMBER
                    </label>
                    <input
                      id="ftu-mobile"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                      data-ocid="first-time-user.mobile.input"
                      style={inputStyle}
                      autoComplete="tel"
                    />
                  </div>
                )}

                {/* Role display */}
                <div>
                  <div style={labelStyle}>ROLE</div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 16px",
                      borderRadius: "10px",
                      background: "rgba(8,145,178,0.1)",
                      border: "1px solid rgba(8,145,178,0.25)",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>🆕</span>
                    <span
                      style={{
                        color: "#67e8f9",
                        fontWeight: 700,
                        fontSize: "13px",
                        letterSpacing: "0.5px",
                      }}
                    >
                      First Time User
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        color: "#475569",
                        fontSize: "11px",
                      }}
                    >
                      Pre-assigned
                    </span>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div
                    data-ocid="first-time-user.error_state"
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

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  data-ocid="first-time-user.submit_button"
                  style={{
                    background: "linear-gradient(135deg, #0891b2, #059669)",
                    border: "none",
                    color: "white",
                    borderRadius: "10px",
                    padding: "13px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    boxShadow: "0 6px 20px rgba(8,145,178,0.35)",
                    transition: "opacity 0.2s",
                  }}
                >
                  {loading ? "Submitting..." : "Submit Registration Request"}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontSize: "13px",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: "4px",
                  }}
                >
                  ← Back to Home
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
