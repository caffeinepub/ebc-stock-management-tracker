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

const FEATURES = [
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Live charts tracking stock usage across all conference rooms",
    accent: "#3b82f6",
  },
  {
    icon: Shield,
    title: "Admin Approval Flow",
    desc: "Secure role-based access with admin-approved staff registration",
    accent: "#06b6d4",
  },
  {
    icon: Package,
    title: "49-Item Catalogue",
    desc: "Pre-loaded gifts, chocolates, beverages, and stationery items",
    accent: "#8b5cf6",
  },
  {
    icon: Users,
    title: "Staff Management",
    desc: "Separate admin and staff dashboards with granular permissions",
    accent: "#10b981",
  },
];

const HIGHLIGHTS = [
  "Gifts & Chocolate Tracker",
  "Beverage & Snack Inventory",
  "Conference Room Management",
  "CSV Export Reports",
  "Approval-based Access",
];

// ALL 22 PHOTOS - verified paths
const GALLERY_PHOTOS = [
  {
    src: "/assets/generated/corporate-reception-welcome.dim_800x500.jpg",
    caption: "Corporate Reception",
  },
  {
    src: "/assets/generated/steward-serving-food.dim_800x500.jpg",
    caption: "Food Service",
  },
  {
    src: "/assets/generated/steward-coffee-serving.dim_800x500.jpg",
    caption: "Coffee & Beverages",
  },
  {
    src: "/assets/uploads/a35130edc8113b0b747ed58f84fa3f8c-1.jpg",
    caption: "Analytics Meeting",
  },
  {
    src: "/assets/uploads/f1ab4e987c10c6a805c8292b83620e49-2.jpg",
    caption: "Hotel Reception",
  },
  {
    src: "/assets/uploads/ba1827c7d0547371f27c8f379188d925-3.jpg",
    caption: "Front Desk",
  },
  {
    src: "/assets/uploads/fe527d8561ded99212cb42b5b313bc1b-4.jpg",
    caption: "Fine Dining",
  },
  {
    src: "/assets/uploads/2f75b4e0f037ca186c1efa418f124544-5.jpg",
    caption: "Restaurant",
  },
  {
    src: "/assets/uploads/e1ab939c3419223e362707abfad25362-6.jpg",
    caption: "Conference Room",
  },
  {
    src: "/assets/uploads/918e6d9a5d992d5b249ea39d7dc21f93-1.jpg",
    caption: "Corporate Meeting",
  },
  {
    src: "/assets/uploads/caf0639252273c4d59ab442b56c3439e-2.jpg",
    caption: "Business Event",
  },
  {
    src: "/assets/uploads/3a97e432077c584da3c5cc96c50e2a42-3.jpg",
    caption: "Office Setup",
  },
  {
    src: "/assets/uploads/3fb97264e0c85024108afeb78301f75b-4.jpg",
    caption: "Staff Service",
  },
  {
    src: "/assets/uploads/f304902a3cf36bd93b1a30f2de0668d8-5.jpg",
    caption: "Hospitality",
  },
  {
    src: "/assets/uploads/bdcccc48aad3dc39ca9abbe1681dc6f8-6.jpg",
    caption: "Corporate Dining",
  },
  {
    src: "/assets/uploads/96ae48f6901a48d4e006fe0fb4995d86-7.jpg",
    caption: "Meeting Room",
  },
  {
    src: "/assets/uploads/d190d1185f5c06012534cdbd79d2f5a8-8.jpg",
    caption: "Executive Suite",
  },
  {
    src: "/assets/uploads/66dcc379d9beae160be9d5ba7e0418f3-9.jpg",
    caption: "Event Setup",
  },
  {
    src: "/assets/uploads/5d0f9f5a963897972fe092e96daff47e-10.jpg",
    caption: "Catering Service",
  },
  {
    src: "/assets/uploads/5a3111edc7a074cd4cce18ca5fd05bd9-11.jpg",
    caption: "Conference Hall",
  },
  { src: "/assets/uploads/IMG20260304012455-3.jpg", caption: "Stock List" },
  { src: "/assets/uploads/IMG20260304012503-1.jpg", caption: "CRF Form" },
];

export function LandingPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  const [activePhoto, setActivePhoto] = useState(0);
  const [_imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>(
    {},
  );
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const startAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActivePhoto((prev) => (prev + 1) % GALLERY_PHOTOS.length);
    }, 4000);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setActivePhoto((prev) => (prev + 1) % GALLERY_PHOTOS.length);
    }, 4000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

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

  // Preload all images on mount
  useEffect(() => {
    GALLERY_PHOTOS.forEach((photo, idx) => {
      const img = new Image();
      img.onload = () => setImagesLoaded((prev) => ({ ...prev, [idx]: true }));
      img.onerror = () =>
        setImagesLoaded((prev) => ({ ...prev, [idx]: false }));
      img.src = photo.src;
    });
  }, []);

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

  const progressPct = ((activePhoto + 1) / GALLERY_PHOTOS.length) * 100;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, #0d1b2e 0%, #112240 35%, #0a192f 70%, #0d1b2e 100%)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: "white",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: "3px",
          background:
            "linear-gradient(90deg, #3b82f6 0%, #06b6d4 25%, #8b5cf6 50%, #10b981 75%, #f59e0b 100%)",
        }}
      />

      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(13,27,46,0.85)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(59,130,246,0.35)",
            }}
          >
            <Package
              style={{ width: "20px", height: "20px", color: "white" }}
            />
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: "15px",
                letterSpacing: "-0.2px",
                lineHeight: 1.2,
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
              background: "rgba(59,130,246,0.12)",
              border: "1px solid rgba(59,130,246,0.35)",
              color: "#93c5fd",
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
            {isLoggingIn ? (
              <Loader2 style={{ width: "13px", height: "13px" }} />
            ) : (
              <LogIn style={{ width: "13px", height: "13px" }} />
            )}
            Sign In
          </Button>
        </div>
      </header>

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
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.25)",
              marginBottom: "18px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#22d3ee",
                display: "inline-block",
                animation: "pulse 2s infinite",
                boxShadow: "0 0 8px #22d3ee",
              }}
            />
            <span
              style={{
                color: "#7dd3fc",
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
              fontSize: "clamp(26px, 4vw, 46px)",
              fontWeight: 900,
              lineHeight: 1.12,
              margin: "0 auto 12px",
              letterSpacing: "-0.5px",
              maxWidth: "700px",
            }}
          >
            Corporate Stock{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #60a5fa, #a78bfa, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Tracking
            </span>{" "}
            Made Enterprise-Ready
          </h1>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "15px",
              maxWidth: "520px",
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            Manage gifts, chocolates, beverages and stationery across conference
            rooms with real-time tracking, analytics, and admin-controlled
            access.
          </p>
        </div>

        {/* ===== PHOTO GALLERY ===== */}
        <div style={{ marginBottom: "52px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "15px" }}>📸</span>
              <span
                style={{
                  color: "#e2e8f0",
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                }}
              >
                Our Facilities
              </span>
              <span
                style={{
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  color: "#60a5fa",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 10px",
                  borderRadius: "20px",
                }}
              >
                {GALLERY_PHOTOS.length} Photos
              </span>
            </div>
            <span
              style={{ color: "#475569", fontSize: "13px", fontWeight: 600 }}
            >
              {activePhoto + 1} / {GALLERY_PHOTOS.length}
            </span>
          </div>

          {/* Main carousel -- CSS transitions only, no framer-motion */}
          <div
            style={{
              position: "relative",
              borderRadius: "18px",
              overflow: "hidden",
              height: "440px",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 30px 70px rgba(0,0,0,0.6)",
            }}
          >
            {/* All images stacked, CSS opacity only */}
            {GALLERY_PHOTOS.map((photo, idx) => (
              <div
                key={photo.src}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: idx === activePhoto ? 1 : 0,
                  transition: "opacity 0.55s ease-in-out",
                  zIndex: idx === activePhoto ? 2 : 1,
                }}
              >
                <img
                  src={photo.src}
                  alt={photo.caption}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    backgroundColor: "#1e3a5f",
                  }}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
                {/* Gradient overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
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
                      background: "rgba(0,0,0,0.45)",
                      backdropFilter: "blur(10px)",
                      padding: "6px 18px",
                      borderRadius: "30px",
                      border: "1px solid rgba(255,255,255,0.18)",
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
                    background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "4px 11px",
                    borderRadius: "20px",
                  }}
                >
                  {idx + 1} / {GALLERY_PHOTOS.length}
                </div>
              </div>
            ))}

            {/* Prev */}
            <button
              type="button"
              onClick={goToPrev}
              data-ocid="gallery.pagination_prev"
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft style={{ width: "20px", height: "20px" }} />
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={goToNext}
              data-ocid="gallery.pagination_next"
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
                background: "rgba(255,255,255,0.1)",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg,#3b82f6,#8b5cf6)",
                  width: `${progressPct}%`,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>

          {/* Thumbnail strip -- horizontal scroll */}
          <div
            ref={thumbsRef}
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "12px",
              overflowX: "auto",
              paddingBottom: "6px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(59,130,246,0.4) transparent",
            }}
          >
            {GALLERY_PHOTOS.map((photo, idx) => (
              <button
                key={photo.src}
                type="button"
                onClick={() => goToPhoto(idx)}
                data-ocid={`gallery.item.${idx + 1}`}
                title={photo.caption}
                style={{
                  flexShrink: 0,
                  width: "88px",
                  height: "58px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border:
                    idx === activePhoto
                      ? "2px solid #3b82f6"
                      : "2px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  padding: 0,
                  background: "#1e3a5f",
                  boxShadow:
                    idx === activePhoto
                      ? "0 0 14px rgba(59,130,246,0.55)"
                      : "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  position: "relative",
                }}
              >
                <img
                  src={photo.src}
                  alt={photo.caption}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
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
                      background: "rgba(0,0,0,0.6)",
                      padding: "1px 5px",
                      borderRadius: "3px",
                    }}
                  >
                    {idx + 1}
                  </span>
                </div>
                {idx === activePhoto && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(59,130,246,0.2)",
                    }}
                  />
                )}
              </button>
            ))}
          </div>
          <p
            style={{
              color: "#334155",
              fontSize: "11px",
              marginTop: "5px",
              textAlign: "right",
            }}
          >
            ← Scroll to browse all {GALLERY_PHOTOS.length} photos →
          </p>
        </div>

        {/* Stats Row */}
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
              color: "#3b82f6",
              border: "#1d4ed8",
            },
            {
              label: "Categories",
              value: "4",
              color: "#8b5cf6",
              border: "#6d28d9",
            },
            {
              label: "Facility Photos",
              value: "22",
              color: "#06b6d4",
              border: "#0e7490",
            },
            {
              label: "Access Levels",
              value: "2",
              color: "#10b981",
              border: "#047857",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: `rgba(${stat.color === "#3b82f6" ? "59,130,246" : stat.color === "#8b5cf6" ? "139,92,246" : stat.color === "#06b6d4" ? "6,182,212" : "16,185,129"},0.08)`,
                border: `1px solid ${stat.color}30`,
                borderTop: `3px solid ${stat.color}`,
                borderRadius: "12px",
                padding: "18px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: stat.color,
                  fontSize: "34px",
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "12px",
                  marginTop: "7px",
                  fontWeight: 600,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom: Highlights + CTA + Features */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "48px",
            alignItems: "start",
          }}
        >
          {/* Left */}
          <div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 800,
                marginBottom: "20px",
                letterSpacing: "-0.3px",
              }}
            >
              Everything You Need to{" "}
              <span style={{ color: "#60a5fa" }}>Manage Stock</span>
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
                    color: "#cbd5e1",
                    fontSize: "14px",
                  }}
                >
                  <CheckCircle2
                    style={{
                      width: "16px",
                      height: "16px",
                      color: "#22c55e",
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
                  background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
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
                  boxShadow: "0 8px 28px rgba(59,130,246,0.4)",
                  justifyContent: "center",
                }}
              >
                {isLoggingIn ? (
                  <Loader2 style={{ width: "18px", height: "18px" }} />
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
                  background: "rgba(255,255,255,0.04)",
                  color: "#93c5fd",
                  border: "1px solid rgba(99,179,237,0.3)",
                  borderRadius: "10px",
                  padding: "14px 28px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  justifyContent: "center",
                }}
              >
                Request Staff Access
                <ArrowRight style={{ width: "15px", height: "15px" }} />
              </Button>
            </div>
            <p
              style={{ color: "#334155", fontSize: "12px", marginTop: "10px" }}
            >
              Staff access requires admin approval after registration
            </p>
          </div>

          {/* Right: Feature cards */}
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
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${f.accent}25`,
                  borderLeft: `3px solid ${f.accent}`,
                  borderRadius: "12px",
                  padding: "18px",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "9px",
                    background: `${f.accent}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                  }}
                >
                  <f.icon
                    style={{ width: "18px", height: "18px", color: f.accent }}
                  />
                </div>
                <div
                  style={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "13px",
                    marginBottom: "5px",
                  }}
                >
                  {f.title}
                </div>
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "11px",
                    lineHeight: 1.55,
                  }}
                >
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "18px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
        }}
      >
        <div style={{ color: "#334155", fontSize: "13px" }}>
          © {new Date().getFullYear()} EBC Stock Management Tracker —{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#3b82f6", textDecoration: "none" }}
          >
            Built on caffeine.ai
          </a>
        </div>
        <div style={{ color: "#1e293b", fontSize: "12px" }}>
          Secure · Enterprise-Ready · ICP Powered
        </div>
      </footer>
    </div>
  );
}
