"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Wallet, Target, PieChart, TrendingUp, Bot, CreditCard,
  Download, ArrowRight, Sun, Moon, Sparkles, Shield,
  ChevronRight, BarChart3, Zap, Star, Bell
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

/* ── BAR CHART MOCKUP ───────────────────────────────────────── */
function MiniBarChart() {
  const bars = [38, 55, 42, 78, 61, 88, 72, 94, 69, 85, 100, 91];
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return (
    <div className="flex items-end gap-1.5 h-28 w-full px-1">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md relative overflow-hidden"
            style={{ height: `${h}%` }}
          >
            <div
              className={`absolute inset-0 rounded-t-md bar-animated ${i === 11
                ? "bg-emerald-500"
                : "bg-emerald-100 dark:bg-emerald-900/30"
                }`}
              style={{ animationDelay: `${i * 0.06}s` }}
            />
          </div>
          {i % 3 === 0 && (
            <span className="text-[8px] text-slate-400 font-medium">{months[i]}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── TRANSACTION ITEM ───────────────────────────────────────── */
function TxItem({ icon, label, sub, amount, positive }: {
  icon: React.ReactNode; label: string; sub: string; amount: string; positive: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-300">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
        </div>
      </div>
      <span className={`text-sm font-bold tabular-nums ${positive ? "text-emerald-600" : "text-slate-700 dark:text-slate-300"}`}>
        {positive ? "+" : "−"}{amount}
      </span>
    </div>
  );
}

/* ── FEATURE ICONS ─────────────────────────────────────────── */
const features = [
  {
    icon: <BarChart3 size={22} />,
    title: "Analitik Cashflow",
    desc: "Pantau pemasukan & pengeluaran real-time dengan grafik interaktif yang mudah dibaca.",
    color: "emerald",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    fg: "text-emerald-600 dark:text-emerald-400",
    span: "md:col-span-2",
  },
  {
    icon: <Target size={22} />,
    title: "Target Tabungan",
    desc: "Buat kantong terpisah untuk liburan, gadget, dana darurat, dan impian lainnya.",
    color: "amber",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    fg: "text-amber-600 dark:text-amber-400",
    span: "",
  },
  {
    icon: <Bot size={22} />,
    title: "Asisten AI",
    desc: "Saran finansial personal berdasarkan pola pengeluaran bulananmu secara otomatis.",
    color: "sky",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    fg: "text-sky-600 dark:text-sky-400",
    span: "",
  },
  {
    icon: <TrendingUp size={22} />,
    title: "Portofolio Investasi",
    desc: "Kelola Saham, Reksa Dana, dan Crypto dalam satu dashboard yang terintegrasi.",
    color: "indigo",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    fg: "text-indigo-600 dark:text-indigo-400",
    span: "",
  },
  {
    icon: <Bell size={22} />,
    title: "Pengingat Tagihan",
    desc: "Notifikasi otomatis agar tidak pernah terlewat membayar tagihan penting.",
    color: "rose",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    fg: "text-rose-600 dark:text-rose-400",
    span: "",
  },
  {
    icon: <Download size={22} />,
    title: "Ekspor Laporan",
    desc: "Unduh laporan keuangan ke PDF & CSV, atau kirim otomatis ke Email/WhatsApp.",
    color: "slate",
    bg: "bg-slate-100 dark:bg-slate-800/50",
    fg: "text-slate-600 dark:text-slate-400",
    span: "md:col-span-2",
  },
];

/* ── MAIN PAGE ───────────────────────────────────────────────── */
export default function LandingPage() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("fin_theme");
    if (saved === "dark") setIsDark(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/dashboard");
    });

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [router]);

  useEffect(() => {
    if (!mounted) return;
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("fin_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("fin_theme", "light");
    }
  }, [isDark, mounted]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F7F6F1] dark:bg-[#0C0C10] text-slate-900 dark:text-slate-100 flex flex-col overflow-x-hidden grain-overlay selection:bg-emerald-500/20 transition-colors duration-500">

      {/* ── NAVIGATION ─────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
          ? "py-3 bg-white/85 dark:bg-[#0C0C10]/85 backdrop-blur-xl border-b border-black/5 dark:border-white/5 shadow-sm"
          : "py-5 bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/25">
              <Wallet size={18} className="text-white" />
            </div>
            <span
              className="text-[22px] font-black tracking-tight"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Dompet<span className="text-emerald-600">.</span>
            </span>
          </div>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Fitur", href: "#fitur" },
              { label: "Keunggulan", href: "#keunggulan" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md shadow-black/10"
            >
              Masuk
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-6 max-w-7xl mx-auto w-full mesh-gradient">
        {/* Decorative blobs */}
        <div className="absolute top-24 left-1/4 w-96 h-96 rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-72 h-72 rounded-full bg-sky-400/10 dark:bg-sky-500/08 blur-[80px] -z-10 pointer-events-none" />

        {/* Badge */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600/10 dark:bg-emerald-500/15 border border-emerald-600/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase animate-fade-up">
            <Sparkles size={12} />
            Platform untuk mengatur keuanganmu
            <Sparkles size={12} />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6 animate-fade-up delay-100">
          <h1
            className="text-5xl sm:text-6xl lg:text-[76px] leading-[1.05] tracking-tight font-black"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Satu Aplikasi,
            <br />
            <span className="text-shimmer italic">Kendali Penuh</span>
            <br />
            Keuanganmu.
          </h1>
        </div>

        {/* Subheading */}
        <p className="text-center text-slate-500 dark:text-slate-400 text-lg font-medium max-w-xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200">
          Catat pengeluaran, capai target tabungan, dan kelola portofolio investasi
          dengan analitik cerdas berbasis AI — gratis selamanya.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14 animate-fade-up delay-300">
          <Link
            href="/login"
            className="group w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 text-sm"
          >
            Mulai Gratis Sekarang
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#fitur"
            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-center text-sm"
          >
            Lihat Demo
          </a>
        </div>

        {/* Social Proof */}
        <div className="flex items-center justify-center gap-4 mb-16 animate-fade-up delay-400">
          <div className="flex -space-x-2.5">
            {["bg-emerald-300", "bg-sky-300", "bg-amber-300", "bg-rose-300"].map((c, i) => (
              <div
                key={i}
                className={`w-9 h-9 rounded-full border-2 border-[#F7F6F1] dark:border-[#0C0C10] ${c} flex items-center justify-center`}
              />
            ))}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Dipercaya <span className="font-bold text-slate-800 dark:text-slate-200">10.000+</span> pengguna aktif
          </div>
          <div className="hidden sm:flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
            ))}
            <span className="text-xs font-semibold text-slate-500 ml-1">4.9/5</span>
          </div>
        </div>

        {/* ── APP MOCKUP CARDS ──────────────────────────────────── */}
        <div className="relative max-w-4xl mx-auto animate-fade-up delay-500">
          <div className="grid grid-cols-12 gap-4">

            {/* Main Dashboard Card */}
            <div className="col-span-12 md:col-span-7 bento-card p-6 animate-float">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ringkasan Bulanan</p>
                  <h3
                    className="text-3xl font-black text-slate-900 dark:text-white"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    Rp 24.500.000
                  </h3>
                  <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                    <TrendingUp size={11} /> +8.2% dari bulan lalu
                  </span>
                </div>
                <div className="w-11 h-11 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                  <BarChart3 size={20} />
                </div>
              </div>
              <MiniBarChart />
            </div>

            {/* AI Insight Card */}
            <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
              <div className="bento-card p-5 flex-1 bg-gradient-to-br from-emerald-600 to-teal-700 border-0 shadow-xl shadow-emerald-600/20">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-white mb-4">
                  <Bot size={20} />
                </div>
                <p className="text-xs font-semibold text-emerald-100 mb-1 uppercase tracking-wide">AI Insight</p>
                <p className="text-base font-bold text-white leading-snug">
                  Pengeluaran makan siang turun{" "}
                  <span className="text-emerald-200">12%</span> bulan ini 🎉
                </p>
                <p className="text-xs text-emerald-200/80 mt-2 font-medium">
                  Hemat Rp 145.000 vs bulan lalu
                </p>
              </div>

              <div className="bento-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tabungan Liburan</p>
                  <Target size={15} className="text-amber-500" />
                </div>
                <div className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                  <span>Rp 3.750.000</span>
                  <span className="text-slate-400">/ 5.000.000</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000"
                    style={{ width: "75%" }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">75% tercapai · 2 bulan lagi</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="col-span-12 md:col-span-5 bento-card p-5 animate-float-rev">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Transaksi Terkini</p>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                <TxItem icon={<Zap size={15} />} label="Listrik PLN" sub="Kemarin" amount="Rp 285.000" positive={false} />
                <TxItem icon={<TrendingUp size={15} />} label="Gaji Bulanan" sub="1 Des" amount="Rp 8.500.000" positive={true} />
                <TxItem icon={<CreditCard size={15} />} label="Tokopedia" sub="30 Nov" amount="Rp 420.000" positive={false} />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="col-span-6 md:col-span-3.5 bento-card p-5 text-center">
              <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Pemasukan</p>
              <p className="text-xl font-black text-emerald-600" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                Rp 8,5 Jt
              </p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Desember 2024</p>
            </div>

            <div className="col-span-6 md:col-span-3.5 bento-card p-5 text-center">
              <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Pengeluaran</p>
              <p className="text-xl font-black text-rose-500" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                Rp 4,2 Jt
              </p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Desember 2024</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS TICKER ─────────────────────────────────────── */}
      <div className="py-14 px-6 border-y border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]" id="keunggulan">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 10000, suffix: "+", label: "Pengguna Aktif", color: "text-emerald-600" },
            { value: 2, suffix: " Miliar+", label: "Total Transaksi (Rp)", color: "text-sky-600" },
            { value: 99, suffix: ".9%", label: "Uptime Server", color: "text-indigo-600" },
            { value: 4, suffix: ".9 ★", label: "Rating Pengguna", color: "text-amber-500" },
          ].map((s, i) => (
            <div key={i} className="space-y-1">
              <div className={`text-3xl md:text-4xl font-black tabular-nums ${s.color}`} style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                <AnimatedNumber target={s.value} suffix={s.suffix} />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES BENTO ───────────────────────────────────── */}
      <section id="fitur" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-700/30 px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
              Fitur Unggulan
            </span>
            <h2
              className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Semua yang Kamu Butuhkan,
              <br />
              <span className="text-gradient-emerald">Dalam Satu Tempat</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
              Tinggalkan spreadsheet dan pencatatan manual. Semua alat finansial modern ada di sini.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {features.map((ft, i) => (
              <div
                key={i}
                className={`bento-card p-7 flex flex-col gap-4 ${ft.span}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${ft.bg} ${ft.fg} flex-shrink-0`}>
                  {ft.icon}
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white mb-2 tracking-tight">
                    {ft.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                    {ft.desc}
                  </p>
                </div>
                <div className={`mt-auto self-start flex items-center gap-1 text-xs font-bold ${ft.fg} opacity-80 group-hover:opacity-100 transition-opacity`}>
                  Pelajari lebih <ChevronRight size={13} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST SECTION ─────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white/60 dark:bg-white/[0.02] border-y border-black/5 dark:border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Shield size={22} />,
              title: "Enkripsi Bank-Level",
              desc: "Data keuanganmu dilindungi dengan enkripsi AES-256 dan protokol keamanan standar perbankan.",
              color: "text-emerald-600",
              bg: "bg-emerald-50 dark:bg-emerald-900/20",
            },
            {
              icon: <Zap size={22} />,
              title: "Sinkronisasi Real-Time",
              desc: "Setiap transaksi langsung tersinkronisasi di semua perangkat — HP, tablet, dan laptop.",
              color: "text-sky-600",
              bg: "bg-sky-50 dark:bg-sky-900/20",
            },
            {
              icon: <PieChart size={22} />,
              title: "Laporan Otomatis",
              desc: "Laporan keuangan bulanan dikirim otomatis setiap tanggal 1 via email — tanpa perlu request.",
              color: "text-indigo-600",
              bg: "bg-indigo-50 dark:bg-indigo-900/20",
            },
          ].map((t, i) => (
            <div key={i} className="flex gap-4">
              <div className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center ${t.bg} ${t.color}`}>
                {t.icon}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1.5">{t.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIAL MARQUEE ───────────────────────────────── */}
      <section className="py-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto mb-10 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Apa kata pengguna kami</p>
        </div>
        <div className="relative">
          <div className="flex gap-5 animate-marquee w-max">
            {[...Array(2)].flatMap((_, copyIndex) =>
              [
                { name: "Andi S.", loc: "Jakarta", text: "Akhirnya bisa tahu kemana uang gue pergi setiap bulan. Dompet Pintar is a game changer!", rating: 5 },
                { name: "Rara M.", loc: "Surabaya", text: "Fitur AI-nya keren banget, langsung kasih insight yang actionable. Beda sama aplikasi lain.", rating: 5 },
                { name: "Budi P.", loc: "Bandung", text: "Target tabungannya bikin aku lebih disiplin. Udah nabung 15 juta buat liburan ke Jepang!", rating: 5 },
                { name: "Siti N.", loc: "Medan", text: "Tampilannya bersih dan mudah dipahami. Untuk orang yang awam keuangan kayak aku, ini sempurna.", rating: 5 },
                { name: "Dito R.", loc: "Bali", text: "Portofolio saham dan reksa danaku bisa dipantau semua di sini. Nggak perlu buka banyak app.", rating: 5 },
              ].map((t, i) => (
                <div
                  key={`${copyIndex}-${i}-${t.name}`}
                  className="w-72 flex-shrink-0 bento-card p-5"
                >
                  <div className="flex items-center gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={13} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-4">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 flex items-center justify-center text-white text-xs font-bold">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{t.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{t.loc}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#F7F6F1] dark:from-[#0C0C10] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#F7F6F1] dark:from-[#0C0C10] to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-24 px-6 mx-6 mb-10 rounded-[40px] relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 shadow-2xl shadow-emerald-900/20">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-white/90 text-xs font-bold uppercase tracking-widest mb-8">
            <Sparkles size={12} /> Gratis Selamanya
          </div>
          <h2
            className="text-4xl md:text-6xl font-black text-white tracking-tight mb-5 leading-[1.05]"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Mulai Perjalanan
            <br />
            <span className="italic font-light opacity-90">Finansialmu</span> Hari Ini
          </h2>
          <p className="text-emerald-100/80 text-lg font-medium mb-10 max-w-md mx-auto leading-relaxed">
            Bergabung dengan ribuan pengguna yang sudah mencapai kebebasan finansial bersama Dompet Pintar.
          </p>
          <Link
            href="/login"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-emerald-700 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20 text-lg"
          >
            Buat Akun Gratis
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-emerald-200/60 text-xs font-medium mt-4">
            Tidak perlu kartu kredit · Setup dalam 2 menit
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="px-6 pb-10 pt-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-8 border-t border-black/5 dark:border-white/5">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Wallet size={15} className="text-white" />
              </div>
              <span
                className="text-lg font-black text-slate-800 dark:text-white"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                Dompet<span className="text-emerald-600">.</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-400">
              {["Privacy Policy", "Terms of Service", "Contact Support", "Blog"].map((l) => (
                <a key={l} href="#" className="hover:text-emerald-600 transition-colors">
                  {l}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-xs text-slate-400 font-medium text-center md:text-right">
              © {new Date().getFullYear()} Dompet Pintar.
              <br className="md:hidden" />
              {" "}Build by Dewa Sinar Surya,S,Kom. ❤️ in Indonesia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}