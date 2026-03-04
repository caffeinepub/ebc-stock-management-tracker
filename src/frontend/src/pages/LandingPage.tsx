import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogIn,
  Package,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// ─── Static imports – REQUIRED so the build pipeline keeps all 22 images ───
import photo01 from "/assets/generated/corporate-photo-01.dim_1920x1080.jpg";
import photo02 from "/assets/generated/corporate-photo-02.dim_1920x1080.jpg";
import photo03 from "/assets/generated/corporate-photo-03.dim_1920x1080.jpg";
import photo04 from "/assets/generated/corporate-photo-04.dim_1920x1080.jpg";
import photo05 from "/assets/generated/corporate-photo-05.dim_1920x1080.jpg";
import photo06 from "/assets/generated/corporate-photo-06.dim_1920x1080.jpg";
import photo07 from "/assets/generated/corporate-photo-07.dim_1920x1080.jpg";
import photo08 from "/assets/generated/corporate-photo-08.dim_1920x1080.jpg";
import photo09 from "/assets/generated/corporate-photo-09.dim_1920x1080.jpg";
import photo10 from "/assets/generated/corporate-photo-10.dim_1920x1080.jpg";
import photo11 from "/assets/generated/corporate-photo-11.dim_1920x1080.jpg";
import photo12 from "/assets/generated/corporate-photo-12.dim_1920x1080.jpg";
import photo13 from "/assets/generated/corporate-photo-13.dim_1920x1080.jpg";
import photo14 from "/assets/generated/corporate-photo-14.dim_1920x1080.jpg";
import photo15 from "/assets/generated/corporate-photo-15.dim_1920x1080.jpg";
import photo16 from "/assets/generated/corporate-photo-16.dim_1920x1080.jpg";
import photo17 from "/assets/generated/corporate-photo-17.dim_1920x1080.jpg";
import photo18 from "/assets/generated/corporate-photo-18.dim_1920x1080.jpg";
import photo19 from "/assets/generated/corporate-photo-19.dim_1920x1080.jpg";
import photo20 from "/assets/generated/corporate-photo-20.dim_1920x1080.jpg";
import photo21 from "/assets/generated/corporate-photo-21.dim_1920x1080.jpg";
import photo22 from "/assets/generated/corporate-photo-22.dim_1920x1080.jpg";

// ─── Gallery Data ────────────────────────────────────────────────────────────
const GALLERY_PHOTOS: {
  src: string;
  caption: string;
  fallbackColor: string;
}[] = [
  {
    src: photo01,
    caption: "Corporate Reception Lobby",
    fallbackColor: "#0f2640",
  },
  { src: photo02, caption: "Modern Conference Room", fallbackColor: "#0d2235" },
  {
    src: photo03,
    caption: "Catering Steward – Food Service",
    fallbackColor: "#1a2e1a",
  },
  {
    src: photo04,
    caption: "Steward Serving Coffee & Tea",
    fallbackColor: "#2a1a0a",
  },
  {
    src: photo05,
    caption: "Open-Plan Office Workspace",
    fallbackColor: "#1a1a2e",
  },
  { src: photo06, caption: "Business Team Meeting", fallbackColor: "#0d1a2a" },
  {
    src: photo07,
    caption: "Elegant Corporate Dining Room",
    fallbackColor: "#2a1e0d",
  },
  { src: photo08, caption: "Luxury Hotel Lobby", fallbackColor: "#1e1a2a" },
  {
    src: photo09,
    caption: "Corporate Event Hall & Stage",
    fallbackColor: "#0a1a2a",
  },
  {
    src: photo10,
    caption: "Premium Corporate Gift Hamper",
    fallbackColor: "#2a1a1a",
  },
  {
    src: photo11,
    caption: "Premium Chocolate Assortment",
    fallbackColor: "#1a0a0a",
  },
  {
    src: photo12,
    caption: "Assorted Premium Beverages",
    fallbackColor: "#0a1a1a",
  },
  {
    src: photo13,
    caption: "Millet Snacks & Health Food",
    fallbackColor: "#1a2a0a",
  },
  {
    src: photo14,
    caption: "Professional Stock Room",
    fallbackColor: "#1a1a1a",
  },
  {
    src: photo15,
    caption: "Corporate Executive Office",
    fallbackColor: "#0d1a30",
  },
  {
    src: photo16,
    caption: "Barista Preparing Coffee",
    fallbackColor: "#1a0d0a",
  },
  { src: photo17, caption: "Luxury Hotel Corridor", fallbackColor: "#1e1a0d" },
  { src: photo18, caption: "Premium Stationery Set", fallbackColor: "#0d0d1a" },
  {
    src: photo19,
    caption: "Corporate Outdoor Terrace",
    fallbackColor: "#0a1a0a",
  },
  {
    src: photo20,
    caption: "Corporate Building Exterior",
    fallbackColor: "#0a0d1a",
  },
  { src: photo21, caption: "Catering Buffet Spread", fallbackColor: "#1a1a0a" },
  {
    src: photo22,
    caption: "Corporate Award Ceremony",
    fallbackColor: "#1a0a1a",
  },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Live charts tracking stock usage across all conference rooms",
    accent: "#0369a1",
    bg: "#e0f2fe",
  },
  {
    icon: Shield,
    title: "Admin Approval Flow",
    desc: "Secure role-based access with admin-approved staff registration",
    accent: "#0891b2",
    bg: "#cffafe",
  },
  {
    icon: Package,
    title: "49-Item Catalogue",
    desc: "Pre-loaded gifts, chocolates, beverages, and stationery items",
    accent: "#7c3aed",
    bg: "#ede9fe",
  },
  {
    icon: Users,
    title: "Staff Management",
    desc: "Separate admin and staff dashboards with granular permissions",
    accent: "#059669",
    bg: "#d1fae5",
  },
];

const HIGHLIGHTS = [
  "Gifts & Chocolate Tracker",
  "Beverage & Snack Inventory",
  "Conference Room Management",
  "CSV Export Reports",
  "Approval-based Access",
];

// ─── Component ───────────────────────────────────────────────────────────────
export function LandingPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  const [activePhoto, setActivePhoto] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const startAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActivePhoto((prev) => (prev + 1) % GALLERY_PHOTOS.length);
    }, 4000);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: startAutoPlay is intentionally stable (ref-based, no deps)
  useEffect(() => {
    startAutoPlay();
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbsRef.current) {
      const thumb = thumbsRef.current.children[activePhoto] as HTMLElement;
      if (thumb)
        thumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
    }
  }, [activePhoto]);

  const goToPrev = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setActivePhoto(
      (prev) => (prev - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length,
    );
    startAutoPlay();
  };

  const goToNext = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setActivePhoto((prev) => (prev + 1) % GALLERY_PHOTOS.length);
    startAutoPlay();
  };

  const goToPhoto = (idx: number) => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setActivePhoto(idx);
    startAutoPlay();
  };

  const handleImgError = (idx: number) => {
    setImgErrors((prev) => ({ ...prev, [idx]: true }));
  };

  const progressPct = ((activePhoto + 1) / GALLERY_PHOTOS.length) * 100;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, #f0f7ff 0%, #ffffff 40%, #faf8ff 100%)",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: "#1e293b",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: "4px",
          background:
            "linear-gradient(90deg, #0369a1 0%, #0891b2 20%, #7c3aed 45%, #059669 70%, #d97706 100%)",
        }}
      />

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 32px",
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0369a1, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(3,105,161,0.35)",
            }}
          >
            <Package
              style={{ width: "22px", height: "22px", color: "white" }}
            />
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: "16px",
                letterSpacing: "-0.3px",
                lineHeight: 1.2,
                color: "#0f172a",
              }}
            >
              EBC Stock Management Tracker
            </div>
            <div
              style={{ color: "#64748b", fontSize: "11px", fontWeight: 500 }}
            >
              Enterprise Stock Platform
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="nav.login.button"
            style={{
              background: "linear-gradient(135deg, #0369a1, #0891b2)",
              border: "none",
              color: "white",
              borderRadius: "8px",
              padding: "8px 20px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(3,105,161,0.3)",
            }}
          >
            {isLoggingIn ? (
              <Loader2
                style={{ width: "13px", height: "13px" }}
                className="animate-spin"
              />
            ) : (
              <LogIn style={{ width: "13px", height: "13px" }} />
            )}
            Sign In
          </Button>
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "36px 24px 48px",
        }}
      >
        {/* Welcome Banner */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 22px",
              borderRadius: "50px",
              background: "linear-gradient(135deg, #dbeafe, #ede9fe)",
              border: "1px solid #bfdbfe",
              marginBottom: "18px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#0891b2",
                display: "inline-block",
                boxShadow: "0 0 0 3px rgba(8,145,178,0.2)",
              }}
            />
            <span
              style={{
                color: "#0369a1",
                fontWeight: 700,
                fontSize: "13px",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              Welcome to EBC Stock Management Tracker
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 900,
              lineHeight: 1.1,
              margin: "0 auto 14px",
              letterSpacing: "-0.5px",
              maxWidth: "700px",
              color: "#0f172a",
            }}
          >
            Corporate Stock{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #0369a1, #7c3aed, #059669)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Tracking
            </span>{" "}
            Made Enterprise-Ready
          </h1>
          <p
            style={{
              color: "#475569",
              fontSize: "16px",
              maxWidth: "540px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Manage gifts, chocolates, beverages and stationery across conference
            rooms with real-time tracking, analytics, and admin-controlled
            access.
          </p>
        </div>

        {/* ─── PHOTO GALLERY ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "52px" }}>
          {/* Gallery header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px" }}>📸</span>
              <span
                style={{
                  color: "#0f172a",
                  fontSize: "15px",
                  fontWeight: 700,
                  letterSpacing: "0.3px",
                }}
              >
                Our Facilities
              </span>
              <span
                style={{
                  background: "linear-gradient(135deg, #dbeafe, #ede9fe)",
                  border: "1px solid #bfdbfe",
                  color: "#0369a1",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 12px",
                  borderRadius: "20px",
                }}
              >
                {GALLERY_PHOTOS.length} Photos
              </span>
            </div>
            <span
              style={{ color: "#64748b", fontSize: "13px", fontWeight: 600 }}
            >
              {activePhoto + 1} / {GALLERY_PHOTOS.length}
            </span>
          </div>

          {/* ── Main carousel frame ──────────────────────────────────────────── */}
          <div
            style={{
              position: "relative",
              borderRadius: "20px",
              overflow: "hidden",
              height: "460px",
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
            }}
          >
            {GALLERY_PHOTOS.map((photo, idx) => (
              <div
                key={photo.src}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: idx === activePhoto ? 1 : 0,
                  transition: "opacity 0.6s ease-in-out",
                  zIndex: idx === activePhoto ? 2 : 1,
                  backgroundColor: photo.fallbackColor,
                }}
              >
                {!imgErrors[idx] ? (
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={() => handleImgError(idx)}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      gap: "12px",
                      background: `linear-gradient(135deg, ${photo.fallbackColor}cc, ${photo.fallbackColor})`,
                    }}
                  >
                    <div style={{ fontSize: "48px", opacity: 0.7 }}>🏢</div>
                    <span
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      {photo.caption}
                    </span>
                  </div>
                )}

                {/* Gradient overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)",
                    pointerEvents: "none",
                  }}
                />

                {/* Caption */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "22px",
                    left: "22px",
                    zIndex: 3,
                  }}
                >
                  <span
                    style={{
                      color: "white",
                      fontSize: "15px",
                      fontWeight: 700,
                      background: "rgba(0,0,0,0.4)",
                      backdropFilter: "blur(10px)",
                      padding: "6px 18px",
                      borderRadius: "30px",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    {photo.caption}
                  </span>
                </div>

                {/* Index badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "14px",
                    left: "14px",
                    zIndex: 3,
                    background: "linear-gradient(135deg, #0369a1, #7c3aed)",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "4px 12px",
                    borderRadius: "20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  }}
                >
                  {idx + 1} / {GALLERY_PHOTOS.length}
                </div>
              </div>
            ))}

            {/* Prev arrow */}
            <button
              type="button"
              onClick={goToPrev}
              data-ocid="gallery.pagination_prev"
              aria-label="Previous photo"
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: "46px",
                height: "46px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.6)",
                color: "#0f172a",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              }}
            >
              <ChevronLeft style={{ width: "20px", height: "20px" }} />
            </button>

            {/* Next arrow */}
            <button
              type="button"
              onClick={goToNext}
              data-ocid="gallery.pagination_next"
              aria-label="Next photo"
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: "46px",
                height: "46px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.6)",
                color: "#0f172a",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              }}
            >
              <ChevronRight style={{ width: "20px", height: "20px" }} />
            </button>

            {/* Progress bar */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "rgba(255,255,255,0.2)",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #0369a1, #7c3aed)",
                  width: `${progressPct}%`,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>

          {/* ── Thumbnail strip ──────────────────────────────────────────────── */}
          <div
            ref={thumbsRef}
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "14px",
              overflowX: "auto",
              paddingBottom: "6px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(3,105,161,0.3) transparent",
            }}
          >
            {GALLERY_PHOTOS.map((photo, idx) => (
              <button
                key={photo.src}
                type="button"
                onClick={() => goToPhoto(idx)}
                data-ocid={`gallery.item.${idx + 1}`}
                title={photo.caption}
                aria-label={`Go to photo ${idx + 1}: ${photo.caption}`}
                aria-pressed={idx === activePhoto}
                style={{
                  flexShrink: 0,
                  width: "96px",
                  height: "64px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border:
                    idx === activePhoto
                      ? "2.5px solid #0369a1"
                      : "2px solid #e2e8f0",
                  cursor: "pointer",
                  padding: 0,
                  backgroundColor: photo.fallbackColor,
                  boxShadow:
                    idx === activePhoto
                      ? "0 0 0 3px rgba(3,105,161,0.2), 0 4px 12px rgba(3,105,161,0.3)"
                      : "0 1px 4px rgba(0,0,0,0.08)",
                  transition:
                    "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
                  position: "relative",
                }}
              >
                {!imgErrors[idx] ? (
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={() => handleImgError(idx)}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `linear-gradient(135deg, ${photo.fallbackColor}, ${photo.fallbackColor}aa)`,
                      fontSize: "18px",
                    }}
                  >
                    🏢
                  </div>
                )}

                {/* Thumbnail number badge */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "2px",
                    left: 0,
                    right: 0,
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      color: "white",
                      fontSize: "9px",
                      fontWeight: 700,
                      background: "rgba(0,0,0,0.55)",
                      padding: "1px 5px",
                      borderRadius: "3px",
                    }}
                  >
                    {idx + 1}
                  </span>
                </div>

                {/* Active highlight overlay */}
                {idx === activePhoto && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(3,105,161,0.15)",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "11px",
              marginTop: "5px",
              textAlign: "right",
            }}
          >
            ← Scroll to browse all {GALLERY_PHOTOS.length} photos →
          </p>
        </div>

        {/* ─── Stats Row ───────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "14px",
            marginBottom: "44px",
          }}
        >
          {[
            {
              label: "Total Items",
              value: "49",
              color: "#0369a1",
              bg: "#dbeafe",
              border: "#93c5fd",
            },
            {
              label: "Categories",
              value: "4",
              color: "#7c3aed",
              bg: "#ede9fe",
              border: "#c4b5fd",
            },
            {
              label: "Facility Photos",
              value: String(GALLERY_PHOTOS.length),
              color: "#0891b2",
              bg: "#cffafe",
              border: "#67e8f9",
            },
            {
              label: "Access Levels",
              value: "2",
              color: "#059669",
              bg: "#d1fae5",
              border: "#6ee7b7",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: stat.bg,
                border: `1px solid ${stat.border}`,
                borderRadius: "14px",
                padding: "20px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  color: stat.color,
                  fontSize: "36px",
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  color: stat.color,
                  fontSize: "12px",
                  marginTop: "7px",
                  fontWeight: 700,
                  opacity: 0.75,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ─── Bottom: Highlights + CTA + Feature Cards ───────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "48px",
            alignItems: "start",
          }}
        >
          {/* Left column */}
          <div>
            <h2
              style={{
                fontSize: "23px",
                fontWeight: 800,
                marginBottom: "20px",
                letterSpacing: "-0.3px",
                color: "#0f172a",
              }}
            >
              Everything You Need to{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #0369a1, #7c3aed)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Manage Stock
              </span>
            </h2>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 28px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {HIGHLIGHTS.map((h) => (
                <li
                  key={h}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#334155",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  <CheckCircle2
                    style={{
                      width: "17px",
                      height: "17px",
                      color: "#059669",
                      flexShrink: 0,
                    }}
                  />
                  {h}
                </li>
              ))}
            </ul>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <Button
                onClick={login}
                disabled={isLoggingIn}
                data-ocid="hero.login.primary_button"
                style={{
                  background: "linear-gradient(135deg, #0369a1, #0891b2)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "14px 28px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 6px 24px rgba(3,105,161,0.35)",
                  justifyContent: "center",
                }}
              >
                {isLoggingIn ? (
                  <Loader2
                    style={{ width: "18px", height: "18px" }}
                    className="animate-spin"
                  />
                ) : (
                  <LogIn style={{ width: "18px", height: "18px" }} />
                )}
                {isLoggingIn ? "Connecting..." : "Login with Internet Identity"}
              </Button>

              <Button
                onClick={login}
                disabled={isLoggingIn}
                variant="outline"
                data-ocid="hero.register.secondary_button"
                style={{
                  background: "white",
                  color: "#0369a1",
                  border: "1.5px solid #bfdbfe",
                  borderRadius: "10px",
                  padding: "14px 28px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                Request Staff Access
                <ArrowRight style={{ width: "15px", height: "15px" }} />
              </Button>
            </div>

            <p
              style={{ color: "#94a3b8", fontSize: "12px", marginTop: "10px" }}
            >
              Staff access requires admin approval after registration
            </p>
          </div>

          {/* Right column: feature cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "white",
                  border: `1px solid ${f.bg}`,
                  borderRadius: "14px",
                  padding: "20px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: f.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                  }}
                >
                  <f.icon
                    style={{ width: "20px", height: "20px", color: f.accent }}
                  />
                </div>
                <div
                  style={{
                    color: "#0f172a",
                    fontWeight: 700,
                    fontSize: "13px",
                    marginBottom: "6px",
                  }}
                >
                  {f.title}
                </div>
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "11px",
                    lineHeight: 1.6,
                  }}
                >
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Corporate Access Panels ─────────────────────────────────────────── */}
      <div
        data-ocid="access-panels.section"
        style={{
          maxWidth: "1280px",
          margin: "0 auto 0",
          padding: "0 24px 64px",
        }}
      >
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 22px",
              borderRadius: "50px",
              background: "linear-gradient(135deg, #0f2044, #1a1060)",
              border: "1px solid rgba(59,130,246,0.3)",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#3b82f6",
                display: "inline-block",
                boxShadow: "0 0 0 3px rgba(59,130,246,0.3)",
              }}
            />
            <span
              style={{
                color: "#93c5fd",
                fontWeight: 700,
                fontSize: "12px",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Role-Based Access System
            </span>
          </div>
          <h2
            style={{
              fontSize: "clamp(22px, 3vw, 34px)",
              fontWeight: 900,
              margin: "0 0 10px",
              letterSpacing: "-0.4px",
              color: "#0f172a",
            }}
          >
            Corporate{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #0369a1, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Access Panels
            </span>
          </h2>
          <p
            style={{
              color: "#64748b",
              fontSize: "15px",
              maxWidth: "480px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Separate secure portals for each role. Select your access level
            below to proceed with independent authentication.
          </p>
        </div>

        {/* 4 access cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Card 1: Application Admin Panel */}
          <button
            type="button"
            onClick={() => {
              window.location.hash = "app-admin";
            }}
            data-ocid="access-panels.app-admin.button"
            style={{
              background:
                "linear-gradient(160deg, #0a1628 0%, #0f2044 60%, #1a1060 100%)",
              border: "1px solid rgba(59,130,246,0.25)",
              borderRadius: "20px",
              padding: "28px 24px",
              cursor: "pointer",
              textAlign: "left",
              color: "#e2e8f0",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(59,130,246,0.1)",
              transition:
                "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(-4px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 16px 48px rgba(0,0,0,0.2), 0 4px 16px rgba(59,130,246,0.25)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(59,130,246,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(59,130,246,0.1)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(59,130,246,0.25)";
            }}
          >
            {/* Glow effect */}
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "rgba(59,130,246,0.12)",
                filter: "blur(30px)",
                pointerEvents: "none",
              }}
            />
            {/* Icon */}
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                marginBottom: "18px",
                boxShadow: "0 6px 18px rgba(59,130,246,0.4)",
              }}
            >
              🛡️
            </div>
            <div style={{ marginBottom: "6px" }}>
              <span
                style={{
                  background: "rgba(59,130,246,0.2)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  color: "#93c5fd",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Full Access
              </span>
            </div>
            <h3
              style={{
                fontWeight: 800,
                fontSize: "18px",
                color: "#f1f5f9",
                margin: "8px 0 8px",
                letterSpacing: "-0.2px",
              }}
            >
              Application Admin Panel
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "13px",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Full monitoring, user approval management, role assignment and
              real-time data visibility.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "20px",
                color: "#93c5fd",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <span>Access Panel</span>
              <span style={{ fontSize: "16px" }}>→</span>
            </div>
          </button>

          {/* Card 2: Admin Login Panel */}
          <button
            type="button"
            onClick={() => {
              window.location.hash = "admin-login";
            }}
            data-ocid="access-panels.admin-login.button"
            style={{
              background:
                "linear-gradient(160deg, #0c1a14 0%, #0a2010 60%, #061a30 100%)",
              border: "1px solid rgba(5,150,105,0.25)",
              borderRadius: "20px",
              padding: "28px 24px",
              cursor: "pointer",
              textAlign: "left",
              color: "#e2e8f0",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(5,150,105,0.1)",
              transition:
                "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(-4px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 16px 48px rgba(0,0,0,0.2), 0 4px 16px rgba(5,150,105,0.25)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(5,150,105,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(5,150,105,0.1)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(5,150,105,0.25)";
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "rgba(5,150,105,0.12)",
                filter: "blur(30px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #059669, #0891b2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                marginBottom: "18px",
                boxShadow: "0 6px 18px rgba(5,150,105,0.4)",
              }}
            >
              🔐
            </div>
            <div style={{ marginBottom: "6px" }}>
              <span
                style={{
                  background: "rgba(5,150,105,0.2)",
                  border: "1px solid rgba(5,150,105,0.3)",
                  color: "#6ee7b7",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Admin Access
              </span>
            </div>
            <h3
              style={{
                fontWeight: 800,
                fontSize: "18px",
                color: "#f1f5f9",
                margin: "8px 0 8px",
                letterSpacing: "-0.2px",
              }}
            >
              Admin Login Panel
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "13px",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Secure login with dashboard overview, reports access and analytics
              for administrators.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "20px",
                color: "#6ee7b7",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <span>Access Panel</span>
              <span style={{ fontSize: "16px" }}>→</span>
            </div>
          </button>

          {/* Card 3: Manager Access Panel */}
          <button
            type="button"
            onClick={() => {
              window.location.hash = "manager";
            }}
            data-ocid="access-panels.manager.button"
            style={{
              background:
                "linear-gradient(160deg, #1a0d2e 0%, #150a28 60%, #0a1628 100%)",
              border: "1px solid rgba(124,58,237,0.25)",
              borderRadius: "20px",
              padding: "28px 24px",
              cursor: "pointer",
              textAlign: "left",
              color: "#e2e8f0",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(124,58,237,0.1)",
              transition:
                "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(-4px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 16px 48px rgba(0,0,0,0.2), 0 4px 16px rgba(124,58,237,0.25)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(124,58,237,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(124,58,237,0.1)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(124,58,237,0.25)";
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "rgba(124,58,237,0.12)",
                filter: "blur(30px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                marginBottom: "18px",
                boxShadow: "0 6px 18px rgba(124,58,237,0.4)",
              }}
            >
              💼
            </div>
            <div style={{ marginBottom: "6px" }}>
              <span
                style={{
                  background: "rgba(124,58,237,0.2)",
                  border: "1px solid rgba(124,58,237,0.3)",
                  color: "#c4b5fd",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Manager Access
              </span>
            </div>
            <h3
              style={{
                fontWeight: 800,
                fontSize: "18px",
                color: "#f1f5f9",
                margin: "8px 0 8px",
                letterSpacing: "-0.2px",
              }}
            >
              Manager Access Panel
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "13px",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Room-wise food consumption tracking, staff monitoring and daily
              report submission.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "20px",
                color: "#c4b5fd",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <span>Access Panel</span>
              <span style={{ fontSize: "16px" }}>→</span>
            </div>
          </button>

          {/* Card 4: Supervisor Access Panel */}
          <button
            type="button"
            onClick={() => {
              window.location.hash = "supervisor";
            }}
            data-ocid="access-panels.supervisor.button"
            style={{
              background:
                "linear-gradient(160deg, #0a1a10 0%, #0c1e18 60%, #0a1628 100%)",
              border: "1px solid rgba(217,119,6,0.25)",
              borderRadius: "20px",
              padding: "28px 24px",
              cursor: "pointer",
              textAlign: "left",
              color: "#e2e8f0",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(217,119,6,0.1)",
              transition:
                "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(-4px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 16px 48px rgba(0,0,0,0.2), 0 4px 16px rgba(217,119,6,0.25)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(217,119,6,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(217,119,6,0.1)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(217,119,6,0.25)";
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "rgba(217,119,6,0.12)",
                filter: "blur(30px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #d97706, #f59e0b)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                marginBottom: "18px",
                boxShadow: "0 6px 18px rgba(217,119,6,0.4)",
              }}
            >
              📋
            </div>
            <div style={{ marginBottom: "6px" }}>
              <span
                style={{
                  background: "rgba(217,119,6,0.2)",
                  border: "1px solid rgba(217,119,6,0.3)",
                  color: "#fcd34d",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Supervisor Access
              </span>
            </div>
            <h3
              style={{
                fontWeight: 800,
                fontSize: "18px",
                color: "#f1f5f9",
                margin: "8px 0 8px",
                letterSpacing: "-0.2px",
              }}
            >
              Supervisor Access Panel
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "13px",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Live service updates, stock entry management and real-time task
              status updates.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "20px",
                color: "#fcd34d",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <span>Access Panel</span>
              <span style={{ fontSize: "16px" }}>→</span>
            </div>
          </button>
        </div>

        {/* Security note bar */}
        <div
          style={{
            marginTop: "24px",
            padding: "14px 20px",
            background:
              "linear-gradient(135deg, rgba(15,32,68,0.6), rgba(26,16,96,0.4))",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "18px" }}>🔒</span>
          <div style={{ color: "#64748b", fontSize: "12px", lineHeight: 1.5 }}>
            <span style={{ color: "#93c5fd", fontWeight: 700 }}>
              Security Notice:{" "}
            </span>
            Each panel maintains independent authentication. Cross-role access
            is strictly prohibited. All login attempts are logged for security
            compliance.
          </div>
        </div>
      </div>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid #e2e8f0",
          padding: "18px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "white",
          marginTop: "32px",
        }}
      >
        <div style={{ color: "#64748b", fontSize: "13px" }}>
          © {new Date().getFullYear()} EBC Stock Management Tracker —{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#0369a1",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Built with ❤️ on caffeine.ai
          </a>
        </div>
        <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 500 }}>
          Secure · Enterprise-Ready · ICP Powered
        </div>
      </footer>
    </div>
  );
}
