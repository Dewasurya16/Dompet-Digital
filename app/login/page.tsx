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
  background: '#FDFBF7',
  color: '#0B3E3A',
  customClass: { popup: 'border-[3px] border-[#0B3E3A] rounded-xl shadow-[4px_4px_0_0_#0B3E3A] font-black text-sm' },
  didOpen: (t) => { t.onmouseenter = Swal.stopTimer; t.onmouseleave = Swal.resumeTimer; },
});
const showToast = (icon: "success" | "error" | "info" | "warning", title: string) =>
  Toast.fire({ icon, title });

const swalCartoon = {
  background: '#FDFBF7',
  color: '#0B3E3A',
  customClass: {
    popup: 'border-[4px] border-[#0B3E3A] rounded-2xl shadow-[8px_8px_0_0_#0B3E3A] font-black',
    confirmButton: 'rounded-xl font-black border-[3px] border-[#0B3E3A] shadow-[3px_3px_0_0_#0B3E3A] px-6 py-3',
    cancelButton: 'rounded-xl font-black border-[3px] border-[#0B3E3A] shadow-[3px_3px_0_0_#0B3E3A] px-6 py-3',
  }
};

/* ── PLAYFUL, CARTOON-STYLE WALLET ILLUSTRATION ────────────── */
function CartoonWalletIllustration() {
  return (
    <svg viewBox="0 0 420 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-[420px]">
      <defs>
        <radialGradient id="wbody" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#146A64" />
          <stop offset="100%" stopColor="#0B3E3A" />
        </radialGradient>
        <radialGradient id="cgold" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>
        <radialGradient id="cbronze" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="100%" stopColor="#991B1B" />
        </radialGradient>
        <radialGradient id="ccard" cx="20%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#042F2E" />
        </radialGradient>
        <style>{`
          /* Pronounced, bouncy bobbing (vertical) */
          @keyframes p-bob-vert {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-30px); }
          }
          /* Pronounced vertical jump with tilt */
          @keyframes p-bounce-vert-tilt {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-10px) rotate(5deg); }
            50% { transform: translateY(-35px) rotate(0deg); }
          }
          /* Pronounced horizontal wobble */
          @keyframes p-wobble-hor {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(15px); }
          }
          /* Subtle continuous spin */
          @keyframes p-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          /* Wiggle effect for items */
          @keyframes p-wiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(7deg); }
            75% { transform: rotate(-7deg); }
          }
          /* Fast and energetic pulsate */
          @keyframes p-energetic-pulsate {
            0%, 100% { opacity: 0.2; r: 3; }
            50% { opacity: 1; r: 6; }
          }
          
          /* Animation Classes */
          .anim-bob-vert { animation: p-bob-vert 4s ease-in-out infinite; }
          .anim-bounce-vert-tilt { animation: p-bounce-vert-tilt 4s ease-in-out infinite; }
          .anim-wobble-hor { animation: p-wobble-hor 5s ease-in-out infinite; }
          .anim-spin-item { animation: p-spin 10s linear infinite; transform-origin: center; }
          .anim-wiggle-item { animation: p-wiggle 3s ease-in-out infinite; }
          .anim-pulsate-stars { animation: p-energetic-pulsate 1.5s ease-in-out infinite; }

          /* Adding staggered delays for a more alive feel */
          .anim-delay-05s { animation-delay: 0.5s; }
          .anim-delay-1s { animation-delay: 1s; }
          .anim-delay-15s { animation-delay: 1.5s; }
          
          /* Ensuring transform-origin is set for local items like coins, cards, etc. */
          g.anim-wiggle-item, g.anim-spin-item { transform-origin: center; }
          
        `}</style>
      </defs>

      {/* Abstract Background Waves */}
      <path d="M 0 350 Q 150 250 420 350 L 420 500 L 0 500 Z" fill="rgba(255,255,255,0.03)" />
      <path d="M 0 400 Q 200 300 420 450 L 420 500 L 0 500 Z" fill="rgba(255,255,255,0.02)" />

      {/* Pulsating Stars/Sparks */}
      {[[340, 430, 4], [55, 210, 3], [390, 200, 4], [160, 80, 5]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#FDE68A" className={`anim-pulsate-stars anim-delay-${i * 5}s`}
          style={{ animationDelay: `${i * 0.3}s` }} />
      ))}

      {/* Bronze Coin (Rp) */}
      <g className="anim-bounce-vert-tilt anim-wiggle-item anim-delay-05s" style={{ transformOrigin: "80px 180px" }}>
        <circle cx="80" cy="180" r="30" fill="url(#cbronze)" />
        <circle cx="80" cy="180" r="23" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <text x="80" y="186" textAnchor="middle" fontSize="16" fontWeight="900" fill="#FEF2F2">Rp</text>
      </g>

      {/* Gold Coin ($) */}
      <g className="anim-bounce-vert-tilt anim-wiggle-item anim-spin-item" style={{ transformOrigin: "280px 110px" }}>
        <circle cx="280" cy="110" r="26" fill="url(#cgold)" />
        <circle cx="280" cy="110" r="20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <text x="280" y="116" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#78350F">$</text>
      </g>

      {/* Mini Gold Coin (¥) */}
      <g className="anim-wobble-hor anim-wiggle-item anim-delay-15s" style={{ transformOrigin: "160px 130px" }}>
        <circle cx="160" cy="130" r="18" fill="url(#cgold)" />
        <text x="160" y="135" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#78350F">¥</text>
      </g>

      {/* Receipt Card */}
      <g className="anim-bob-vert anim-wiggle-item anim-delay-1s" style={{ transformOrigin: "320px 280px" }}>
        <rect x="270" y="220" width="100" height="130" rx="6" fill="#F8FAFC" opacity="0.95" />
        <text x="320" y="245" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0F4C46">Receipt</text>
        <rect x="285" y="255" width="70" height="2" fill="#CBD5E1" />
        <rect x="285" y="265" width="50" height="4" rx="2" fill="#94A3B8" />
        <rect x="285" y="275" width="60" height="4" rx="2" fill="#94A3B8" />
        <rect x="285" y="285" width="40" height="4" rx="2" fill="#94A3B8" />
        <rect x="285" y="315" width="50" height="10" rx="3" fill="#0F4C46" opacity="0.8" />
      </g>

      {/* Bar Chart Element */}
      <g className="anim-wobble-hor anim-wiggle-item">
        <rect x="40" y="290" width="100" height="90" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        <rect x="55" y="340" width="12" rx="3" height="25" fill="#6EE7B7" />
        <rect x="75" y="320" width="12" rx="3" height="45" fill="#34D399" />
        <rect x="95" y="300" width="12" rx="3" height="65" fill="#FDE68A" />
        <rect x="115" y="330" width="12" rx="3" height="35" fill="#FCD34D" />
      </g>

      {/* Main Wallet Base */}
      <ellipse cx="210" cy="360" rx="100" ry="15" fill="rgba(0,0,0,0.2)" />

      {/* Wallet Body with pronounced vertical bob */}
      <g className="anim-bob-vert anim-wiggle-item" style={{ transformOrigin: "210px 180px" }}>
        {/* Wallet Back */}
        <rect x="110" y="180" width="200" height="140" rx="16" fill="#063430" />
        {/* Cash inside */}
        <rect x="125" y="165" width="170" height="40" rx="6" fill="#6EE7B7" transform="rotate(-5 210 180)" />
        <rect x="120" y="170" width="180" height="40" rx="6" fill="#34D399" />

        {/* Wallet Front */}
        <rect x="110" y="195" width="200" height="125" rx="16" fill="url(#wbody)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

        {/* Wallet Flap */}
        <path d="M 110 195 Q 210 240 310 195 L 310 260 Q 210 290 110 260 Z" fill="#115E59" />

        {/* Gold Clasp */}
        <circle cx="210" cy="245" r="10" fill="#FDE68A" />
        <circle cx="210" cy="245" r="6" fill="#D97706" />
      </g>

      {/* Floating Emerald Card */}
      <g className="anim-bounce-vert-tilt anim-wiggle-item anim-delay-05s" style={{ transformOrigin: "280px 380px" }}>
        <rect x="220" y="340" width="120" height="75" rx="8" fill="url(#ccard)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <text x="235" y="360" fontSize="10" fontWeight="bold" fill="#F1F5F9" letterSpacing="1">Emerald Card</text>
        {/* Chip */}
        <rect x="235" y="375" width="16" height="12" rx="2" fill="#FDE68A" />
        {/* Master Card Logo Fake */}
        <circle cx="310" cy="395" r="8" fill="#94A3B8" opacity="0.6" />
        <circle cx="320" cy="395" r="8" fill="#CBD5E1" opacity="0.6" />
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
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-[13px] font-semibold text-[#0B3E3A]">{label}</label>
        {hint}
      </div>
      <div className="flex items-center rounded-xl border border-[#CBD5E1] bg-white overflow-hidden transition-all focus-within:border-[#0F766E] focus-within:shadow-[0_0_0_3px_rgba(15,118,110,0.1)]">
        <span className="pl-4 pr-3 text-[#94A3B8] flex-shrink-0">{icon}</span>
        <div className="w-px h-5 bg-[#E2E8F0] flex-shrink-0" />
        <input
          required type={type} placeholder={placeholder}
          value={value} onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 px-4 py-3 text-sm font-medium text-[#0B3E3A] placeholder:text-[#94A3B8] outline-none bg-transparent disabled:opacity-50"
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
      // Selalu redirect ke domain utama production
      const redirectTo = 'https://www.mydompetdigital.my.id/dashboard';
      const { error } = await supabase.auth.signInWithOtp({
        email, options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
      });
      setLoading(false);
      if (error) {
        showToast("error", error.message === "Signups not allowed for otp"
          ? "Email belum terdaftar. Daftar dulu ya!" : error.message);
      } else {
        await Swal.fire({
          ...swalCartoon,
          icon: "success", title: "✨ Magic Link Terkirim!",
          html: `<p style="color:#0B3E3A;font-weight:bold;">Cek inbox kamu di <strong style="color:#0F766E;">${email}</strong> dan klik link yang dikirim. Link akan redirect ke <strong>mydompetdigital.my.id</strong></p>`,
          confirmButtonColor: "#10B981", confirmButtonText: "Oke, Cek Email! 📫",
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
        ...swalCartoon,
        icon: "success", title: "🎉 Akun Berhasil Dibuat!",
        html: `<p style="color:#0B3E3A;font-weight:bold;">Silakan masuk dengan akun baru kamu.</p>`,
        confirmButtonColor: "#10B981", confirmButtonText: "Masuk Sekarang →",
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
        ...swalCartoon,
        icon: "error", title: "🚨 Login Gagal",
        html: `<p style="color:#0B3E3A;font-weight:bold;">Email atau password salah. Coba lagi ya!</p>`,
        confirmButtonColor: "#F43F5E", confirmButtonText: "Coba Lagi",
      });
    } else {
      showToast("success", "Selamat datang kembali! 👋");
    }
  };

  const handleDemo = async () => {
    const r = await Swal.fire({
      ...swalCartoon,
      icon: "info", title: "🎮 Masuk sebagai Demo?",
      html: `<p style="color:#0B3E3A;font-weight:bold;">Gunakan akun demo dengan data contoh.</p>`,
      showCancelButton: true, confirmButtonColor: "#10B981",
      cancelButtonColor: "#94A3B8", confirmButtonText: "Ya, Masuk Demo! ⚡",
      cancelButtonText: "Batal",
    });
    if (!r.isConfirmed) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: "demo@dompet.com", password: "123456" });
    setLoading(false);
    if (error) showToast("error", "Gagal masuk akun demo.");
  };

  return (
    <div
      className="min-h-screen bg-[#F0EEE4] flex items-center justify-center p-4 sm:p-6"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* ── CARD ───────────────────────────────────────────────── */}
      <div className="w-full max-w-[980px] bg-[#FBF9F1] rounded-[24px] shadow-2xl shadow-[#0B3E3A]/10 overflow-hidden flex relative border border-[#E5E0D8]" style={{ minHeight: 600 }}>

        {/* ── LEFT PANEL ──────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[45%] flex-col relative overflow-hidden bg-gradient-to-br from-[#0F4C46] to-[#062623]">

          {/* Decorative glow */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#147067]/40 via-transparent to-transparent pointer-events-none" />

          {/* Logo */}
          <div className="relative z-10 p-10 pb-0 flex items-center gap-3">
            <div className="w-16 h-16 bg-white rounded-2xl border-[3px] border-white/40 shadow-[4px_4px_0_0_rgba(255,255,255,0.3)] flex items-center justify-center p-1.5 overflow-hidden shrink-0">
              <img src="/logo.png" alt="Dompet Digital" className="w-full h-full object-contain" />
            </div>
            <span className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Dompet<span className="text-[#FDE68A]">.</span>
            </span>
          </div>

          {/* Illustration with new cartoon-style animations */}
          <div className="flex-1 flex items-center justify-center px-6 relative z-10">
            <CartoonWalletIllustration />
          </div>

          {/* Tagline */}
          <div className="relative z-10 p-10 pt-0">
            <p className="text-white/80 text-sm font-medium leading-relaxed max-w-xs">
              Akses dasbor keuangan pribadi Anda dan pantau pertumbuhan kekayaan Anda dengan elegan.
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL (Tightened Layout) ───────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 py-8 relative">

          {/* Close button */}
          <Link
            href="/"
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#0F766E] transition-all shadow-sm"
          >
            <X size={18} />
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden mb-4 flex items-center gap-3">
            <div className="w-14 h-14 bg-white border-[3px] border-[#0B3E3A] rounded-2xl shadow-[3px_3px_0_0_#0B3E3A] flex items-center justify-center p-1.5 overflow-hidden shrink-0">
              <img src="/logo.png" alt="Dompet Digital" className="w-full h-full object-contain" />
            </div>
            <span className="text-3xl font-black text-[#0B3E3A]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Dompet<span className="text-[#0F766E]">.</span>
            </span>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h1
              className="text-4xl sm:text-[40px] font-black text-[#0B3E3A] mb-1.5 leading-tight"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              {isRegistering ? "Create Account" : useMagicLink ? "Magic Link" : "Welcome to Dompet."}
            </h1>
            <p className="text-sm text-[#64748B] font-medium">
              {isRegistering
                ? "Daftar sekarang untuk memulai perjalanan finansial Anda."
                : useMagicLink
                  ? "Masukkan email, kami kirimkan akses instan tanpa kata sandi."
                  : "Log in to your account untuk melanjutkan."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <FormInput
              label="Email Address"
              icon={<Mail size={18} />}
              type="email" placeholder="Enter your email"
              value={email} onChange={setEmail} disabled={loading}
            />

            {!useMagicLink && (
              <FormInput
                label="Password"
                icon={<Lock size={18} />}
                type={showPass ? "text" : "password"}
                placeholder="Kata Sandi"
                value={password} onChange={setPassword} disabled={loading}
                hint={
                  !isRegistering && (
                    <a href="#" className="text-xs font-semibold text-[#0F766E] hover:text-[#0B3E3A] transition-colors">
                      Forgot Password?
                    </a>
                  )
                }
                right={
                  <button type="button" tabIndex={-1} onClick={() => setShowPass(!showPass)}
                    className="pr-4 text-[#94A3B8] hover:text-[#0F766E] transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-[#0B3E3A] hover:bg-[#072926] active:scale-[0.98] text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader2 size={18} className="animate-spin" />
                : isRegistering ? "Create Account"
                  : useMagicLink ? "Send Magic Link"
                    : "Log In"}
            </button>
          </form>

          {/* Alt options */}
          {!isRegistering && (
            <>
              <div className="flex items-center gap-4 my-5">
                <div className="flex-1 h-px bg-[#E2E8F0]" />
                <span className="text-[11px] uppercase tracking-widest text-[#94A3B8] font-bold">Or Continue With</span>
                <div className="flex-1 h-px bg-[#E2E8F0]" />
              </div>

              <div className="space-y-3">
                {/* Magic Link */}
                <button type="button" disabled={loading} onClick={() => setMagic(!useMagicLink)}
                  className={`w-full p-3 rounded-xl border transition-all flex items-center gap-4 group ${useMagicLink
                    ? "border-[#0F766E] bg-[#F0FDF4] text-[#0F766E]"
                    : "border-[#E2E8F0] bg-white hover:border-[#0F766E] hover:bg-[#F8FAFC]"
                    }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${useMagicLink ? 'bg-[#0F766E] text-white' : 'bg-[#F1F5F9] text-[#0F766E]'}`}>
                    <Zap size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#0B3E3A]">Magic Link Zap</p>
                    <p className="text-xs text-[#64748B] font-medium">Enter email, we'll send a passwordless magic link.</p>
                  </div>
                </button>

                {/* Demo */}
                <button type="button" disabled={loading} onClick={handleDemo}
                  className="w-full p-3 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#D97706] hover:bg-[#FFFBEB] transition-all flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#0B3E3A]">Demo Sparkles</p>
                    <p className="text-xs text-[#64748B] font-medium">Use demo account with example data.</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* Toggle */}
          <p className="text-left text-sm text-[#64748B] font-medium mt-6">
            {isRegistering ? "Already have an account? " : "Belum punya akun? "}
            <button
              onClick={() => { setReg(!isRegistering); setMagic(false); }}
              className="font-bold text-[#0F766E] hover:text-[#0B3E3A] transition-colors underline decoration-[#0F766E]/30 underline-offset-4"
            >
              {isRegistering ? "Log In here" : "Daftar di sini"}
            </button>
            {!isRegistering && ". Akses demo untuk mencoba fitur kami."}
          </p>
        </div>
      </div>
    </div>
  );
}