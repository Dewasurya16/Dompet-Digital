"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Wallet, Target, PieChart, TrendingUp, Bot, CreditCard,
  Download, ArrowRight, Sparkles, Shield, ChevronRight,
  BarChart3, Zap, Star, Bell, ArrowUpRight, Smile, Heart
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
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer">
          <div
            className={`w-full rounded-t-lg border-2 border-[#0B3E3A] transition-all duration-300 group-hover:scale-y-110 group-hover:-translate-y-1 ${i === bars.length - 1 ? "bg-[#FDE68A]" : "bg-[#A7F3D0]"
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
    <div className="min-h-screen bg-[#FDFBF7] text-[#0B3E3A] font-sans overflow-x-hidden selection:bg-[#FDE68A] selection:text-[#0B3E3A]">

      {/* ── GLOBAL CARTOON & COMIC UI ANIMATIONS ── */}
      <style>{`
        /* Floating & Bouncing */
        @keyframes p-bob-vert { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes p-bounce-vert-tilt { 0%, 100% { transform: translateY(0) rotate(0deg); } 25% { transform: translateY(-10px) rotate(4deg); } 50% { transform: translateY(-25px) rotate(-2deg); } }
        @keyframes p-wobble-hor { 0%, 100% { transform: translateX(0) rotate(0deg); } 50% { transform: translateX(12px) rotate(3deg); } }
        @keyframes p-growUp { to { transform: scaleY(1); } }
        
        .anim-bob { animation: p-bob-vert 4s ease-in-out infinite; }
        .anim-tilt { animation: p-bounce-vert-tilt 5s ease-in-out infinite; }
        .anim-wobble { animation: p-wobble-hor 6s ease-in-out infinite; }
        .anim-delay-1 { animation-delay: 0.5s; }
        .anim-delay-2 { animation-delay: 1.2s; }

        /* Comic Book UI Shadows (Neo-Brutalism) */
        .comic-border { border: 3px solid #0B3E3A; }
        .comic-shadow { box-shadow: 6px 6px 0px 0px #0B3E3A; }
        .comic-shadow-sm { box-shadow: 3px 3px 0px 0px #0B3E3A; }
        
        .comic-button {
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .comic-button:hover {
          transform: translate(-2px, -2px);
          box-shadow: 8px 8px 0px 0px #0B3E3A;
        }
        .comic-button:active {
          transform: translate(4px, 4px) scale(0.98);
          box-shadow: 0px 0px 0px 0px #0B3E3A;
        }

        .comic-card:hover {
          transform: translate(-4px, -4px);
          box-shadow: 10px 10px 0px 0px #0B3E3A;
        }
      `}</style>

      {/* ── FLOATING NAVIGATION ─────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "pt-4" : "pt-6"}`}>
        <div className={`max-w-5xl mx-auto px-4 md:px-6 flex items-center justify-between comic-border comic-shadow-sm bg-white rounded-full transition-all duration-300 ${scrolled ? "py-3" : "py-4"}`}>
          {/* Logo */}
          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-9 h-9 bg-[#10B981] comic-border rounded-full flex items-center justify-center -rotate-6">
              <Wallet size={18} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Dompet<span className="text-[#10B981]">.</span>
            </span>
          </div>

          {/* Center Links (Hidden on Mobile) */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-[#0B3E3A]">
            <a href="#fitur" className="hover:text-[#10B981] hover:-translate-y-0.5 transition-transform">Fitur Mainan</a>
            <a href="#keunggulan" className="hover:text-[#10B981] hover:-translate-y-0.5 transition-transform">Skor Kita</a>
            <a href="#" className="hover:text-[#10B981] hover:-translate-y-0.5 transition-transform">Testimoni</a>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 pr-2">
            <Link href="/login" className="text-sm font-bold text-[#0B3E3A] hover:text-[#10B981] transition-colors hidden sm:block">
              Masuk
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 text-sm font-black text-[#0B3E3A] bg-[#FDE68A] rounded-full comic-border comic-shadow-sm comic-button"
            >
              Mulai Yuk! 🚀
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ───────────────────────────────────────── */}
      <section className="relative pt-40 pb-20 px-6 md:px-12 max-w-7xl mx-auto w-full min-h-[90vh] flex items-center">
        {/* Cartoon Background Patterns (Polka dots) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#0B3E3A 2px, transparent 2px)', backgroundSize: '30px 30px' }} />

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 w-full items-center relative z-10">

          {/* LEFT: Text Content */}
          <div className="flex flex-col items-start text-left max-w-2xl relative">
            {/* Cute Sticker Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E0F2FE] comic-border comic-shadow-sm mb-8 anim-tilt rotate-3 cursor-default hover:rotate-6 transition-transform">
              <Sparkles size={16} className="text-[#0EA5E9]" />
              <span className="text-xs font-black text-[#0B3E3A] uppercase tracking-wider">Aplikasi Ter-Hype 2024!</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[76px] leading-[1.05] font-black tracking-tight text-[#0B3E3A] mb-6 relative">
              Atur Uang <br />
              Jadi Lebih <br />
              <span className="inline-block bg-[#10B981] text-white px-4 py-1 mt-2 rounded-2xl comic-border comic-shadow -rotate-2 hover:rotate-2 transition-transform cursor-pointer">
                Asyik & Seru! 🎉
              </span>
            </h1>

            <p className="text-lg text-[#0B3E3A]/70 mb-10 max-w-lg leading-relaxed font-bold">
              Buang buku kas lamamu. Catat jajan harian, kejar target liburan, dan kumpulkan cuan kaya lagi main game!
            </p>

            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-[#10B981] text-white font-black rounded-2xl text-center flex items-center justify-center gap-2 text-lg comic-border comic-shadow comic-button"
              >
                Gas Sekarang <ArrowRight size={20} />
              </Link>
              <a
                href="#fitur"
                className="w-full sm:w-auto px-8 py-4 bg-white text-[#0B3E3A] font-black rounded-2xl text-center text-lg comic-border comic-shadow comic-button"
              >
                Intip Fiturnya 👀
              </a>
            </div>
          </div>

          {/* RIGHT: Comic Floating Mockups */}
          <div className="relative w-full h-[550px] hidden lg:block">

            {/* Main Wallet Card (Sticker Style) */}
            <div className="absolute top-[10%] left-[5%] z-30 w-[320px] bg-white rounded-3xl p-7 comic-border comic-shadow anim-bob">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-[#A7F3D0] rounded-2xl comic-border flex items-center justify-center -rotate-6 hover:rotate-12 transition-transform cursor-pointer">
                  <Wallet size={26} className="text-[#0B3E3A]" />
                </div>
                <span className="px-3 py-1.5 bg-[#FDE68A] text-[#0B3E3A] comic-border text-xs font-black rounded-xl rotate-6 hover:-rotate-3 transition-transform">
                  +12.5% Naik 🚀
                </span>
              </div>
              <p className="text-[#0B3E3A]/60 text-sm font-black mb-1 uppercase tracking-widest">Brankas Sultan</p>
              <h3 className="text-4xl font-black text-[#0B3E3A] tracking-tight">
                Rp 24.500<span className="text-[#0B3E3A]/40">.000</span>
              </h3>
              <PlayfulBarChart />
            </div>

            {/* Target Card */}
            <div className="absolute bottom-[5%] left-[45%] z-40 w-[240px] bg-[#0EA5E9] rounded-3xl p-6 comic-border comic-shadow anim-tilt anim-delay-1">
              <div className="w-12 h-12 bg-white rounded-2xl comic-border comic-shadow-sm flex items-center justify-center mb-4 hover:scale-110 transition-transform">
                <Target size={24} className="text-[#0B3E3A]" />
              </div>
              <p className="text-white text-sm font-black mb-1">Target Liburan 🏖️</p>
              <h3 className="text-2xl font-black text-white">75% Nyaris!</h3>
              <div className="w-full bg-[#0B3E3A] h-4 rounded-full mt-4 p-1">
                <div className="bg-[#FDE68A] w-[75%] h-full rounded-full border border-[#0B3E3A]" />
              </div>
            </div>

            {/* AI Assistant Bubble (Comic Speech Bubble) */}
            <div className="absolute top-[5%] right-[5%] z-50 bg-[#FDE68A] rounded-3xl rounded-br-sm p-5 comic-border comic-shadow anim-wobble anim-delay-2 flex gap-4 max-w-[260px]">
              <div className="w-12 h-12 rounded-full bg-white comic-border flex items-center justify-center flex-shrink-0 animate-bounce" style={{ animationDuration: '2s' }}>
                <Smile size={24} className="text-[#0B3E3A]" />
              </div>
              <div>
                <p className="text-xs font-black text-[#0B3E3A]/60 mb-1 uppercase">Pesan Mas Bot 🤖</p>
                <p className="text-sm font-bold text-[#0B3E3A] leading-tight">
                  Wow! Kamu hemat <span className="text-white bg-[#10B981] px-1 rounded border border-[#0B3E3A]">Rp 200rb</span> minggu ini dari jajan kopi!
                </p>
              </div>
            </div>

            {/* Decorative Doodles */}
            <Star size={48} className="absolute top-[40%] right-[5%] text-[#FDE68A] fill-[#FDE68A] anim-bob anim-delay-1 drop-shadow-[3px_3px_0_#0B3E3A]" />
            <Heart size={40} className="absolute bottom-[25%] left-[-5%] text-[#F43F5E] fill-[#F43F5E] anim-tilt anim-delay-2 drop-shadow-[3px_3px_0_#0B3E3A]" />

          </div>
        </div>
      </section>

      {/* ── STATS TICKER (Sticker Style) ──────────────────────── */}
      <div className="py-12 bg-[#FDE68A] comic-border border-l-0 border-r-0" id="keunggulan">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 150, suffix: "k+", label: "Sobat Cuan", bg: "bg-white" },
            { value: 2, suffix: "M+", label: "Transaksi", bg: "bg-[#A7F3D0]" },
            { value: 100, suffix: "%", label: "Aman Total", bg: "bg-[#FECACA]" },
            { value: 5, suffix: " ★", label: "Bintang", bg: "bg-[#BAE6FD]" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center group cursor-default">
              <div className={`px-6 py-3 rounded-2xl comic-border comic-shadow-sm ${s.bg} text-3xl md:text-4xl font-black text-[#0B3E3A] mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                <AnimatedNumber target={s.value} suffix={s.suffix} />
              </div>
              <p className="text-sm text-[#0B3E3A] font-black uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES BENTO (Toy Blocks) ───────────────────────── */}
      <section id="fitur" className="py-24 px-6 md:px-12 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="inline-block px-5 py-2 bg-[#F43F5E] text-white comic-border comic-shadow-sm rounded-full text-xs font-black uppercase tracking-widest mb-6 -rotate-2">
                Kotak Mainan Finansial 🪀
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-[#0B3E3A] leading-[1.1] tracking-tight">
                Alat ajaib biar uang <br className="hidden md:block" />
                <span className="text-[#10B981]">nurut sama kamu!</span>
              </h2>
            </div>
            <Link href="/login" className="px-8 py-4 bg-white text-[#0B3E3A] rounded-2xl font-black text-sm whitespace-nowrap comic-border comic-shadow comic-button">
              Bongkar Kotaknya 📦
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 size={32} />,
                title: "Grafik Anti-Pusing",
                desc: "Arus kasmu disulap jadi grafik warna-warni yang gampang banget dipahami. Ngeliat pengeluaran nggak pernah se-menyenangkan ini!",
                bg: "bg-[#10B981]", text: "text-white",
                span: "md:col-span-2",
              },
              {
                icon: <Target size={32} />,
                title: "Celengan Pintar",
                desc: "Bikin kantong khusus buat beli gadget impian. Tinggal isi, dan rayakan waktu udah penuh!",
                bg: "bg-[#FDE68A]", text: "text-[#0B3E3A]",
                span: "",
              },
              {
                icon: <Shield size={32} />,
                title: "Brankas Baja",
                desc: "Data kamu dijaga pakai gembok digital berlapis. Hacker auto-nangis ngeliat sistem kita.",
                bg: "bg-[#F43F5E]", text: "text-white",
                span: "",
              },
              {
                icon: <Bot size={32} />,
                title: "Robot Asisten",
                desc: "Dapat teguran manis kalau jajan boba mulai berlebihan, plus tips nabung otomatis tiap bulan.",
                bg: "bg-[#0EA5E9]", text: "text-white",
                span: "md:col-span-2",
              },
            ].map((ft, i) => (
              <div
                key={i}
                className={`${ft.bg} comic-border comic-shadow comic-card p-8 rounded-[32px] transition-all duration-300 flex flex-col gap-6 group cursor-pointer ${ft.span}`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-white comic-border flex items-center justify-center text-[#0B3E3A] comic-shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-transform`}>
                  {ft.icon}
                </div>
                <div className={ft.text}>
                  <h3 className="text-2xl font-black mb-3">{ft.title}</h3>
                  <p className="font-bold opacity-90 leading-relaxed text-sm md:text-base">
                    {ft.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BUBBLE (Big Squishy Button Area) ──────────────── */}
      <section className="py-24 px-6 mx-6 md:mx-12 mb-16 rounded-[48px] bg-[#A7F3D0] comic-border comic-shadow relative overflow-hidden flex justify-center anim-bob" style={{ animationDuration: '6s' }}>
        {/* Playful background shapes */}
        <div className="absolute top-[-10%] left-[-5%] w-48 h-48 bg-white comic-border rounded-full opacity-50 pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-5%] w-64 h-64 bg-[#34D399] comic-border rounded-full pointer-events-none" />

        <div className="relative z-10 text-center max-w-2xl px-4">
          <h2 className="text-4xl md:text-6xl font-black text-[#0B3E3A] mb-6 leading-tight tracking-tight">
            Udah siap jadi <br /> <span className="bg-white px-3 comic-border rounded-2xl rotate-2 inline-block">Sultan betulan?</span> 👑
          </h2>
          <p className="text-[#0B3E3A]/80 mb-10 text-lg md:text-xl font-black">
            Bikin akun cuma butuh 10 detik. Gratis tis tis, gampang banget, dan dijamin seru!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-12 py-5 bg-[#0B3E3A] text-[#FDE68A] font-black text-xl rounded-full comic-border comic-shadow comic-button w-full sm:w-auto text-center"
            >
              CUSSS DAFTAR! 🚀
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t-[4px] border-[#0B3E3A] bg-white px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#10B981] comic-border rounded-2xl flex items-center justify-center rotate-6 hover:rotate-[360deg] transition-transform duration-700">
              <Wallet size={20} className="text-white" />
            </div>
            <span className="text-2xl font-black text-[#0B3E3A]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Dompet.
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm font-black text-[#0B3E3A]">
            <a href="#" className="hover:text-[#10B981] hover:-translate-y-1 transition-transform inline-block px-3 py-1 comic-border rounded-lg bg-[#FDE68A]">Rahasia</a>
            <a href="#" className="hover:text-[#10B981] hover:-translate-y-1 transition-transform inline-block px-3 py-1 comic-border rounded-lg bg-[#A7F3D0]">Aturan Main</a>
            <a href="#" className="hover:text-[#10B981] hover:-translate-y-1 transition-transform inline-block px-3 py-1 comic-border rounded-lg bg-[#E0F2FE]">Tanya Jawab</a>
          </div>

          <p className="text-sm font-black text-[#0B3E3A]/60">
            © {new Date().getFullYear()} Dompet. Dibuat asyik 🇮🇩
          </p>
        </div>
      </footer>
    </div>
  );
}