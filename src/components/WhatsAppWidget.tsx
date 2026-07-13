import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

interface PublicConfig {
  whatsappNumber: string;
  whatsappLink: string;
  supportEmail: string;
  brandName: string;
}

/**
 * Floating WhatsApp Chat Widget
 *
 * • Fixed bottom-right corner on all customer pages
 * • Loads WhatsApp business number dynamically from /api/config/public
 * • Opens wa.me deep-link with a pre-filled greeting message
 * • Smooth open/close animation using CSS transitions
 * • Fully responsive (desktop + mobile)
 * • Does NOT contain any booking logic — that lives in the Spring Boot webhook
 */
export const WhatsAppWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBounced, setHasBounced] = useState(false);

  // Load backend config once on mount
  useEffect(() => {
    fetch(`${API_BASE}/config/public`)
      .then((r) => r.json())
      .then((data: PublicConfig) => setConfig(data))
      .catch(() => {
        // Fallback to defaults if backend is unreachable
        setConfig({
          whatsappNumber: "+919035999800",
          whatsappLink: "https://wa.me/919035999800",
          supportEmail: "support@vazraamobility.com",
          brandName: "Vazraa Mobility",
        });
      });

    // Delay appearance for a polished entrance
    const timer = setTimeout(() => setIsVisible(true), 1200);
    // Gentle attention bounce after 4s if user hasn't interacted
    const bounceTimer = setTimeout(() => setHasBounced(true), 4000);
    return () => {
      clearTimeout(timer);
      clearTimeout(bounceTimer);
    };
  }, []);

  const handleStartChat = useCallback(() => {
    if (!config) return;
    const greeting = encodeURIComponent(
      "Hi! I would like to book a cab with Vazraa Mobility. 🚖",
    );
    window.open(
      `${config.whatsappLink}?text=${greeting}`,
      "_blank",
      "noopener,noreferrer",
    );
    setIsOpen(false);
  }, [config]);

  if (!isVisible) return null;

  return (
    <>
      {/* === Popup Card === */}
      <div
        aria-label="WhatsApp Chat Widget"
        style={{
          position: "fixed",
          bottom: "7rem",
          right: "1.25rem",
          zIndex: 9999,
          width: "17rem",
          borderRadius: "1.25rem",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
          transformOrigin: "bottom right",
          transform: isOpen ? "scale(1)" : "scale(0)",
          opacity: isOpen ? 1 : 0,
          transition:
            "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease",
          pointerEvents: isOpen ? "all" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #128C7E 0%, #25D366 100%)",
            padding: "1rem 1rem 0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            position: "relative",
          }}
        >
          {/* WhatsApp Icon */}
          <div
            style={{
              width: "2.75rem",
              height: "2.75rem",
              borderRadius: "0.85rem",
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <WhatsAppSvgIcon size={28} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.875rem",
                lineHeight: 1.3,
              }}
            >
              {config?.brandName ?? "Vazraa Mobility"}
            </p>
            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.85)",
                fontSize: "0.7rem",
                fontWeight: 500,
                marginTop: "0.1rem",
              }}
            >
              Need help? Chat with us on WhatsApp
            </p>
            {/* Online indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                marginTop: "0.25rem",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#a7f3d0",
                  boxShadow: "0 0 0 2px rgba(167,243,208,0.4)",
                  animation: "wa-pulse 1.8s infinite",
                }}
              />
              <span
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                }}
              >
                Online · Typically replies instantly
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            aria-label="Close WhatsApp chat widget"
            onClick={() => setIsOpen(false)}
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              width: "1.6rem",
              height: "1.6rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.3)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
            }
          >
            <X size={13} color="#fff" />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            backgroundColor: "#ece5dd",
            padding: "0.85rem 1rem",
          }}
        >
          {/* Chat bubble */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "0 0.75rem 0.75rem 0.75rem",
              padding: "0.65rem 0.75rem",
              fontSize: "0.78rem",
              lineHeight: 1.5,
              color: "#333",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              maxWidth: "85%",
              marginBottom: "0.65rem",
            }}
          >
            👋 Hi! Need a cab in Karnataka?
            <br />
            Tap below to start booking instantly via WhatsApp!
          </div>
        </div>

        {/* CTA Footer */}
        <div style={{ backgroundColor: "#f0f0f0", padding: "0.75rem 1rem" }}>
          <button
            id="wa-start-chat-btn"
            aria-label="Start WhatsApp chat"
            onClick={handleStartChat}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #128C7E 0%, #25D366 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.65rem 1rem",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "filter 0.15s, transform 0.1s",
              letterSpacing: "0.02em",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.filter = "brightness(1.1)")
            }
            onMouseOut={(e) => (e.currentTarget.style.filter = "brightness(1)")}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.97)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <WhatsAppSvgIcon size={16} color="#fff" />
            Start Chat on WhatsApp
          </button>
          <p
            style={{
              margin: "0.4rem 0 0",
              textAlign: "center",
              fontSize: "0.6rem",
              color: "#888",
              lineHeight: 1.4,
            }}
          >
            Book a cab, check fare, or get support
          </p>
        </div>
      </div>

      {/* === Floating Trigger Button === */}
      <button
        id="wa-floating-btn"
        aria-label="Chat on WhatsApp"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setHasBounced(false);
        }}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "5.5rem", // offset left of the SOS button in CustomerLayout
          zIndex: 9999,
          width: "3.4rem",
          height: "3.4rem",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #128C7E 0%, #25D366 100%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(37,211,102,0.55)",
          transition:
            "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s",
          animation:
            hasBounced && !isOpen
              ? "wa-attention 0.6s ease-in-out 2"
              : undefined,
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.12)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(37,211,102,0.7)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,211,102,0.55)";
        }}
      >
        {isOpen ? (
          <X size={20} color="#fff" />
        ) : (
          <WhatsAppSvgIcon size={22} color="#fff" />
        )}

        {/* Notification pulse ring */}
        {!isOpen && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid rgba(37,211,102,0.6)",
              animation: "wa-ring 2.5s ease-out infinite",
              pointerEvents: "none",
            }}
          />
        )}
      </button>

      {/* === Inline Keyframes === */}
      <style>{`
        @keyframes wa-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes wa-ring {
          0%   { transform: scale(1);   opacity: 0.8; }
          80%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes wa-attention {
          0%, 100% { transform: translateY(0); }
          25%      { transform: translateY(-8px); }
          75%      { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
};

// ─── Inline WhatsApp SVG logo ─────────────────────────────────────────────────
// Uses the official WhatsApp brand path — no external dependency needed.
const WhatsAppSvgIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = "#fff",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    width={size}
    height={size}
    fill={color}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.56 2.15 7.97L.5 31.5l7.73-2.14A15.5 15.5 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28.3a12.8 12.8 0 0 1-6.53-1.8l-.47-.27-4.59 1.27 1.28-4.47-.31-.48A12.8 12.8 0 1 1 16 28.8zm7.03-9.6c-.38-.19-2.26-1.11-2.61-1.24-.35-.13-.61-.19-.87.19-.26.38-1 1.24-1.22 1.5-.22.25-.44.28-.82.1-.38-.19-1.61-.6-3.06-1.9-1.13-1.01-1.9-2.26-2.12-2.64-.22-.38-.02-.58.16-.77.17-.17.38-.44.57-.66.19-.22.25-.38.38-.63.13-.25.06-.47-.03-.66-.1-.19-.87-2.1-1.19-2.87-.31-.75-.63-.65-.87-.66l-.74-.01c-.25 0-.66.1-1.01.47-.35.38-1.32 1.29-1.32 3.14 0 1.85 1.35 3.63 1.54 3.88.19.25 2.66 4.06 6.44 5.69.9.39 1.6.62 2.15.8.9.28 1.73.24 2.38.15.73-.11 2.26-.92 2.57-1.82.32-.9.32-1.67.22-1.82-.09-.16-.35-.25-.73-.44z" />
  </svg>
);

export default WhatsAppWidget;
