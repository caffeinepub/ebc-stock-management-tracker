import { useEffect, useRef, useState } from "react";
import { useActor } from "../../hooks/useActor";
import { useNotificationPoller } from "../../hooks/useNotificationPoller";
import { submitRegistrationToBackend } from "../../lib/backendRegistrationApi";
import { generateTempUserId } from "../../lib/registrationStore";
import { CorporateNotificationPopup } from "../shared/CorporateNotificationPopup";

interface RegistrationFormProps {
  userRole: "Manager" | "Supervisor";
  onBack: () => void;
}

type ContactType = "email" | "mobile";

const accentColor = {
  Manager: "#7c3aed",
  Supervisor: "#d97706",
} as const;

const accentColorLight = {
  Manager: "#a855f7",
  Supervisor: "#f59e0b",
} as const;

const accentGlow = {
  Manager: "rgba(124,58,237,0.35)",
  Supervisor: "rgba(217,119,6,0.35)",
} as const;

export function RegistrationForm({
  userRole: role,
  onBack,
}: RegistrationFormProps) {
  const { actor } = useActor();
  // Keep a ref to the latest actor so retry callbacks always use the freshest value
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  const [name, setName] = useState("");
  const [contactType, setContactType] = useState<ContactType>("email");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Track submitted contact for notification polling
  const [submittedContact, setSubmittedContact] = useState("");
  const { currentNotification, dismissNotification } =
    useNotificationPoller(submittedContact);

  const accent = accentColor[role];
  const accentLight = accentColorLight[role];
  const glow = accentGlow[role];

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

  // Helper: wait up to 15 seconds for actor to become available
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
        } else if (attempts >= 30) {
          // 30 x 500ms = 15 seconds max wait
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
      // Wait for actor to be ready (up to 20 seconds)
      const resolvedActor = await waitForActor();
      if (!resolvedActor) {
        setError(
          "Connection to server timed out. Please refresh the page and try again.",
        );
        setLoading(false);
        return;
      }

      const req = {
        // Use a unique ID combining timestamp + random suffix to prevent any collision
        id: `reg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        name: name.trim(),
        email: contactType === "email" ? email.trim() : "",
        mobile: contactType === "mobile" ? mobile.trim() : "",
        role,
      };

      // Retry up to 3 times in case of transient network errors
      let lastError: unknown = null;
      let submitted = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await submitRegistrationToBackend(resolvedActor, req);
          submitted = true;
          break;
        } catch (err) {
          lastError = err;
          // Wait 1 second before retrying
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      }

      if (!submitted) {
        throw lastError;
      }

      // Store contact key to poll for approval/rejection notification
      const contactKey = contactType === "email" ? email.trim() : mobile.trim();
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

  // Helper to fully reset all form state so another person can register immediately
  const resetFormForNextPerson = () => {
    setName("");
    setEmail("");
    setMobile("");
    setContactType("email");
    setError("");
    setSubmittedContact("");
    setShowSuccess(false);
  };

  // ── Success Modal ──────────────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <>
        {/* Corporate IT Notification Popup — polls for admin approval/rejection */}
        <CorporateNotificationPopup
          notification={currentNotification}
          onClose={dismissNotification}
        />
        <div
          data-ocid="registration.success.modal"
          style={{
            textAlign: "center",
            padding: "8px 0",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: `rgba(${role === "Manager" ? "124,58,237" : "217,119,6"},0.15)`,
              border: `2px solid ${accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              margin: "0 auto 20px",
              boxShadow: `0 0 24px ${glow}`,
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
            Request Submitted
          </h3>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "14px",
              lineHeight: 1.7,
              margin: "0 0 24px",
              padding: "0 4px",
            }}
          >
            Your registration request has been submitted to Application
            Administer for approval. You will receive your temporary login
            credentials once approved.
          </p>
          <div
            style={{
              background: `rgba(${role === "Manager" ? "124,58,237" : "217,119,6"},0.1)`,
              border: `1px solid rgba(${role === "Manager" ? "124,58,237" : "217,119,6"},0.25)`,
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "24px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                color: accentLight,
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              📋 Registration Details
            </div>
            <div
              style={{ color: "#64748b", fontSize: "12px", lineHeight: 1.6 }}
            >
              <strong style={{ color: "#94a3b8" }}>Name:</strong> {name}
              <br />
              <strong style={{ color: "#94a3b8" }}>Contact:</strong>{" "}
              {contactType === "email" ? email : mobile}
              <br />
              <strong style={{ color: "#94a3b8" }}>Role:</strong> {role}
            </div>
          </div>
          {/* Register another person button — resets form without navigating away */}
          <button
            type="button"
            onClick={resetFormForNextPerson}
            data-ocid="registration.success.register_another_button"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accentLight})`,
              border: "none",
              color: "white",
              borderRadius: "10px",
              padding: "13px 32px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: `0 6px 20px ${glow}`,
              width: "100%",
              marginBottom: "10px",
            }}
          >
            Register Another Person
          </button>
          <button
            type="button"
            onClick={onBack}
            data-ocid="registration.success.ok_button"
            style={{
              background: "none",
              border: `1px solid rgba(${role === "Manager" ? "124,58,237" : "217,119,6"},0.3)`,
              color: accentLight,
              borderRadius: "10px",
              padding: "11px 32px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
            }}
          >
            Back to Login
          </button>
        </div>
      </>
    );
  }

  // ── Registration Form ──────────────────────────────────────────────────────
  return (
    <>
      {/* Corporate IT Notification Popup — polls for admin approval/rejection */}
      <CorporateNotificationPopup
        notification={currentNotification}
        onClose={dismissNotification}
      />
      <div>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: `linear-gradient(135deg, ${accent}, ${accentLight})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              margin: "0 auto 14px",
              boxShadow: `0 8px 24px ${glow}`,
            }}
          >
            📝
          </div>
          <h2
            style={{
              fontWeight: 800,
              fontSize: "18px",
              color: "#f1f5f9",
              margin: "0 0 6px",
            }}
          >
            New {role} Registration
          </h2>
          <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
            Submit your details for admin approval
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {/* Full Name */}
          <div>
            <label htmlFor="reg-name" style={labelStyle}>
              FULL NAME
            </label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              data-ocid="registration.name.input"
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
              {(["email", "mobile"] as ContactType[]).map((type) => (
                <label
                  key={type}
                  data-ocid="registration.contact-type.radio"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background:
                      contactType === type
                        ? `rgba(${role === "Manager" ? "124,58,237" : "217,119,6"},0.15)`
                        : "rgba(255,255,255,0.04)",
                    border: `1px solid ${
                      contactType === type
                        ? `rgba(${role === "Manager" ? "124,58,237" : "217,119,6"},0.4)`
                        : "rgba(255,255,255,0.1)"
                    }`,
                    transition: "all 0.15s",
                    flex: 1,
                  }}
                >
                  <input
                    type="radio"
                    name="contactType"
                    value={type}
                    checked={contactType === type}
                    onChange={() => setContactType(type)}
                    style={{ accentColor: accent }}
                  />
                  <span
                    style={{
                      color: contactType === type ? accentLight : "#64748b",
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

          {/* Email or Mobile based on selection */}
          {contactType === "email" ? (
            <div>
              <label htmlFor="reg-email" style={labelStyle}>
                EMAIL ADDRESS
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                data-ocid="registration.email.input"
                style={inputStyle}
                autoComplete="email"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="reg-mobile" style={labelStyle}>
                MOBILE NUMBER
              </label>
              <input
                id="reg-mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
                data-ocid="registration.mobile.input"
                style={inputStyle}
                autoComplete="tel"
              />
            </div>
          )}

          {/* Role (read-only) */}
          <div>
            <div style={labelStyle}>ROLE</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "10px",
                background: `rgba(${role === "Manager" ? "124,58,237" : "217,119,6"},0.1)`,
                border: `1px solid rgba(${role === "Manager" ? "124,58,237" : "217,119,6"},0.25)`,
              }}
            >
              <span style={{ fontSize: "16px" }}>
                {role === "Manager" ? "💼" : "📋"}
              </span>
              <span
                style={{
                  color: accentLight,
                  fontWeight: 700,
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                {role}
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
            data-ocid="registration.submit_button"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accentLight})`,
              border: "none",
              color: "white",
              borderRadius: "10px",
              padding: "13px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: `0 6px 20px ${glow}`,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Submitting..." : "Submit Registration Request"}
          </button>

          {/* Back link */}
          <button
            type="button"
            onClick={onBack}
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
            ← Back to Login
          </button>
        </form>
      </div>
    </>
  );
}
