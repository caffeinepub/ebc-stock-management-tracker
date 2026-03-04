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

// ALL 22 PHOTOS - verified paths
const GALLERY_PHOTOS = [
  {
    src: "/assets/generated/corporate-reception-welcome.dim_800x500.jpg",
    caption: "Corporate Reception",
    fallbackColor: "#1e40af",
  },
  {
    src: "/assets/generated/steward-serving-food.dim_800x500.jpg",
    caption: "Food Service",
    fallbackColor: "#065f46",
  },
  {
    src: "/assets/generated/steward-coffee-serving.dim_800x500.jpg",
    caption: "Coffee & Beverages",
    fallbackColor: "#7c2d12",
  },
  {
    src: "/assets/uploads/a35130edc8113b0b747ed58f84fa3f8c-1.jpg",
    caption: "Analytics Meeting",
    fallbackColor: "#1e3a5f",
  },
  {
    src: "/assets/uploads/f1ab4e987c10c6a805c8292b83620e49-2.jpg",
    caption: "Hotel Reception",
    fallbackColor: "#3b0764",
  },
  {
    src: "/assets/uploads/ba1827c7d0547371f27c8f379188d925-3.jpg",
    caption: "Front Desk",
    fallbackColor: "#134e4a",
  },
  {
    src: "/assets/uploads/fe527d8561ded99212cb42b5b313bc1b-4.jpg",
    caption: "Fine Dining",
    fallbackColor: "#7f1d1d",
  },
  {
    src: "/assets/uploads/2f75b4e0f037ca186c1efa418f124544-5.jpg",
    caption: "Restaurant",
    fallbackColor: "#1a2e4a",
  },
  {
    src: "/assets/uploads/e1ab939c3419223e362707abfad25362-6.jpg",
    caption: "Conference Room",
    fallbackColor: "#14532d",
  },
  {
    src: "/assets/uploads/918e6d9a5d992d5b249ea39d7dc21f93-1.jpg",
    caption: "Corporate Meeting",
    fallbackColor: "#1e3a5f",
  },
  {
    src: "/assets/uploads/caf0639252273c4d59ab442b56c3439e-2.jpg",
    caption: "Business Event",
    fallbackColor: "#3b0764",
  },
  {
    src: "/assets/uploads/3a97e432077c584da3c5cc96c50e2a42-3.jpg",
    caption: "Office Setup",
    fallbackColor: "#7c2d12",
  },
  {
    src: "/assets/uploads/3fb97264e0c85024108afeb78301f75b-4.jpg",
    caption: "Staff Service",
    fallbackColor: "#134e4a",
  },
  {
    src: "/assets/uploads/f304902a3cf36bd93b1a30f2de0668d8-5.jpg",
    caption: "Hospitality",
    fallbackColor: "#1e40af",
  },
  {
    src: "/assets/uploads/bdcccc48aad3dc39ca9abbe1681dc6f8-6.jpg",
    caption: "Corporate Dining",
    fallbackColor: "#7f1d1d",
  },
  {
    src: "/assets/uploads/96ae48f6901a48d4e006fe0fb4995d86-7.jpg",
    caption: "Meeting Room",
    fallbackColor: "#1a2e4a",
  },
  {
    src: "/assets/uploads/d190d1185f5c06012534cdbd79d2f5a8-8.jpg",
    caption: "Executive Suite",
    fallbackColor: "#14532d",
  },
  {
    src: "/assets/uploads/66dcc379d9beae160be9d5ba7e0418f3-9.jpg",
    caption: "Event Setup",
    fallbackColor: "#3b0764",
  },
  {
    src: "/assets/uploads/5d0f9f5a963897972fe092e96daff47e-10.jpg",
    caption: "Catering Service",
    fallbackColor: "#7c2d12",
  },
  {
    src: "/assets/uploads/5a3111edc7a074cd4cce18ca5fd05bd9-11.jpg",
    caption: "Conference Hall",
    fallbackColor: "#1e40af",
  },
  {
    src: "/assets/uploads/IMG20260304012455-3.jpg",
    caption: "Stock List",
    fallbackColor: "#065f46",
  },
  {
    src: "/assets/uploads/IMG20260304012503-1.jpg",
    caption: "CRF Form",
    fallbackColor: "#1e3a5f",
  },
];

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
  const currentPhoto = GALLERY_PHOTOS[activePhoto];

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

      {/* Header */}
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

        {/* ===== PHOTO GALLERY ===== */}
        <div style={{ marginBottom: "52px" }}>
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

          {/* Main carousel */}
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
                  transition: "opacity 0.55s ease-in-out",
                  zIndex: idx === activePhoto ? 2 : 1,
                  backgroundColor: photo.fallbackColor,
                }}
              >
                {/* Always render img — fallback color on container handles failed loads */}
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
                  /* Styled placeholder for failed images */
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

          {/* Thumbnail strip */}
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
                style={{
                  flexShrink: 0,
                  width: "90px",
                  height: "60px",
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
                  transition: "border-color 0.2s, box-shadow 0.2s",
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
                {idx === activePhoto && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(3,105,161,0.15)",
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
              value: "22",
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

      {/* Footer */}
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

      {/* Unused variable suppressor */}
      <span style={{ display: "none" }}>{currentPhoto?.caption}</span>
    </div>
  );
}
