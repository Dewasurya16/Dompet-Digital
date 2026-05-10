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

/* ── NEO-BRUTALISM WALLET ILLUSTRATION ─────────────────────── */
function ComicWalletIllustration() {
  return (
    <svg viewBox="0 0 420 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-[420px] overflow-visible">
      <defs>
        <style>{`
          /* Animations matching the landing page */
          @keyframes p-bob-vert { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
          @keyframes p-bounce-vert-tilt { 0%, 100% { transform: translateY(0) rotate(0deg); } 25% { transform: translateY(-10px) rotate(4deg); } 50% { transform: translateY(-25px) rotate(-2deg); } }
          @keyframes p-wobble-hor { 0%, 100% { transform: translateX(0) rotate(0deg); } 50% { transform: translateX(12px) rotate(3deg); } }
          
          .anim-bob-vert { animation: p-bob-vert 4s ease-in-out infinite; }
          .anim-bounce-vert-tilt { animation: p-bounce-vert-tilt 5s ease-in-out infinite; }
          .anim-wobble-hor { animation: p-wobble-hor 6s ease-in-out infinite; }
          
          .anim-delay-05s { animation-delay: 0.5s; }
          .anim-delay-1s { animation-delay: 1s; }
          .anim-delay-15s { animation-delay: 1.5s; }
        `}</style>
      </defs>

      {/* Decorative Polka Dots */}
      <circle cx="60" cy="400" r="40" fill="#FDE68A" className="anim-wobble-hor anim-delay-1s" stroke="#0B3E3A" strokeWidth="4" />
      <circle cx="360" cy="100" r="60" fill="#34D399" className="anim-bounce-vert-tilt anim-delay-05s" stroke="#0B3E3A" strokeWidth="4" />

      {/* Sparkles */}
      <path d="M 330 380 Q 340 380 340 370 Q 340 380 350 380 Q 340 380 340 390 Q 340 380 330 380" fill="#0B3E3A" className="anim-bob-vert" />
      <path d="M 80 120 Q 90 120 90 110 Q 90 120 100 120 Q 90 120 90 130 Q 90 120 80 120" fill="#0B3E3A" className="anim-bob-vert anim-delay-15s" />

      {/* Background Shadow Blob */}
      <ellipse cx="210" cy="420" rx="140" ry="20" fill="#0B3E3A" opacity="0.15" />

      {/* --- FLOATING ITEMS --- */}

      {/* Receipt / Invoice */}
      <g className="anim-wobble-hor anim-delay-05s" style={{ transformOrigin: "320px 240px" }}>
        <rect x="250" y="160" width="120" height="150" rx="8" fill="white" stroke="#0B3E3A" strokeWidth="4" transform="rotate(12 310 235)" />
        {/* Lines */}
        <rect x="270" y="190" width="80" height="6" fill="#0B3E3A" rx="3" transform="rotate(12 310 235)" />
        <rect x="270" y="210" width="60" height="6" fill="#0B3E3A" rx="3" transform="rotate(12 310 235)" />
        <rect x="270" y="230" width="70" height="6" fill="#0B3E3A" rx="3" transform="rotate(12 310 235)" />
        {/* Total Box */}
        <rect x="270" y="260" width="60" height="16" fill="#FDE68A" stroke="#0B3E3A" strokeWidth="3" rx="4" transform="rotate(12 310 235)" />
      </g>

      {/* Chart Box */}
      <g className="anim-bounce-vert-tilt anim-delay-15s" style={{ transformOrigin: "80px 280px" }}>
        <rect x="20" y="220" width="100" height="110" rx="12" fill="#BAE6FD" stroke="#0B3E3A" strokeWidth="4" transform="rotate(-8 70 275)" />
        {/* Bars */}
        <rect x="35" y="280" width="16" height="30" fill="#10B981" stroke="#0B3E3A" strokeWidth="3" rx="4" transform="rotate(-8 70 275)" />
        <rect x="60" y="250" width="16" height="60" fill="#FDE68A" stroke="#0B3E3A" strokeWidth="3" rx="4" transform="rotate(-8 70 275)" />
        <rect x="85" y="270" width="16" height="40" fill="#F43F5E" stroke="#0B3E3A" strokeWidth="3" rx="4" transform="rotate(-8 70 275)" />
      </g>

      {/* --- MAIN WALLET --- */}
      <g className="anim-bob-vert" style={{ transformOrigin: "210px 250px" }}>
        {/* Wallet Back / Inside */}
        <rect x="90" y="160" width="240" height="150" rx="24" fill="#059669" stroke="#0B3E3A" strokeWidth="4" />

        {/* Cash 1 */}
        <rect x="110" y="140" width="180" height="50" rx="8" fill="#A7F3D0" stroke="#0B3E3A" strokeWidth="4" transform="rotate(-5 200 165)" />
        <circle cx="200" cy="165" r="12" fill="#10B981" stroke="#0B3E3A" strokeWidth="3" transform="rotate(-5 200 165)" />

        {/* Cash 2 */}
        <rect x="130" y="130" width="180" height="50" rx="8" fill="#34D399" stroke="#0B3E3A" strokeWidth="4" transform="rotate(4 220 155)" />
        <circle cx="220" cy="155" r="12" fill="#059669" stroke="#0B3E3A" strokeWidth="3" transform="rotate(4 220 155)" />

        {/* Wallet Front Body */}
        <rect x="90" y="180" width="240" height="180" rx="24" fill="#10B981" stroke="#0B3E3A" strokeWidth="4" />
        {/* Detail Lines */}
        <path d="M 110 330 L 310 330" stroke="#0B3E3A" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
        <path d="M 110 345 L 280 345" stroke="#0B3E3A" strokeWidth="4" strokeLinecap="round" opacity="0.3" />

        {/* Wallet Flap (Top part folded over) */}
        <path d="M 90 180 Q 210 240 330 180 L 330 250 Q 210 290 90 250 Z" fill="#059669" stroke="#0B3E3A" strokeWidth="4" strokeLinejoin="round" />

        {/* Clasp / Button */}
        <circle cx="210" cy="245" r="16" fill="#FDE68A" stroke="#0B3E3A" strokeWidth="4" />
        <circle cx="210" cy="245" r="6" fill="#0B3E3A" />
      </g>

      {/* Floating Gold Coin */}
      <g className="anim-bounce-vert-tilt anim-delay-1s" style={{ transformOrigin: "350px 330px" }}>
        <circle cx="350" cy="330" r="32" fill="#FCD34D" stroke="#0B3E3A" strokeWidth="4" />
        <circle cx="350" cy="330" r="22" fill="none" stroke="#0B3E3A" strokeWidth="4" />
        <text x="350" y="340" textAnchor="middle" fontSize="24" fontWeight="900" fill="#0B3E3A">$</text>
        {/* Shadow highlight fake */}
        <path d="M 330 315 Q 350 305 365 320" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
      </g>

    </svg>
  );
}

/* ── STYLED INPUT (COMIC STYLE) ─────────────────────────────── */
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
        <label className="text-sm font-black text-[#0B3E3A] uppercase tracking-wide">{label}</label>
        {hint}
      </div>
      <div className="flex items-center rounded-xl border-[3px] border-[#0B3E3A] bg-white overflow-hidden transition-all shadow-[4px_4px_0_0_#0B3E3A] focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:shadow-[2px_2px_0_0_#0B3E3A]">
        <span className="pl-4 pr-3 text-[#0B3E3A] flex-shrink-0">{icon}</span>
        <div className="w-1 h-6 bg-[#0B3E3A]/10 flex-shrink-0 rounded-full" />
        <input
          required type={type} placeholder={placeholder}
          value={value} onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 px-4 py-3.5 text-sm font-bold text-[#0B3E3A] placeholder:text-[#0B3E3A]/40 outline-none bg-transparent disabled:opacity-50"
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
          html: `<p style="color:#0B3E3A; font-weight: bold;">Cek inbox kamu di <span style="background:#FDE68A; padding:2px 6px; border-radius:6px; border:2px solid #0B3E3A;">${email}</span></p>`,
          confirmButtonColor: "#10B981", confirmButtonText: "Siaapp Boss!",
          customClass: { popup: 'border-4 border-[#0B3E3A] rounded-2xl shadow-[8px_8px_0_0_#0B3E3A]' }
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
        html: `<p style="color:#0B3E3A; font-weight: bold;">Silakan masuk dengan akun baru kamu.</p>`,
        confirmButtonColor: "#10B981", confirmButtonText: "Masuk Sekarang",
        customClass: { popup: 'border-4 border-[#0B3E3A] rounded-2xl shadow-[8px_8px_0_0_#0B3E3A]' }
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
        icon: "error", title: "Waduh, Login Gagal",
        text: "Email atau password salah nih.",
        confirmButtonColor: "#F43F5E",
        customClass: { popup: 'border-4 border-[#0B3E3A] rounded-2xl shadow-[8px_8px_0_0_#0B3E3A]' }
      });
    } else {
      showToast("success", "Selamat datang kembali! 👋");
    }
  };

  const handleDemo = async () => {
    const r = await Swal.fire({
      icon: "info", title: "Masuk mode Demo?",
      text: "Coba-coba pake data bohongan dulu yuk.",
      showCancelButton: true, confirmButtonColor: "#10B981",
      cancelButtonColor: "#94A3B8", confirmButtonText: "Gas Demo!",
      cancelButtonText: "Gak Jadi",
      customClass: { popup: 'border-4 border-[#0B3E3A] rounded-2xl shadow-[8px_8px_0_0_#0B3E3A]' }
    });
    if (!r.isConfirmed) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: "demo@dompet.com", password: "123456" });
    setLoading(false);
    if (error) showToast("error", "Gagal masuk akun demo.");
  };

  return (
    <div
      className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 sm:p-8"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* ── CARD (TOY BOX STYLE) ───────────────────────────────── */}
      <div className="w-full max-w-[1000px] bg-white rounded-[32px] border-[4px] border-[#0B3E3A] shadow-[12px_12px_0_0_#0B3E3A] overflow-hidden flex relative" style={{ minHeight: 640 }}>

        {/* ── LEFT PANEL ──────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[45%] flex-col relative overflow-hidden bg-[#10B981] border-r-[4px] border-[#0B3E3A]">

          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#0B3E3A 2px, transparent 2px)', backgroundSize: '24px 24px' }} />

          {/* Logo */}
          <div className="relative z-10 p-10 pb-0">
            <span className="text-3xl font-black text-[#0B3E3A] bg-white px-4 py-2 rounded-xl border-[3px] border-[#0B3E3A] shadow-[4px_4px_0_0_#0B3E3A] inline-block -rotate-3" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Dompet<span className="text-[#10B981]">.</span>
            </span>
          </div>

          {/* Illustration with Comic-style animations */}
          <div className="flex-1 flex items-center justify-center px-6 relative z-10 pt-4">
            <ComicWalletIllustration />
          </div>

          {/* Tagline Box */}
          <div className="relative z-10 p-10 pt-4">
            <div className="bg-white p-4 rounded-2xl border-[3px] border-[#0B3E3A] shadow-[4px_4px_0_0_#0B3E3A] rotate-2">
              <p className="text-[#0B3E3A] text-sm font-black leading-relaxed">
                Mulai kelola uangmu kaya main game. Seru, gampang, dan aman banget! 🎮
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 py-10 relative bg-[#FDFBF7]">

          {/* Close button */}
          <Link
            href="/"
            className="absolute top-6 right-6 w-11 h-11 rounded-xl bg-white border-[3px] border-[#0B3E3A] shadow-[3px_3px_0_0_#0B3E3A] flex items-center justify-center text-[#0B3E3A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <X size={20} strokeWidth={3} />
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <span className="text-3xl font-black text-[#0B3E3A] bg-[#10B981] px-4 py-2 rounded-xl border-[3px] border-[#0B3E3A] shadow-[4px_4px_0_0_#0B3E3A] inline-block -rotate-2" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Dompet.
            </span>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1
              className="text-4xl sm:text-[42px] font-black text-[#0B3E3A] mb-3 leading-tight tracking-tight"
            >
              {isRegistering ? "Bikin Akun Baru!" : useMagicLink ? "Kirim Magic Link ✨" : "Masuk Dulu Yuk!"}
            </h1>
            <p className="text-base text-[#0B3E3A]/70 font-bold">
              {isRegistering
                ? "Isi data di bawah buat mulai petualanganmu."
                : useMagicLink
                  ? "Masukin email, nanti kita kirim link saktinya."
                  : "Selamat datang kembali, juragan!"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-5">
            <FormInput
              label="Alamat Email"
              icon={<Mail size={20} strokeWidth={2.5} />}
              type="email" placeholder="contoh@email.com"
              value={email} onChange={setEmail} disabled={loading}
            />

            {!useMagicLink && (
              <FormInput
                label="Kata Sandi Rahasia"
                icon={<Lock size={20} strokeWidth={2.5} />}
                type={showPass ? "text" : "password"}
                placeholder="Minimal 6 karakter ya"
                value={password} onChange={setPassword} disabled={loading}
                hint={
                  !isRegistering && (
                    <a href="#" className="text-xs font-black text-[#10B981] hover:text-[#059669] transition-colors underline decoration-2 underline-offset-2">
                      Lupa Sandi?
                    </a>
                  )
                }
                right={
                  <button type="button" tabIndex={-1} onClick={() => setShowPass(!showPass)}
                    className="pr-4 text-[#0B3E3A]/50 hover:text-[#0B3E3A] transition-colors">
                    {showPass ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                  </button>
                }
              />
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full py-4 mt-2 rounded-xl bg-[#FDE68A] border-[3px] border-[#0B3E3A] shadow-[4px_4px_0_0_#0B3E3A] hover:bg-[#FCD34D] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] text-[#0B3E3A] font-black text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader2 size={22} className="animate-spin" strokeWidth={3} />
                : isRegistering ? "Gass Daftar! 🚀"
                  : useMagicLink ? "Kirim Link Sakti"
                    : "Masuk Dashboard"}
            </button>
          </form>

          {/* Alt options */}
          {!isRegistering && (
            <>
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-1 bg-[#0B3E3A] rounded-full opacity-10" />
                <span className="text-[12px] uppercase tracking-widest text-[#0B3E3A] font-black bg-[#E2E8F0] px-3 py-1 rounded-md border-2 border-[#0B3E3A]">ATAU CARA LAIN</span>
                <div className="flex-1 h-1 bg-[#0B3E3A] rounded-full opacity-10" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Magic Link */}
                <button type="button" disabled={loading} onClick={() => setMagic(!useMagicLink)}
                  className={`w-full p-3 rounded-xl border-[3px] border-[#0B3E3A] transition-all flex flex-col items-center justify-center gap-2 group ${useMagicLink
                    ? "bg-[#BAE6FD] shadow-none translate-x-[2px] translate-y-[2px]"
                    : "bg-white shadow-[3px_3px_0_0_#0B3E3A] hover:bg-[#F0F9FF] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                    }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#0B3E3A] ${useMagicLink ? 'bg-white' : 'bg-[#BAE6FD]'}`}>
                    <Zap size={20} className="text-[#0B3E3A] fill-[#FDE68A]" />
                  </div>
                  <p className="text-sm font-black text-[#0B3E3A]">Magic Link</p>
                </button>

                {/* Demo */}
                <button type="button" disabled={loading} onClick={handleDemo}
                  className="w-full p-3 rounded-xl border-[3px] border-[#0B3E3A] bg-white shadow-[3px_3px_0_0_#0B3E3A] hover:bg-[#FEF3C7] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all flex flex-col items-center justify-center gap-2 group">
                  <div className="w-10 h-10 rounded-full bg-[#FDE68A] border-2 border-[#0B3E3A] flex items-center justify-center">
                    <Sparkles size={20} className="text-[#0B3E3A] fill-white" />
                  </div>
                  <p className="text-sm font-black text-[#0B3E3A]">Coba Demo</p>
                </button>
              </div>
            </>
          )}

          {/* Toggle */}
          <p className="text-center text-sm text-[#0B3E3A]/80 font-bold mt-10 bg-white border-2 border-[#0B3E3A] p-3 rounded-xl shadow-[3px_3px_0_0_#0B3E3A]">
            {isRegistering ? "Loh, udah punya akun? " : "Belum punya akun? "}
            <button
              onClick={() => { setReg(!isRegistering); setMagic(false); }}
              className="font-black text-[#10B981] hover:text-[#0B3E3A] transition-colors uppercase underline decoration-2 underline-offset-4"
            >
              {isRegistering ? "Masuk Sini Aja" : "Daftar Gratis"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}