import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Loader2,
  LogIn,
  Package,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Live charts tracking stock usage across all conference rooms",
  },
  {
    icon: Shield,
    title: "Admin Approval Flow",
    desc: "Secure role-based access with admin-approved staff registration",
  },
  {
    icon: Package,
    title: "49-Item Catalogue",
    desc: "Pre-loaded gifts, chocolates, beverages, and stationery items",
  },
  {
    icon: Users,
    title: "Staff Management",
    desc: "Separate admin and staff dashboards with granular permissions",
  },
];

const HIGHLIGHTS = [
  "Gifts & Chocolate Tracker",
  "Beverage & Snack Inventory",
  "Conference Room Management",
  "CSV Export Reports",
  "Approval-based Access",
];

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
];

export function LandingPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  const [activePhoto, setActivePhoto] = useState(0);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-hero-pattern pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "url('/assets/generated/hero-bg.dim_1200x800.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="fixed inset-0 bg-background/80 pointer-events-none" />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <img
            src="/assets/generated/conferstock-logo-transparent.dim_120x120.png"
            alt="Logo"
            className="w-10 h-10"
          />
          <div>
            <p className="font-display text-lg font-bold text-foreground leading-none">
              ConferStock Elite
            </p>
            <p className="text-xs text-muted-foreground">
              Stock Tracker Platform
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            onClick={login}
            disabled={isLoggingIn}
            variant="outline"
            size="sm"
            className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            data-ocid="nav.login.button"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <LogIn className="w-4 h-4 mr-2" />
            )}
            Sign In
          </Button>
        </motion.div>
      </header>

      {/* Welcome Photo Gallery Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Welcome to ConferStock Elite
          </span>
        </motion.div>

        {/* Main Photo Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/40 mb-3"
          style={{ height: "340px" }}
        >
          {GALLERY_PHOTOS.map((photo, idx) => (
            <motion.div
              key={photo.src}
              initial={false}
              animate={{ opacity: idx === activePhoto ? 1 : 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <img
                src={photo.src}
                alt={photo.caption}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="text-white text-sm font-semibold bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  {photo.caption}
                </span>
              </div>
            </motion.div>
          ))}

          {/* Nav dots */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            {GALLERY_PHOTOS.map((photo, idx) => (
              <button
                key={photo.src}
                type="button"
                onClick={() => setActivePhoto(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === activePhoto
                    ? "bg-white scale-125"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                data-ocid={`gallery.tab.${idx + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Thumbnail Strip */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {GALLERY_PHOTOS.map((photo, idx) => (
            <motion.button
              key={photo.src}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + idx * 0.08 }}
              onClick={() => setActivePhoto(idx)}
              className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                idx === activePhoto
                  ? "border-primary shadow-glow"
                  : "border-border/40 hover:border-primary/40"
              }`}
              style={{ height: "70px" }}
              data-ocid={`gallery.item.${idx + 1}`}
            >
              <img
                src={photo.src}
                alt={photo.caption}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-1 left-0 right-0 text-center">
                <span className="text-white text-[10px] font-medium">
                  {photo.caption}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-display text-4xl lg:text-5xl font-bold text-foreground leading-[1.1] mb-6"
            >
              Conference Stock{" "}
              <span className="text-gradient-blue">Tracking</span> Made
              Enterprise-Ready
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg"
            >
              Manage gifts, chocolates, beverages and stationery across all
              conference rooms with real-time tracking, analytics, and
              admin-controlled staff access.
            </motion.p>

            {/* Highlights */}
            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col gap-2 mb-10"
            >
              {HIGHLIGHTS.map((h) => (
                <li
                  key={h}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  {h}
                </li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                onClick={login}
                disabled={isLoggingIn}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow transition-all gap-2 font-semibold"
                data-ocid="hero.login.primary_button"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {isLoggingIn ? "Connecting..." : "Login with Internet Identity"}
              </Button>

              <Button
                onClick={login}
                disabled={isLoggingIn}
                variant="outline"
                size="lg"
                className="border-border hover:border-primary/50 gap-2 font-semibold"
                data-ocid="hero.register.secondary_button"
              >
                Request Staff Access
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 text-xs text-muted-foreground"
            >
              Staff access requires admin approval after registration
            </motion.p>
          </div>

          {/* Right side: feature cards */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 gap-4 lg:block lg:space-y-0"
          >
            <div className="grid grid-cols-1 gap-4">
              {FEATURES.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + idx * 0.1 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border shadow-card hover:shadow-card-hover transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground text-sm mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} ConferStock Elite. Built with love
            using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
          <p>Secure · Enterprise-Ready · ICP Powered</p>
        </div>
      </footer>
    </div>
  );
}
