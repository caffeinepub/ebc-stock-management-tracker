// ─── CorporateNotificationPopup.tsx ─────────────────────────────────────────
// Full-screen modal popup for corporate IT-style notifications.
// Matches the existing dark glassmorphism aesthetic of the app.

import { useState } from "react";
import { toast } from "sonner";
import type { Notification } from "../../backend.d";

interface CorporateNotificationPopupProps {
  notification: Notification | null;
  onClose: () => void;
}

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "20px",
};

export function CorporateNotificationPopup({
  notification,
  onClose,
}: CorporateNotificationPopupProps) {
  const [copied, setCopied] = useState(false);

  if (!notification) return null;

  const isApproved =
    notification.notificationType === "registration_approved" ||
    notification.notificationType === "booking_approved";

  const isRegistration =
    notification.notificationType === "registration_approved" ||
    notification.notificationType === "registration_rejected";

  const hasCredentials =
    notification.credentialsUserId &&
    notification.credentialsUserId.length > 0 &&
    notification.credentialsPassword &&
    notification.credentialsPassword.length > 0;

  const accentColor = isApproved ? "#6ee7b7" : "#fca5a5";
  const accentBg = isApproved ? "rgba(5,150,105,0.15)" : "rgba(220,38,38,0.15)";
  const accentBorder = isApproved
    ? "rgba(5,150,105,0.4)"
    : "rgba(220,38,38,0.4)";

  const handleCopyCredentials = () => {
    const text = `User ID: ${notification.credentialsUserId}\nPassword: ${notification.credentialsPassword}`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        toast.success("Credentials copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy credentials"));
  };

  return (
    <div
      data-ocid="corp-notification.modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.85)",
        padding: "24px",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          ...glass,
          maxWidth: "560px",
          width: "100%",
          padding: "36px 32px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
          maxHeight: "90vh",
          overflowY: "auto",
          background:
            "linear-gradient(145deg, rgba(10,22,40,0.95), rgba(15,32,68,0.95), rgba(26,16,96,0.9))",
        }}
      >
        {/* Icon + Title */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: accentBg,
              border: `1px solid ${accentBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "28px",
            }}
          >
            {isApproved ? "✅" : "❌"}
          </div>

          {/* Top label */}
          <div
            style={{
              display: "inline-block",
              padding: "3px 12px",
              borderRadius: "20px",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "1px",
              textTransform: "uppercase",
              background: isApproved
                ? "rgba(5,150,105,0.12)"
                : "rgba(220,38,38,0.12)",
              color: accentColor,
              border: `1px solid ${accentBorder}`,
              marginBottom: "10px",
            }}
          >
            {isRegistration
              ? "Corporate IT System — Registration"
              : "Corporate Facility Management"}
          </div>

          <h2
            style={{
              color: accentColor,
              fontWeight: 800,
              fontSize: "17px",
              margin: "0 0 4px",
              letterSpacing: "0.2px",
            }}
          >
            {notification.title}
          </h2>
          <div
            style={{
              color: "#64748b",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            EBC Stock Management Tracker · Corporate IT Division
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.08)",
            margin: "0 0 20px",
          }}
        />

        {/* Message body */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              color: "#94a3b8",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "3px",
                height: "14px",
                borderRadius: "2px",
                background: accentColor,
              }}
            />
            Official Communication
          </div>
          <p
            style={{
              color: "#e2e8f0",
              fontSize: "13px",
              lineHeight: 1.9,
              margin: 0,
              whiteSpace: "pre-line",
            }}
          >
            {notification.message}
          </p>
        </div>

        {/* Credentials section (registration_approved only) */}
        {hasCredentials && (
          <div
            style={{
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: "12px",
              padding: "18px 20px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                color: "#93c5fd",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.7px",
                textTransform: "uppercase",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              🔐 Your Login Credentials
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  User ID
                </div>
                <div
                  style={{
                    color: "#f1f5f9",
                    fontWeight: 800,
                    fontSize: "15px",
                    fontFamily: "monospace",
                    letterSpacing: "0.5px",
                  }}
                >
                  {notification.credentialsUserId}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  Temp Password
                </div>
                <div
                  style={{
                    color: "#f1f5f9",
                    fontWeight: 800,
                    fontSize: "15px",
                    fontFamily: "monospace",
                    letterSpacing: "0.5px",
                  }}
                >
                  {notification.credentialsPassword}
                </div>
              </div>
            </div>
            <button
              type="button"
              data-ocid="corp-notification.copy-credentials.button"
              onClick={handleCopyCredentials}
              style={{
                width: "100%",
                background: copied
                  ? "rgba(5,150,105,0.2)"
                  : "rgba(59,130,246,0.15)",
                border: `1px solid ${copied ? "rgba(5,150,105,0.4)" : "rgba(59,130,246,0.3)"}`,
                borderRadius: "8px",
                color: copied ? "#6ee7b7" : "#93c5fd",
                fontSize: "12px",
                fontWeight: 700,
                padding: "10px 16px",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.3px",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              {copied ? "✅ Copied!" : "📋 Copy Credentials"}
            </button>
          </div>
        )}

        {/* Footer note */}
        <div
          style={{
            color: "#475569",
            fontSize: "11px",
            marginBottom: "20px",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          This is an automated communication from the EBC Corporate IT Division.
          <br />
          Please keep this information confidential.
        </div>

        {/* Close button */}
        <button
          type="button"
          data-ocid="corp-notification.close_button"
          onClick={onClose}
          style={{
            width: "100%",
            background: isApproved
              ? "linear-gradient(135deg, #065f46, #059669)"
              : "linear-gradient(135deg, #7f1d1d, #dc2626)",
            border: "none",
            borderRadius: "10px",
            color: "white",
            fontWeight: 800,
            fontSize: "14px",
            padding: "13px 24px",
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.5px",
            boxShadow: isApproved
              ? "0 4px 16px rgba(5,150,105,0.3)"
              : "0 4px 16px rgba(220,38,38,0.3)",
            transition: "transform 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Acknowledged — Close
        </button>
      </div>
    </div>
  );
}
