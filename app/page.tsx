"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Wallet, Target, PieChart, TrendingUp, Bot, CreditCard,
  Download, ArrowRight, Sparkles, Shield, ChevronRight,
  BarChart3, Zap, Star, Bell, ArrowUpRight, Smile
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* ── ANIMATED COUNTER ───────────────────────────────────────── */
function AnimatedNumber({ target, prefix = "", suffix = "", duration = 1800 }: {
  target: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {prefix}{current.toLocaleString("id-ID")}{suffix}
    </span>
  );
}

/* ── PLAYFUL BAR CHART ──────────────────────────────────────── */
function PlayfulBarChart() {
  const bars = [40, 60, 45, 80, 65, 90, 75];
  return (
    <div className="flex items-end gap-2.5 h-20 w-full mt-4">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
          <div
            className={`w-full rounded-t-xl transition-all duration-300 group-hover:scale-y-110 group-hover:brightness-110 ${i === bars.length - 1 ? "bg-[#FDE68A]" : "bg-[#A7F3D0]"
              }`}
            style={{
              height: `${h}%`,
              animation: `p-growUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.1}s forwards`,
              transformOrigin: 'bottom',
              transform: 'scaleY(0)'
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ── MAIN PAGE ───────────────────────────────────────────────── */
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Hapus dark mode jika ada, karena tema kartun ini menggunakan warna cerah
    document.documentElement.classList.remove("dark");

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/dashboard");
    });

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F0EEE4] text-[#0B3E3A] font-sans overflow-x-hidden selection:bg-[#34D399]/30">

      {/* ── GLOBAL CARTOON ANIMATIONS ── */}
      <style>{`
        @keyframes p-bob-vert {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-25px); }
        }
        @keyframes p-bounce-vert-tilt {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(4deg); }
          50% { transform: translateY(-30px) rotate(-2deg); }
        }
        @keyframes p-wobble-hor {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          50% { transform: translateX(15px) rotate(3deg); }
        }
        @keyframes p-growUp {
          to { transform: scaleY(1); }
        }
        .anim-bob { animation: p-bob-vert 4s ease-in-out infinite; }
        .anim-tilt { animation: p-bounce-vert-tilt 5s ease-in-out infinite; }
        .anim-wobble { animation: p-wobble-hor 6s ease-in-out infinite; }
        .anim-delay-1 { animation-delay: 0.5s; }
        .anim-delay-2 { animation-delay: 1.2s; }
      `}</style>

      {/* ── NAVIGATION ─────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "py-4 bg-[#FBF9F1]/90 backdrop-blur-xl border-b border-[#0B3E3A]/5 shadow-sm" : "py-6 bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-[#10B981] rounded-[14px] flex items-center justify-center shadow-lg shadow-[#10B981]/30 rotate-3">
              <Wallet size={20} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Dompet<span className="text-[#10B981]">.</span>
            </span>
          </div>

          {/* Center Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-[#64748B]">
            <a href="#fitur" className="hover:text-[#10B981] transition-colors">Fitur Seru</a>
            <a href="#keunggulan" className="hover:text-[#10B981] transition-colors">Keunggulan</a>
            <a href="#" className="hover:text-[#10B981] transition-colors">Testimoni</a>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-[#0B3E3A] hover:text-[#10B981] transition-colors hidden sm:block">
              Masuk
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 text-sm font-bold text-white bg-[#0B3E3A] rounded-2xl hover:bg-[#10B981] hover:scale-105 hover:-rotate-2 active:scale-95 transition-all shadow-xl shadow-[#0B3E3A]/20"
            >
              Daftar Gratis 🚀
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION (SPLIT LAYOUT) ────────────────────────── */}
      <section className="relative pt-32 lg:pt-40 pb-20 px-6 md:px-12 max-w-7xl mx-auto w-full min-h-[90vh] flex items-center">
        {/* Playful Background Blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#34D399]/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-[#FCD34D]/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 w-full items-center relative z-10">

          {/* LEFT: Text Content */}
          <div className="flex flex-col items-start text-left max-w-2xl">
            {/* Cute Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-[#E5E0D8] shadow-sm mb-8 anim-wobble">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981]"></span>
              </span>
              <span className="text-xs font-black text-[#0B3E3A] uppercase tracking-wider">Terbaik di 2024 ✨</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[76px] leading-[1.05] font-black tracking-tight text-[#0B3E3A] mb-6">
              Buat Keuanganmu <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-[#0EA5E9] filter drop-shadow-sm">
                Super Seru!
              </span>
            </h1>

            <p className="text-lg text-[#64748B] mb-10 max-w-lg leading-relaxed font-medium">
              Catat jajan harian, atur tabungan liburan, dan pantau cuan dengan cara yang paling asyik. Ucapkan selamat tinggal pada tabel yang membosankan!
            </p>

            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-[#10B981] text-white font-black rounded-2xl hover:bg-[#059669] hover:-translate-y-1 hover:shadow-xl hover:shadow-[#10B981]/30 transition-all text-center flex items-center justify-center gap-2 text-lg"
              >
                Mulai Mainkan <ArrowRight size={20} />
              </Link>
              <a
                href="#fitur"
                className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-[#E5E0D8] text-[#0B3E3A] font-bold rounded-2xl hover:bg-[#F8FAFC] hover:-translate-y-1 transition-all text-center text-lg shadow-sm"
              >
                Lihat Keseruannya
              </a>
            </div>
          </div>

          {/* RIGHT: Cartoon Floating Mockups */}
          <div className="relative w-full h-[550px] hidden lg:block perspective-1000">

            {/* Main Wallet Card */}
            <div className="absolute top-[10%] left-[5%] z-30 w-[320px] bg-white rounded-[32px] p-7 shadow-2xl shadow-[#0B3E3A]/10 border-[3px] border-[#E5E0D8] anim-bob">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-[#ECFDF5] rounded-[18px] border-2 border-[#A7F3D0] flex items-center justify-center -rotate-3">
                  <Wallet size={26} className="text-[#10B981]" />
                </div>
                <span className="px-3 py-1.5 bg-[#FEF3C7] text-[#D97706] border-2 border-[#FDE68A] text-xs font-black rounded-xl rotate-3">
                  +12.5% 🔥
                </span>
              </div>
              <p className="text-[#64748B] text-sm font-bold mb-1">Total Tabungan</p>
              <h3 className="text-4xl font-black text-[#0B3E3A] tracking-tight">
                Rp 24.500<span className="text-[#94A3B8]">.000</span>
              </h3>
              <PlayfulBarChart />
            </div>

            {/* Target Card (Tilted) */}
            <div className="absolute bottom-[5%] left-[45%] z-40 w-[240px] bg-[#10B981] rounded-[28px] p-6 shadow-xl shadow-[#10B981]/30 border-4 border-[#34D399] anim-tilt anim-delay-1">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <Target size={24} className="text-white" />
              </div>
              <p className="text-emerald-100 text-sm font-bold mb-1">Target Liburan 🏖️</p>
              <h3 className="text-2xl font-black text-white">75% Tercapai</h3>
              <div className="w-full bg-white/30 h-3 rounded-full mt-4 overflow-hidden">
                <div className="bg-[#FDE68A] w-[75%] h-full rounded-full" />
              </div>
            </div>

            {/* AI Assistant Bubble */}
            <div className="absolute top-[5%] right-[5%] z-50 bg-white rounded-3xl rounded-br-md p-5 shadow-xl shadow-slate-200 border-[3px] border-[#E5E0D8] anim-wobble anim-delay-2 flex gap-4 max-w-[260px]">
              <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
                <Bot size={20} className="text-[#0EA5E9]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#64748B] mb-1">Asisten Dompet</p>
                <p className="text-sm font-bold text-[#0B3E3A] leading-tight">
                  Wow! Kamu hemat <span className="text-[#10B981]">Rp 200rb</span> minggu ini dari kopi! ☕
                </p>
              </div>
            </div>

            {/* Decorative Stars / Shapes */}
            <Sparkles size={40} className="absolute top-[40%] right-[10%] text-[#FCD34D] anim-bob anim-delay-1" />
            <Smile size={32} className="absolute bottom-[20%] left-[-5%] text-[#F43F5E] anim-tilt anim-delay-2 opacity-50" />
            <div className="absolute top-[30%] left-[-10%] w-16 h-16 bg-[#0EA5E9] rounded-full mix-blend-multiply filter blur-2xl opacity-40 anim-wobble" />

          </div>
        </div>
      </section>

      {/* ── STATS TICKER ─────────────────────────────────────── */}
      <div className="py-12 bg-white border-y-[3px] border-[#E5E0D8]" id="keunggulan">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 150, suffix: "k+", label: "Teman Bergabung", color: "text-[#10B981]" },
            { value: 2, suffix: "M+", label: "Transaksi Lancar", color: "text-[#0EA5E9]" },
            { value: 100, suffix: "%", label: "Aman & Nyaman", color: "text-[#F43F5E]" },
            { value: 5, suffix: " ★", label: "Rating Bintang 5", color: "text-[#D97706]" },
          ].map((s, i) => (
            <div key={i} className="space-y-2 relative group cursor-default">
              <div className={`text-4xl md:text-5xl font-black ${s.color} group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                <AnimatedNumber target={s.value} suffix={s.suffix} />
              </div>
              <p className="text-sm text-[#64748B] font-bold uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES BENTO ───────────────────────────────────── */}
      <section id="fitur" className="py-24 px-6 md:px-12 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="inline-block px-4 py-2 bg-[#FEF3C7] border-2 border-[#FDE68A] text-[#D97706] rounded-full text-xs font-black uppercase tracking-widest mb-6 rotate-2">
                Kotak Mainan Finansial
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-[#0B3E3A] leading-tight tracking-tight">
                Semua alat sakti, <br className="hidden md:block" />
                <span className="text-[#10B981]">tanpa pusing mikirin rumus.</span>
              </h2>
            </div>
            <Link href="/login" className="px-8 py-4 bg-white border-2 border-[#E5E0D8] rounded-2xl hover:bg-[#F8FAFC] hover:-translate-y-1 transition-all font-black text-[#0B3E3A] text-sm whitespace-nowrap shadow-sm">
              Cobain Sekarang 🪄
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart3 size={28} />,
                title: "Grafik Interaktif",
                desc: "Lihat arus uangmu dalam bentuk grafik warna-warni yang gampang dimengerti, seasyik main game.",
                bg: "bg-[#ECFDF5]", border: "border-[#A7F3D0]", iconColor: "text-[#10B981]",
                span: "md:col-span-2",
              },
              {
                icon: <Target size={28} />,
                title: "Goal Tracker",
                desc: "Pisahkan uang untuk beli sepatu baru atau liburan. Progresnya kelihatan jelas!",
                bg: "bg-[#FFFBEB]", border: "border-[#FDE68A]", iconColor: "text-[#D97706]",
                span: "",
              },
              {
                icon: <Shield size={28} />,
                title: "Super Aman",
                desc: "Dilengkapi brankas digital dengan enkripsi tingkat dewa. Data kamu 100% aman.",
                bg: "bg-[#FEF2F2]", border: "border-[#FECACA]", iconColor: "text-[#F43F5E]",
                span: "",
              },
              {
                icon: <Bot size={28} />,
                title: "Asisten AI Baik Hati",
                desc: "Dapat saran dan peringatan otomatis kalau kamu mulai boros jajan boba bulan ini.",
                bg: "bg-[#F0F9FF]", border: "border-[#BAE6FD]", iconColor: "text-[#0EA5E9]",
                span: "md:col-span-2",
              },
            ].map((ft, i) => (
              <div
                key={i}
                className={`bg-white border-4 ${ft.border} p-8 rounded-[32px] hover:-translate-y-2 hover:shadow-[0_12px_0_0_rgba(229,224,216,1)] transition-all duration-300 flex flex-col gap-6 group cursor-pointer ${ft.span}`}
              >
                <div className={`w-16 h-16 rounded-[20px] ${ft.bg} ${ft.iconColor} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                  {ft.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#0B3E3A] mb-3">{ft.title}</h3>
                  <p className="text-[#64748B] leading-relaxed font-medium">
                    {ft.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BUBBLE ────────────────────────────────────────── */}
      <section className="py-24 px-6 mx-6 md:mx-12 mb-16 rounded-[48px] bg-[#10B981] relative overflow-hidden flex justify-center border-4 border-[#059669] shadow-2xl shadow-[#10B981]/30 anim-bob" style={{ animationDuration: '6s' }}>
        {/* Playful background shapes */}
        <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-10%] w-80 h-80 bg-[#FDE68A]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-2xl px-4">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
            Udah siap jadi <br /> Sultan betulan? 👑
          </h2>
          <p className="text-emerald-100 mb-10 text-lg md:text-xl font-bold">
            Ayo gabung sekarang! Gratis, gampang banget dipakainya, dan nggak perlu kartu kredit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-10 py-5 bg-[#FDE68A] text-[#D97706] font-black text-lg rounded-[24px] hover:bg-[#FCD34D] hover:scale-110 hover:-rotate-2 transition-all w-full sm:w-auto shadow-[0_8px_0_0_#D97706] active:translate-y-2 active:shadow-none border-4 border-[#D97706]"
            >
              Let's Gooo! 🚀
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t-[3px] border-[#E5E0D8] bg-[#FBF9F1] px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#10B981] rounded-xl flex items-center justify-center rotate-6">
              <Wallet size={16} className="text-white" />
            </div>
            <span className="text-xl font-black text-[#0B3E3A]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Dompet.
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-[#64748B]">
            <a href="#" className="hover:text-[#10B981] hover:-translate-y-1 transition-transform inline-block">Privacy</a>
            <a href="#" className="hover:text-[#10B981] hover:-translate-y-1 transition-transform inline-block">Terms</a>
            <a href="#" className="hover:text-[#10B981] hover:-translate-y-1 transition-transform inline-block">Bantuan</a>
          </div>

          <p className="text-sm font-bold text-[#94A3B8]">
            © {new Date().getFullYear()} Dompet. Dibuat dengan 💖 dan ☕
          </p>
        </div>
      </footer>
    </div>
  );
}