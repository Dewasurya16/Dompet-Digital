"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, Loader2, Sparkles, X, Zap, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

/* ── TOAST ──────────────────────────────────────────────────── */
const Toast = Swal.mixin({
  toast: true, position: "top-end", showConfirmButton: false,
  timer: 3500, timerProgressBar: true,
  didOpen: (t) => { t.onmouseenter = Swal.stopTimer; t.onmouseleave = Swal.resumeTimer; },
});
const showToast = (icon: "success" | "error" | "info" | "warning", title: string) =>
  Toast.fire({ icon, title });

/* ── WALLET ILLUSTRATION ────────────────────────────────────── */
function WalletIllustration() {
  return (
    <svg viewBox="0 0 420 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-[420px]">
      <defs>
        <radialGradient id="wbody" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#065F46" />
        </radialGradient>
        <radialGradient id="cgold" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
        <radialGradient id="cgreen" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#059669" />
        </radialGradient>
        <style>{`
          @keyframes f1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes f2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
          @keyframes f3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
          @keyframes ps  { 0%,100%{opacity:.3;r:5} 50%{opacity:1;r:7} }
          .fl1{animation:f1 4s ease-in-out infinite}
          .fl2{animation:f2 5s ease-in-out .8s infinite}
          .fl3{animation:f3 3.5s ease-in-out .4s infinite}
          .fl4{animation:f2 6s ease-in-out 1.5s infinite}
        `}</style>
      </defs>

      {/* BG blobs */}
      <circle cx="70" cy="430" r="130" fill="rgba(255,255,255,0.07)" />
      <circle cx="360" cy="70" r="100" fill="rgba(255,255,255,0.05)" />

      {/* Stars */}
      {[[340, 430, 6], [55, 210, 5], [390, 280, 4], [160, 80, 6]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="rgba(255,255,255,0.55)"
          style={{ animation: `ps ${2 + i * 0.5}s ease-in-out ${i * 0.4}s infinite` }} />
      ))}

      {/* Gold coin */}
      <g className="fl3">
        <circle cx="355" cy="360" r="32" fill="url(#cgold)" />
        <circle cx="355" cy="360" r="24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        <text x="355" y="367" textAnchor="middle" fontSize="17" fontWeight="900" fill="#92400E">Rp</text>
      </g>

      {/* Small green coin */}
      <g className="fl2">
        <circle cx="62" cy="340" r="24" fill="url(#cgreen)" />
        <text x="62" y="347" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#065F46">$</text>
      </g>

      {/* Tiny coin */}
      <g className="fl4">
        <circle cx="385" cy="160" r="18" fill="#FCD34D" />
        <text x="385" y="166" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#92400E">¥</text>
      </g>

      {/* Receipt card (rotated, floating) */}
      <g className="fl4" style={{ transformOrigin: "340px 110px" }}>
        <rect x="295" y="50" width="90" height="110" rx="10" fill="white" opacity="0.88" transform="rotate(14 340 110)" />
        <rect x="306" y="68" width="68" height="5" rx="2.5" fill="#D1D5DB" transform="rotate(14 340 110)" />
        <rect x="306" y="82" width="50" height="5" rx="2.5" fill="#E5E7EB" transform="rotate(14 340 110)" />
        <rect x="306" y="96" width="60" height="5" rx="2.5" fill="#E5E7EB" transform="rotate(14 340 110)" />
        <rect x="306" y="114" width="44" height="12" rx="4" fill="#059669" opacity="0.7" transform="rotate(14 340 110)" />
      </g>

      {/* Mini bar chart */}
      <g className="fl2">
        <rect x="28" y="415" width="72" height="62" rx="10" fill="rgba(255,255,255,0.13)" />
        {[18, 30, 22, 38].map((h, i) => (
          <rect key={i} x={40 + i * 15} y={455 - h} width="9" rx="3" height={h} fill="rgba(255,255,255,0.55)" />
        ))}
      </g>

      {/* Shadow */}
      <ellipse cx="210" cy="458" rx="90" ry="14" fill="rgba(0,0,0,0.13)" />

      {/* Main wallet body */}
      <g className="fl1">
        {/* Body */}
        <rect x="88" y="175" width="244" height="262" rx="34" fill="url(#wbody)" />
        {/* Top flap */}
        <rect x="88" y="175" width="244" height="90" rx="34" fill="#059669" />
        <rect x="88" y="243" width="244" height="32" fill="#059669" />
        {/* Clasp */}
        <rect x="160" y="152" width="100" height="46" rx="16" fill="#34D399" />
        <rect x="174" y="164" width="72" height="20" rx="10" fill="#065F46" />
        {/* Card lines */}
        <rect x="118" y="305" width="184" height="7" rx="3.5" fill="rgba(255,255,255,0.14)" />
        <rect x="118" y="322" width="150" height="7" rx="3.5" fill="rgba(255,255,255,0.09)" />
        <rect x="118" y="339" width="120" height="7" rx="3.5" fill="rgba(255,255,255,0.07)" />
        {/* Eyes */}
        <ellipse cx="173" cy="243" rx="20" ry="22" fill="white" />
        <ellipse cx="247" cy="243" rx="20" ry="22" fill="white" />
        <circle cx="176" cy="246" r="12" fill="#0C4A2D" />
        <circle cx="250" cy="246" r="12" fill="#0C4A2D" />
        <circle cx="180" cy="241" r="4.5" fill="white" />
        <circle cx="254" cy="241" r="4.5" fill="white" />
        {/* Eyelashes */}
        <path d="M155 228 Q159 220 167 224" stroke="#0C4A2D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M192 228 Q190 220 184 223" stroke="#0C4A2D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M229 228 Q233 220 241 224" stroke="#0C4A2D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M266 228 Q264 220 258 223" stroke="#0C4A2D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Blush */}
        <ellipse cx="145" cy="268" rx="16" ry="10" fill="rgba(255,80,80,0.22)" />
        <ellipse cx="275" cy="268" rx="16" ry="10" fill="rgba(255,80,80,0.22)" />
        {/* Smile */}
        <path d="M176 288 Q210 316 244 288" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {/* Hands */}
        <ellipse cx="88" cy="320" rx="24" ry="20" fill="#34D399" />
        <ellipse cx="332" cy="320" rx="24" ry="20" fill="#34D399" />
        <ellipse cx="72" cy="304" rx="9" ry="13" fill="#34D399" />
        <ellipse cx="85" cy="298" rx="9" ry="13" fill="#34D399" />
        <ellipse cx="100" cy="298" rx="9" ry="13" fill="#34D399" />
        <ellipse cx="316" cy="304" rx="9" ry="13" fill="#34D399" />
        <ellipse cx="329" cy="298" rx="9" ry="13" fill="#34D399" />
        <ellipse cx="344" cy="298" rx="9" ry="13" fill="#34D399" />
      </g>
    </svg>
  );
}

/* ── STYLED INPUT ───────────────────────────────────────────── */
function FormInput({
  label, icon, type, placeholder, value, onChange, disabled, right, hint,
}: {
  label: string; icon: React.ReactNode; type: string; placeholder: string;
  value: string; onChange: (v: string) => void; disabled?: boolean;
  right?: React.ReactNode; hint?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-[13px] font-semibold text-slate-700">{label}</label>
        {hint}
      </div>
      <div className="flex items-center rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all focus-within:border-emerald-500 focus-within:shadow-[0_0_0_4px_rgba(5,150,105,0.08)]">
        <span className="pl-4 pr-3 text-slate-400 flex-shrink-0">{icon}</span>
        <div className="w-px h-5 bg-slate-200 flex-shrink-0" />
        <input
          required type={type} placeholder={placeholder}
          value={value} onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 px-4 py-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-300 outline-none bg-transparent disabled:opacity-50"
        />
        {right}
      </div>
    </div>
  );
}

/* ── PAGE ───────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isRegistering, setReg] = useState(false);
  const [useMagicLink, setMagic] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/dashboard");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((ev, s) => {
      if (ev === "SIGNED_IN" && s) router.push("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (useMagicLink) {
      const { error } = await supabase.auth.signInWithOtp({
        email, options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      setLoading(false);
      if (error) {
        showToast("error", error.message === "Signups not allowed for otp"
          ? "Email belum terdaftar. Daftar dulu ya!" : error.message);
      } else {
        await Swal.fire({
          icon: "success", title: "✨ Magic Link Terkirim!",
          html: `<p style="color:#64748B">Cek inbox kamu di <strong style="color:#059669">${email}</strong></p>`,
          confirmButtonColor: "#059669", confirmButtonText: "Cek Email",
        });
        setMagic(false);
      }
      return;
    }

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) { showToast("error", error.message); return; }
      await Swal.fire({
        icon: "success", title: "🎉 Akun Berhasil Dibuat!",
        html: `<p style="color:#64748B">Silakan masuk dengan akun baru kamu.</p>`,
        confirmButtonColor: "#059669", confirmButtonText: "Masuk Sekarang",
      });
      fetch("/api/send-notification", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "welcome" }),
      }).catch(console.error);
      setReg(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      await Swal.fire({
        icon: "error", title: "Login Gagal",
        text: "Email atau password salah.",
        confirmButtonColor: "#059669",
        footer: `<a href="#" style="color:#059669">Lupa password?</a>`,
      });
    } else {
      showToast("success", "Selamat datang kembali! 👋");
    }
  };

  const handleDemo = async () => {
    const r = await Swal.fire({
      icon: "info", title: "Masuk sebagai Demo?",
      text: "Gunakan akun demo dengan data contoh.",
      showCancelButton: true, confirmButtonColor: "#059669",
      cancelButtonColor: "#94A3B8", confirmButtonText: "Ya, Masuk Demo",
    });
    if (!r.isConfirmed) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: "demo@dompet.com", password: "123456" });
    setLoading(false);
    if (error) showToast("error", "Gagal masuk akun demo.");
  };

  return (
    <div
      className="min-h-screen bg-[#E8F3EE] flex items-center justify-center p-4 sm:p-8"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* ── CARD ───────────────────────────────────────────────── */}
      <div className="w-full max-w-[940px] bg-white rounded-[36px] shadow-2xl shadow-emerald-900/10 overflow-hidden flex relative" style={{ minHeight: 600 }}>

        {/* ── LEFT PANEL ──────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[45%] flex-col relative overflow-hidden bg-gradient-to-b from-emerald-400 to-teal-600">
          {/* Decorative circles */}
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -right-16 w-60 h-60 rounded-full bg-teal-700/25" />
          <div className="absolute top-1/2 -right-10 w-40 h-40 rounded-full bg-emerald-300/20" />

          {/* Logo */}
          <div className="relative z-10 p-9">
            <span className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Dompet<span className="opacity-50">.</span>
            </span>
          </div>

          {/* Illustration */}
          <div className="flex-1 flex items-center justify-center px-8 relative z-10">
            <WalletIllustration />
          </div>

          {/* Tagline */}
          <div className="relative z-10 p-9 pt-0">
            <p className="text-white/80 text-sm font-medium leading-relaxed">
              Digunakan oleh <span className="text-white font-bold">10.000+</span> pengguna aktif
              untuk mencapai kebebasan finansial. 🚀
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 py-12 relative">

          {/* Close button */}
          <Link
            href="/"
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={16} />
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <span className="text-2xl font-black text-slate-900" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Dompet<span className="text-emerald-500">.</span>
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-4xl font-black text-slate-900 mb-1"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            {isRegistering ? "Daftar" : useMagicLink ? "Magic Link ✨" : "Login"}
          </h1>
          <p className="text-sm text-slate-400 font-medium mb-8">
            {isRegistering
              ? "Buat akun gratis dan mulai kelola keuanganmu."
              : useMagicLink
                ? "Masukkan email, kami kirim link ajaib tanpa password."
                : "Masuk ke dashboard kamu dan pantau keuanganmu."}
          </p>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <FormInput
              label="Email"
              icon={<Mail size={16} />}
              type="email" placeholder="contoh@email.com"
              value={email} onChange={setEmail} disabled={loading}
            />

            {!useMagicLink && (
              <FormInput
                label="Password"
                icon={<Lock size={16} />}
                type={showPass ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={password} onChange={setPassword} disabled={loading}
                hint={
                  !isRegistering && (
                    <a href="#" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                      Forgot Password?
                    </a>
                  )
                }
                right={
                  <button type="button" tabIndex={-1} onClick={() => setShowPass(!showPass)}
                    className="pr-4 text-slate-300 hover:text-slate-500 transition-colors">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full py-4 mt-1 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader2 size={18} className="animate-spin" />
                : isRegistering ? "Buat Akun 🚀"
                  : useMagicLink ? "Kirim Magic Link"
                    : "Log In"}
            </button>
          </form>

          {/* Alt options */}
          {!isRegistering && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Atau Lanjutkan Dengan</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div className="flex items-center justify-center gap-4">
                {/* Magic Link */}
                <button type="button" disabled={loading} onClick={() => setMagic(!useMagicLink)}
                  className={`w-14 h-14 rounded-2xl border transition-all shadow-sm flex items-center justify-center group ${useMagicLink
                    ? "border-sky-400 bg-sky-50 text-sky-500"
                    : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 text-slate-400 hover:text-sky-500"
                    }`}>
                  <Zap size={20} className="group-hover:scale-110 transition-transform" />
                </button>

                {/* Demo */}
                <button type="button" disabled={loading} onClick={handleDemo}
                  className="w-14 h-14 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-all shadow-sm flex items-center justify-center group">
                  <Sparkles size={20} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </>
          )}

          {/* Toggle */}
          <p className="text-center text-sm text-slate-400 font-medium mt-8">
            {isRegistering ? "Sudah punya akun? " : "Belum punya akun? "}
            <button
              onClick={() => { setReg(!isRegistering); setMagic(false); }}
              className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              {isRegistering ? "Login di sini" : "Sign Up here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}