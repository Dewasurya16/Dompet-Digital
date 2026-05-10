/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Wallet, Target, FileText, Plus, Calendar, PieChart as PieIcon,
  ArrowUpRight, ArrowDownRight, Tag, Settings, X, Moon, Sun, Filter,
  LogOut, Lock, Mail, Bot, Sparkles, Search, Download, Loader2,
  Edit2, Trash2, AlertTriangle, CheckCircle2, ArrowUpDown, ArrowRight, ArrowDownLeft, ArrowRightLeft, ChevronDown,
  Eye, EyeOff, Receipt, ShieldAlert, RefreshCw, Gem, Briefcase,
  AlertOctagon, CreditCard, MessageSquare, Landmark, Copy, CalendarSearch,
  TrendingUp, TrendingDown, BarChart3, PiggyBank, Check, Percent,
  ChevronRight, Bell, Info, Zap, Home, LayoutGrid, Camera, Lightbulb, MapPin
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const formatIDR = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const parseMonthSafe = (ym: string) => new Date(`${ym}-15`); // FIX: timezone-safe
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const CATEGORY_COLORS: any = {
  'Makanan': '#F59E0B', 'Transportasi': '#3B82F6', 'Tagihan': '#EF4444',
  'Belanja': '#EC4899', 'Hiburan': '#8B5CF6', 'Investasi': '#14B8A6',
  'SPPD': '#F97316', 'Beri Hutang': '#64748B', 'Bayar Pinjaman': '#64748B',
  'Gaji Pokok': '#10B981', 'Tukin': '#3B82F6', 'Uang Makan': '#F59E0B',
  'Bonus': '#8B5CF6', 'Dibayar Hutang': '#64748B', 'Terima Pinjaman': '#64748B',
  'Lainnya': '#94A3B8'
};

const WALLET_OPTIONS = ['Kas Tunai', 'Mandiri', 'BRI', 'BCA', 'BNI', 'BSI', 'GoPay', 'OVO', 'DANA', 'Lainnya'];
const DEFAULT_FORM = { title: '', amount: '', type: 'pengeluaran', category: 'Makanan', wallet: 'Kas Tunai', image_url: '', person_name: '', currency: 'IDR', original_amount: '', latitude: null as number | null, longitude: null as number | null };

// ─── TOAST SYSTEM ──────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';
type Toast = { id: number; message: string; type: ToastType };

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={16} />,
    error: <AlertTriangle size={16} />,
    warning: <AlertOctagon size={16} />,
    info: <Info size={16} />,
  };
  const styles: Record<ToastType, string> = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-slate-800 text-white dark:bg-slate-700',
  };
  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold max-w-xs pointer-events-auto animate-in slide-in-from-right duration-300 ${styles[t.type]}`}>
          {icons[t.type]}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="opacity-70 hover:opacity-100 shrink-0"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

// ─── CONFIRM DIALOG ─────────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = false }: {
  open: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
          <AlertTriangle size={24} className={danger ? 'text-rose-500' : 'text-amber-500'} />
        </div>
        <h3 className="text-center font-black text-slate-800 dark:text-white text-lg mb-1">{title}</h3>
        <p className="text-center text-slate-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-colors">Batal</button>
          <button onClick={onConfirm} className={`flex-1 py-3 text-white font-bold rounded-2xl transition-colors ${danger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'}`}>Ya, Lanjutkan</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function DompetPintarPro() {
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // NEW STATE: Loading saat Scan Struk AI
  const [isScanning, setIsScanning] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [initialBalance, setInitialBalance] = useState<number | string>(0);
  const [targetSaving, setTargetSaving] = useState<number | string>(25000000);
  const [catBudgets, setCatBudgets] = useState<any>({ Makanan: '', Transportasi: '', Tagihan: '', Belanja: '', Hiburan: '', Lainnya: '' });

  // NEW PHASE 3 STATES
  const [pockets, setPockets] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [appTheme, setAppTheme] = useState('default');

  // Modal States
  const [showPocketModal, setShowPocketModal] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [pocketForm, setPocketForm] = useState({ name: '', icon: '🎯', target_amount: '', balance: '' });
  const [investForm, setInvestForm] = useState({ name: '', asset_type: 'Saham', platform: '', invested_amount: '', current_value: '' });
  const [isSavingPocket, setIsSavingPocket] = useState(false);
  const [isSavingInvest, setIsSavingInvest] = useState(false);

  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [filterMode, setFilterMode] = useState('month');
  const [filterMonth, setFilterMonth] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showBalance, setShowBalance] = useState(true);
  const [aiPersonality, setAiPersonality] = useState('motivator');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<any>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev: any) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev: any) => prev.filter((t: any) => t.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((prev: any) => prev.filter((t: any) => t.id !== id)), []);

  const confirm = useCallback((title: string, message: string, danger = false): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({ title, message, danger, resolve });
    });
  }, []);

  const handleConfirmResult = (result: boolean) => {
    if (confirmState?.resolve) confirmState.resolve(result);
    setConfirmState(null);
  };

  const [activeTab, setActiveTab] = useState<'insights' | 'wallets'>('insights');
  const [activeView, setActiveView] = useState<'dashboard' | 'transactions' | 'analytics' | 'wallets' | 'settings'>('dashboard');

  const fetchData = async (userId?: string) => {
    // Gunakan userId dari parameter atau dari session saat ini
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const uid = userId || currentSession?.user?.id;
    if (!uid) return; // Jangan fetch jika tidak ada user yang login

    setLoading(true);
    const [txRes, pocketsRes, invRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('pockets').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('investments').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    ]);
    if (!txRes.error && txRes.data) setTransactions(txRes.data);
    if (!pocketsRes.error && pocketsRes.data) setPockets(pocketsRes.data);
    if (!invRes.error && invRes.data) setInvestments(invRes.data);
    setLoading(false);
  };

  useEffect(() => {
    setIsMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
      setIsCheckingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') { setSession(session); fetchData(); }
      else if (event === 'SIGNED_OUT') { setSession(null); setTransactions([]); }
    });

    const savedBalance = localStorage.getItem('fin_initialBalance');
    const savedTarget = localStorage.getItem('fin_targetSaving');
    const savedBudgets = localStorage.getItem('fin_catBudgets');
    const savedTheme = localStorage.getItem('fin_theme');
    const savedAppTheme = localStorage.getItem('fin_app_theme');
    const savedPrivacy = localStorage.getItem('fin_privacy');
    const savedPersonality = localStorage.getItem('fin_ai_personality');

    if (savedBalance) setInitialBalance(Number(savedBalance));
    if (savedTarget) setTargetSaving(Number(savedTarget));
    if (savedBudgets) setCatBudgets(JSON.parse(savedBudgets));
    if (savedTheme === 'dark') setIsDarkMode(true);
    if (savedAppTheme) setAppTheme(savedAppTheme);
    if (savedPrivacy === 'hidden') setShowBalance(false);
    if (savedPersonality) setAiPersonality(savedPersonality);

    const now = new Date();
    setCustomStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
    setCustomEndDate(now.toISOString().split('T')[0]);

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('fin_theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('fin_theme', 'light'); }
  }, [isDarkMode, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    document.documentElement.setAttribute('data-theme', appTheme);
    localStorage.setItem('fin_app_theme', appTheme);
  }, [appTheme, isMounted]);

  const togglePrivacy = () => { const nv = !showBalance; setShowBalance(nv); localStorage.setItem('fin_privacy', nv ? 'visible' : 'hidden'); };
  const toggleAIPersonality = () => { const nv = aiPersonality === 'motivator' ? 'roasting' : 'motivator'; setAiPersonality(nv); localStorage.setItem('fin_ai_personality', nv); };
  const displayMoney = (amount: number) => showBalance ? formatIDR(amount) : 'Rp ••••••';

  const username = session?.user?.email ? session.user.email.split('@')[0] : '';
  const displayUsername = username.charAt(0).toUpperCase() + username.slice(1);

  // ── AI auto-categorization ──
  useEffect(() => {
    if (editingId) return;
    if (formData.type === 'pengeluaran' && formData.title) {
      const t = formData.title.toLowerCase();
      if (t.includes('emas') || t.includes('saham') || t.includes('reksadana') || t.includes('crypto') || t.includes('bibit') || t.includes('deposito')) setFormData((prev: any) => ({ ...prev, category: 'Investasi' }));
      else if (t.includes('makan') || t.includes('minum') || t.includes('kopi') || t.includes('kfc') || t.includes('mcd') || t.includes('gofood') || t.includes('bakso') || t.includes('warteg')) setFormData((prev: any) => ({ ...prev, category: 'Makanan' }));
      else if (t.includes('bensin') || t.includes('parkir') || t.includes('gojek') || t.includes('grab') || t.includes('tol') || t.includes('kereta') || t.includes('ojol')) setFormData((prev: any) => ({ ...prev, category: 'Transportasi' }));
      else if (t.includes('listrik') || t.includes('air') || t.includes('wifi') || t.includes('pulsa') || t.includes('bpjs') || t.includes('cicilan') || t.includes('netflix') || t.includes('spotify') || t.includes('kos')) setFormData((prev: any) => ({ ...prev, category: 'Tagihan' }));
      else if (t.includes('shopee') || t.includes('tokopedia') || t.includes('baju') || t.includes('skincare') || t.includes('belanja')) setFormData((prev: any) => ({ ...prev, category: 'Belanja' }));
      else if (t.includes('nonton') || t.includes('game') || t.includes('bioskop') || t.includes('liburan')) setFormData((prev: any) => ({ ...prev, category: 'Hiburan' }));
      else if (t.includes('sppd') || t.includes('dinas') || t.includes('tugas luar') || t.includes('hotel')) setFormData((prev: any) => ({ ...prev, category: 'SPPD' }));
      else if (t.includes('pinjemin') || t.includes('kasih utang') || t.includes('talangin')) setFormData((prev: any) => ({ ...prev, category: 'Beri Hutang' }));
      else if (t.includes('bayar utang') || t.includes('lunasin pinjaman') || t.includes('bayar pinjaman')) setFormData((prev: any) => ({ ...prev, category: 'Bayar Pinjaman' }));
    } else if (formData.type === 'pemasukan' && formData.title) {
      const t = formData.title.toLowerCase();
      if (t.includes('gaji') || t.includes('upah') || t.includes('gapok')) setFormData((prev: any) => ({ ...prev, category: 'Gaji Pokok' }));
      else if (t.includes('tukin') || t.includes('tunjangan') || t.includes('remunerasi')) setFormData((prev: any) => ({ ...prev, category: 'Tukin' }));
      else if (t.includes('uang makan') || t.includes('uang lauk')) setFormData((prev: any) => ({ ...prev, category: 'Uang Makan' }));
      else if (t.includes('sppd') || t.includes('uang dinas')) setFormData((prev: any) => ({ ...prev, category: 'SPPD' }));
      else if (t.includes('bonus') || t.includes('thr') || t.includes('hadiah')) setFormData((prev: any) => ({ ...prev, category: 'Bonus' }));
      else if (t.includes('jual') || t.includes('profit') || t.includes('cair')) setFormData((prev: any) => ({ ...prev, category: 'Investasi' }));
      else if (t.includes('dibayar utang') || t.includes('kembalian utang')) setFormData((prev: any) => ({ ...prev, category: 'Dibayar Hutang' }));
      else if (t.includes('dapat pinjaman') || t.includes('pinjam uang') || t.includes('ngutang')) setFormData((prev: any) => ({ ...prev, category: 'Terima Pinjaman' }));
    }
  }, [formData.title, formData.type, editingId]);

  // ── Auth ──
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true);
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) showToast(error.message, 'error');
      else {
        showToast('Registrasi berhasil! Silakan masuk.', 'success');
        setIsRegistering(false);
        fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, type: 'welcome' })
        }).catch(console.error);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) showToast('Login Gagal: ' + error.message, 'error');
    }
    setAuthLoading(false);
  };

  const handleDemoLogin = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: 'demo@dompet.com', password: '123456' });
    if (error) showToast('Gagal masuk akun demo.', 'error');
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    setIsCheckingAuth(true);
    const { error } = await supabase.auth.signOut();
    if (error) { showToast('Gagal keluar: ' + error.message, 'error'); setIsCheckingAuth(false); }
  };

  const saveSettings = () => {
    localStorage.setItem('fin_initialBalance', (initialBalance || 0).toString());
    localStorage.setItem('fin_targetSaving', (targetSaving || 0).toString());
    localStorage.setItem('fin_catBudgets', JSON.stringify(catBudgets));
    setIsEditingSettings(false);
    showToast('Pengaturan berhasil disimpan!', 'success');
  };

  const handleResetData = async () => {
    const ok = await confirm('Hapus Semua Data', 'Tindakan ini akan menghapus SELURUH riwayat transaksimu dan tidak bisa dibatalkan.', true);
    if (!ok) return;
    setIsSubmitting(true);
    const uid = session?.user?.id;
    if (!uid) return;
    // Hapus hanya data milik user yang sedang login
    const { error } = await supabase.from('transactions').delete().eq('user_id', uid);
    if (!error) { localStorage.clear(); window.location.reload(); }
    else { showToast('Gagal mereset data.', 'error'); setIsSubmitting(false); }
  };

  // ── SCAN STRUK DENGAN AI (DIPERBAIKI) ──
  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input agar bisa klik file yang sama
    e.target.value = '';

    // Munculkan preview
    const previewUrl = URL.createObjectURL(file);
    setReceiptPreview(previewUrl);

    setIsScanning(true);
    showToast("AI sedang membaca struk... 🤖", "info");

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      
      let publicImageUrl = '';
      try {
        const fileName = `receipt-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('receipts').upload(fileName, file);
        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(uploadData.path);
          publicImageUrl = publicUrlData.publicUrl;
        }
      } catch(e) { console.error('Upload fail', e); }

      try {
        const res = await fetch('/api/scan-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', // PENTING
          },
          body: JSON.stringify({ imageBase64: base64 })
        });

        const data = await res.json();

        if (res.ok && data.title) {
          setFormData((prev: any) => ({
            ...prev,
            title: data.title,
            amount: data.amount.toString(),
            category: data.category || 'Makanan',
            type: 'pengeluaran',
            image_url: publicImageUrl
          }));
          showToast("Struk berhasil dipindai! Silakan cek form.", "success");
        } else {
          showToast(data.error || "Gagal membaca struk.", "error");
        }
      } catch (err) {
        console.error("Error Scan API:", err);
        showToast("Terjadi kesalahan koneksi ke server.", "error");
      }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const getLevelInfoSync = (nw: number) => {
    if (nw >= 50000000) return { title: 'Sultan', icon: '👑' };
    if (nw >= 10000000) return { title: 'Master Hemat', icon: '💎' };
    if (nw >= 2000000) return { title: 'Prajurit', icon: '🛡️' };
    return { title: 'Pemula', icon: '🌱' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;
    setIsSubmitting(true);
    
    let lat = formData.latitude, lng = formData.longitude;
    if (useLocation && !lat && !lng) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch (err) { console.warn("Location disabled or timed out"); }
    }

    const payload = { title: formData.title, amount: Number(formData.amount), type: formData.type, category: formData.category, wallet: formData.wallet, image_url: formData.image_url, person_name: formData.person_name, currency: formData.currency, original_amount: formData.original_amount ? Number(formData.original_amount) : null, latitude: lat, longitude: lng, user_id: session?.user?.id };

    const oldNetWorth = stats.globalNetWorth;

    if (editingId) {
      const { error } = await supabase.from('transactions').update(payload).eq('id', editingId);
      setIsSubmitting(false);
      if (!error) {
        setEditingId(null);
        setReceiptPreview(null);
        setFormData(DEFAULT_FORM);
        setUseLocation(false);
        fetchData();
        showToast('Transaksi berhasil diperbarui!', 'success');
      } else showToast(`Gagal update: ${error.message}`, 'error');
    } else {
      const { data, error } = await supabase.from('transactions').insert([payload]).select().single();
      setIsSubmitting(false);

      if (!error && data) {
        setFormData(DEFAULT_FORM);
        setUseLocation(false);
        setReceiptPreview(null);
        fetchData();
        showToast('Transaksi berhasil disimpan! 🎉', 'success');

        if (session?.user?.email) {
          fetch('/api/send-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: session.user.email,
              title: payload.title,
              amount: payload.amount,
              type: payload.type,
              category: payload.category,
              wallet: payload.wallet,
              refId: data.id.split('-')[0].toUpperCase(),
              date: new Date(data.created_at).toLocaleString('id-ID')
            })
          }).catch(console.error);

          const newNetWorth = payload.type === 'pemasukan' ? oldNetWorth + payload.amount : oldNetWorth - payload.amount;
          const oldLevel = getLevelInfoSync(oldNetWorth);
          const newLevel = getLevelInfoSync(newNetWorth);

          if (newLevel.title !== oldLevel.title && newNetWorth > oldNetWorth) {
            fetch('/api/send-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: session.user.email, type: 'levelup', data: { newLevel: newLevel.title, icon: newLevel.icon } })
            }).catch(console.error);
            showToast(`Selamat! Kamu naik level jadi ${newLevel.title}! 👑`, 'success');
          }
        }
      } else showToast(`Gagal simpan: ${error?.message}`, 'error');
    }
  };

  const handleEditClick = (t: any) => {
    setEditingId(t.id);
    setReceiptPreview(null);
    setFormData({ ...DEFAULT_FORM, title: t.title, amount: t.amount.toString(), type: t.type, category: t.category, wallet: t.wallet || 'Kas Tunai', image_url: t.image_url || '', person_name: t.person_name || '', currency: t.currency || 'IDR', original_amount: t.original_amount ? t.original_amount.toString() : '', latitude: t.latitude || null, longitude: t.longitude || null });
    setUseLocation(!!t.latitude);
    document.getElementById('formCatat')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteTransaction = async (id: string) => {
    const ok = await confirm('Hapus Transaksi', 'Transaksi ini akan dihapus secara permanen.', true);
    if (!ok) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) { fetchData(); showToast('Transaksi dihapus.', 'info'); }
    else showToast('Gagal menghapus: ' + error.message, 'error');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setReceiptPreview(null);
    setFormData(DEFAULT_FORM);
    setUseLocation(false);
  };

  const handleDuplicate = async (t: any) => {
    const ok = await confirm('Duplikat Transaksi', `Gunakan "${t.title}" sebagai template pencatatan baru?`);
    if (!ok) return;
    setFormData({ ...DEFAULT_FORM, title: t.title, amount: t.amount.toString(), type: t.type, category: t.category, wallet: t.wallet || 'Kas Tunai', image_url: t.image_url || '', person_name: t.person_name || '', currency: t.currency || 'IDR', original_amount: t.original_amount ? t.original_amount.toString() : '' });
    setEditingId(null);
    setReceiptPreview(null);
    document.getElementById('formCatat')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickPay = async (t: any) => {
    const ok = await confirm('Bayar Lagi', `Catat otomatis tagihan "${t.title}" sebesar ${formatIDR(Number(t.amount))} untuk hari ini?`);
    if (!ok) return;
    setIsSubmitting(true);
    const payload = { title: t.title, amount: Number(t.amount), type: t.type, category: t.category, wallet: t.wallet };
    const { error } = await supabase.from('transactions').insert([payload]);
    setIsSubmitting(false);
    if (!error) {
      fetchData();
      showToast(`Tagihan ${t.title} berhasil dicatat!`, 'success');
    } else {
      showToast('Gagal mencatat tagihan: ' + error.message, 'error');
    }
  };

  const handleSavePocket = async () => {
    if (!pocketForm.name || !pocketForm.target_amount) return showToast('Nama dan Target wajib diisi!', 'warning');
    setIsSavingPocket(true);
    const { error } = await supabase.from('pockets').insert([{
      name: pocketForm.name, icon: pocketForm.icon,
      target_amount: Number(pocketForm.target_amount),
      balance: Number(pocketForm.balance || 0),
      user_id: session?.user?.id
    }]);
    setIsSavingPocket(false);
    if (!error) {
      setShowPocketModal(false);
      setPocketForm({ name: '', icon: '🎯', target_amount: '', balance: '' });
      fetchData();
      showToast('Kantong tabungan berhasil dibuat! 🎯', 'success');
    } else showToast('Gagal membuat kantong: ' + error.message, 'error');
  };

  const handleSaveInvest = async () => {
    if (!investForm.name || !investForm.invested_amount || !investForm.current_value) return showToast('Semua field wajib diisi!', 'warning');
    setIsSavingInvest(true);
    const { error } = await supabase.from('investments').insert([{
      asset_name: investForm.name,
      asset_type: investForm.asset_type,
      platform: investForm.platform || '',
      amount: Number(investForm.invested_amount),
      purchase_price: Number(investForm.invested_amount),
      invested_amount: Number(investForm.invested_amount),
      current_value: Number(investForm.current_value),
      current_price: Number(investForm.current_value),
      user_id: session?.user?.id
    }]);
    setIsSavingInvest(false);
    if (!error) {
      setShowInvestModal(false);
      setInvestForm({ name: '', asset_type: 'Saham', platform: '', invested_amount: '', current_value: '' });
      fetchData();
      showToast('Aset investasi berhasil ditambahkan! 📈', 'success');
    } else showToast('Gagal menyimpan aset: ' + error.message, 'error');
  };


  const availableMonths = useMemo(() => {
    const months = new Set(transactions.map(t => {
      const d = new Date(t.created_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }));
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    if (filterMode === 'month') {
      if (filterMonth !== 'all') {
        result = result.filter(t => {
          const d = new Date(t.created_at);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === filterMonth;
        });
      }
    } else if (filterMode === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate); start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate); end.setHours(23, 59, 59, 999);
      result = result.filter(t => { const tDate = new Date(t.created_at); return tDate >= start && tDate <= end; });
    }
    if (searchQuery) result = result.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.wallet && t.wallet.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else if (sortBy === 'highest') result.sort((a, b) => Number(b.amount) - Number(a.amount));
    else if (sortBy === 'lowest') result.sort((a, b) => Number(a.amount) - Number(b.amount));
    return result;
  }, [transactions, filterMode, filterMonth, customStartDate, customEndDate, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'pemasukan' && !['Investasi', 'Terima Pinjaman', 'Dibayar Hutang'].includes(t.category)).reduce((acc, curr) => acc + Number(curr.amount), 0);
    const expense = filteredTransactions.filter(t => t.type === 'pengeluaran' && !['Investasi', 'Beri Hutang', 'Bayar Pinjaman'].includes(t.category)).reduce((acc, curr) => acc + Number(curr.amount), 0);
    const investmentBought = filteredTransactions.filter(t => t.type === 'pengeluaran' && t.category === 'Investasi').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const investmentSold = filteredTransactions.filter(t => t.type === 'pemasukan' && t.category === 'Investasi').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalAssets = investmentBought - investmentSold;
    const totalAllIncome = filteredTransactions.filter(t => t.type === 'pemasukan').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalAllExpense = filteredTransactions.filter(t => t.type === 'pengeluaran').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const balance = (filterMode === 'month' && filterMonth === 'all' ? Number(initialBalance || 0) : 0) + totalAllIncome - totalAllExpense;
    const netWorth = balance + Math.max(0, totalAssets);
    const recurringKeywords = ['netflix', 'spotify', 'wifi', 'indihome', 'bpjs', 'listrik', 'air', 'utang', 'cicilan', 'paylater', 'langganan', 'kredit', 'pinjaman', 'kos'];
    const billsTransactions = filteredTransactions.filter(t => t.type === 'pengeluaran' && (t.category === 'Tagihan' || recurringKeywords.some(kw => t.title.toLowerCase().includes(kw))));
    const totalBills = billsTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const globalTotalIncome = transactions.filter(t => t.type === 'pemasukan').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const globalTotalExpense = transactions.filter(t => t.type === 'pengeluaran').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const globalBalance = Number(initialBalance || 0) + globalTotalIncome - globalTotalExpense;
    const globalInvBought = transactions.filter(t => t.type === 'pengeluaran' && t.category === 'Investasi').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const globalInvSold = transactions.filter(t => t.type === 'pemasukan' && t.category === 'Investasi').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const globalNetWorth = globalBalance + Math.max(0, globalInvBought - globalInvSold);

    const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;
    const cashflowRatio = income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 0;

    return { income, expense, balance, totalAssets, netWorth, totalBills, globalNetWorth, billsTransactions, savingsRate, cashflowRatio };
  }, [filteredTransactions, transactions, initialBalance, filterMonth, filterMode]);

  const walletBreakdown = useMemo(() => {
    const walletMap: Record<string, { income: number; expense: number }> = {};
    transactions.forEach(t => {
      const w = t.wallet || 'Kas Tunai';
      if (!walletMap[w]) walletMap[w] = { income: 0, expense: 0 };
      if (t.type === 'pemasukan') walletMap[w].income += Number(t.amount);
      else walletMap[w].expense += Number(t.amount);
    });
    return Object.entries(walletMap)
      .map(([name, v]) => ({ name, balance: v.income - v.expense, income: v.income, expense: v.expense }))
      .sort((a, b) => b.balance - a.balance);
  }, [transactions]);

  const debtTracker = useMemo(() => {
    const personMap: Record<string, { given: number; received: number }> = {};
    transactions.forEach(t => {
      if (t.person_name && ['Beri Hutang', 'Bayar Pinjaman', 'Terima Pinjaman', 'Dibayar Hutang'].includes(t.category)) {
        const p = t.person_name.trim().toLowerCase();
        if (!personMap[p]) personMap[p] = { given: 0, received: 0 };
        if (t.category === 'Beri Hutang' || t.category === 'Bayar Pinjaman') personMap[p].given += Number(t.amount);
        if (t.category === 'Terima Pinjaman' || t.category === 'Dibayar Hutang') personMap[p].received += Number(t.amount);
      }
    });
    return Object.entries(personMap).map(([name, v]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      net: v.given - v.received
    })).filter(x => x.net !== 0).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [transactions]);

  const heatmapData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    
    const data = [];
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const expenses = transactions.filter(t => t.type === 'pengeluaran' && t.created_at.startsWith(dateStr)).reduce((sum, t) => sum + Number(t.amount), 0);
        data.push({ date: i, amount: expenses });
    }
    return data;
  }, [transactions]);

  const userLevel = useMemo(() => {
    const nw = stats.globalNetWorth;
    if (nw >= 50000000) return { title: 'Sultan', icon: '👑', color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' };
    if (nw >= 10000000) return { title: 'Master Hemat', icon: '💎', color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' };
    if (nw >= 2000000) return { title: 'Prajurit', icon: '🛡️', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' };
    return { title: 'Pemula', icon: '🌱', color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
  }, [stats.globalNetWorth]);

  const gamification = useMemo(() => {
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const hasExpense = transactions.some(t => t.type === 'pengeluaran' && t.created_at.startsWith(dateStr));
      if (!hasExpense) streak++;
      else break;
    }
    const isIronSaver = stats.savingsRate >= 30;
    return { streak, isIronSaver };
  }, [transactions, stats.savingsRate]);

  const categoryChartData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'pengeluaran' && !['Investasi', 'Beri Hutang', 'Bayar Pinjaman'].includes(t.category));
    const grouped = expenses.reduce((acc: any, curr) => { acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount); return acc; }, {});
    return Object.keys(grouped).map(key => ({ name: key, value: grouped[key], color: CATEGORY_COLORS[key] || '#64748B' })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const smartInsights = useMemo(() => {
    if (filteredTransactions.length === 0) return [{ type: 'tip', text: aiPersonality === 'motivator' ? "Belum ada aktivitas. Yuk, mulai catat pengeluaran pertamamu!" : "Masih sepi nih. Dompet kosong atau emang malas nyatat?" }];
    let insights: any[] = [];
    const expensesOnly = filteredTransactions.filter(t => t.type === 'pengeluaran' && !['Investasi'].includes(t.category));
    Object.keys(catBudgets).forEach(cat => {
      const budget = Number(catBudgets[cat]);
      if (budget > 0) {
        const spent = expensesOnly.filter(t => t.category === cat).reduce((acc, curr) => acc + Number(curr.amount), 0);
        if (spent > budget) insights.push({ type: 'danger', text: aiPersonality === 'motivator' ? `Peringatan: Kategori ${cat} melebihi batas. Terpakai ${formatIDR(spent)} dari jatah ${formatIDR(budget)}.` : `Woy! Jatah ${cat} jebol! Limit cuma ${formatIDR(budget)} tapi lu abisin ${formatIDR(spent)}.` });
        else if (spent > budget * 0.8) insights.push({ type: 'warning', text: aiPersonality === 'motivator' ? `Hati-hati, anggaran ${cat} sudah terpakai ${Math.round((spent / budget) * 100)}%. Sisa: ${formatIDR(budget - spent)}.` : `Rem woy! Jatah ${cat} sisa ${formatIDR(budget - spent)} doang.` });
      }
    });
    if (stats.income > 0) {
      const wants = expensesOnly.filter(t => t.category === 'Hiburan' || t.category === 'Belanja').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const wantsPercentage = (wants / stats.income) * 100;
      if (wantsPercentage > 30) insights.push({ type: 'warning', text: aiPersonality === 'motivator' ? `Pengeluaran Hiburan/Belanja mencapai ${Math.round(wantsPercentage)}%. Coba tekan di bawah 30%.` : `Gaya elit ekonomi sulit! ${Math.round(wantsPercentage)}% buat foya-foya. Nabung dong!` });
    }
    if (stats.expense > stats.income && stats.income > 0) insights.push({ type: 'danger', text: aiPersonality === 'motivator' ? "Perhatian: Pengeluaran konsumsimu melebihi pemasukan periode ini." : "Minus bang? Kurang-kurangin jajan!" });
    if (insights.length === 0) insights.push({ type: 'success', text: aiPersonality === 'motivator' ? "Semua indikator keuanganmu sehat periode ini. Pertahankan! 💪" : "Eh, lumayan juga nih. Keuangan lo gak parah-parah amat bulan ini." });
    return insights;
  }, [stats, catBudgets, filteredTransactions, aiPersonality]);

  const exportPDF = async () => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("Laporan Keuangan", 14, 22);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const periodText = filterMode === 'month' ? (filterMonth === 'all' ? 'Semua Waktu' : parseMonthSafe(filterMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })) : `${customStartDate} s/d ${customEndDate}`;
    doc.text(`Periode: ${periodText}  |  ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 14, 32);
    doc.setTextColor(51, 65, 85); doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("RINGKASAN:", 14, 52);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Total Pemasukan Bersih`, 14, 60); doc.text(`:  ${formatIDR(stats.income)}`, 70, 60);
    doc.text(`Total Pengeluaran Konsumsi`, 14, 66); doc.text(`:  ${formatIDR(stats.expense)}`, 70, 66);
    doc.setFont("helvetica", "bold"); doc.setTextColor(20, 184, 166);
    doc.text(`Total Aset (Investasi)`, 14, 74); doc.text(`:  ${formatIDR(stats.totalAssets)}`, 70, 74);
    doc.setTextColor(stats.netWorth >= 0 ? 16 : 225, stats.netWorth >= 0 ? 185 : 29, stats.netWorth >= 0 ? 129 : 72);
    doc.text(`TOTAL KEKAYAAN`, 14, 82); doc.text(`:  ${formatIDR(stats.netWorth)}`, 70, 82);
    autoTable(doc, {
      startY: 90, head: [['Tanggal', 'Keterangan', 'Sumber Dana', 'Kategori', 'Tipe', 'Jumlah (Rp)']],
      body: filteredTransactions.map(t => [new Date(t.created_at).toLocaleDateString('id-ID'), t.title, t.wallet || 'Tunai', t.category, t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran', new Intl.NumberFormat('id-ID').format(Number(t.amount))]),
      theme: 'grid', headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 5: { halign: 'right' } }, styles: { fontSize: 9, cellPadding: 3 }, alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(148, 163, 184); doc.text(`Halaman ${i} dari ${pageCount} — Dompet Digital`, 105, 285, { align: 'center' }); }

    const filename = `Laporan_Keuangan_${Date.now()}.pdf`;
    doc.save(filename);
    showToast('PDF berhasil diunduh!', 'success');

    const wantEmail = await confirm('Kirim ke Email?', 'Apakah kamu ingin salinan PDF laporan ini dikirim ke emailmu?');
    if (wantEmail && session?.user?.email) {
      showToast('Mengirim email...', 'info');
      const base64Data = doc.output('datauristring').split(',')[1];
      fetch('/api/send-notification', {
        method: 'POST', body: JSON.stringify({ email: session.user.email, type: 'report', filename, attachmentBase64: base64Data })
      }).then(() => showToast('Laporan PDF berhasil dikirim ke email!', 'success')).catch(() => showToast('Gagal kirim email', 'error'));
    }
  };

  const exportCSV = async () => {
    const headers = ['Tanggal', 'Keterangan', 'Sumber Dana', 'Kategori', 'Tipe', 'Jumlah (Rp)'];
    const rows = filteredTransactions.map(t => [new Date(t.created_at).toLocaleDateString('id-ID'), t.title.replace(/,/g, ''), t.wallet || 'Tunai', t.category, t.type, t.amount]);
    const pureCsv = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + pureCsv;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const filename = `Data_Keuangan_${new Date().toLocaleDateString('id-ID')}.csv`;

    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showToast('CSV berhasil diunduh!', 'success');

    const wantEmail = await confirm('Kirim ke Email?', 'Apakah kamu ingin salinan data CSV ini dikirim ke emailmu?');
    if (wantEmail && session?.user?.email) {
      showToast('Mengirim email...', 'info');
      const base64Data = btoa(unescape(encodeURIComponent(pureCsv)));
      fetch('/api/send-notification', {
        method: 'POST', body: JSON.stringify({ email: session.user.email, type: 'report', filename, attachmentBase64: base64Data })
      }).then(() => showToast('Data CSV berhasil dikirim ke email!', 'success')).catch(() => showToast('Gagal kirim email', 'error'));
    }
  };

  const exportWA = () => {
    const text = `📊 *Laporan Keuangan Dompet Digital*\n\n` +
      `💰 Saldo Kas: ${formatIDR(stats.balance)}\n` +
      `📈 Pemasukan: ${formatIDR(stats.income)}\n` +
      `📉 Pengeluaran: ${formatIDR(stats.expense)}\n` +
      `💎 Total Kekayaan: ${formatIDR(stats.netWorth)}\n` +
      `⭐ Saving Rate: ${stats.savingsRate}%\n\n` +
      `_Laporan dibuat pada ${new Date().toLocaleDateString('id-ID')}._`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  if (!isMounted) return null;

  // ── Loading Screen ──
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center transition-colors duration-300">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-200 dark:shadow-blue-900">
            <Wallet size={36} className="text-white" />
          </div>
          <div className="absolute inset-0 rounded-3xl border-4 border-blue-300 dark:border-blue-700 animate-ping opacity-30"></div>
        </div>
        <p className="text-slate-600 dark:text-slate-400 font-semibold animate-pulse">Menyiapkan Dompet Digital...</p>
      </div>
    );
  }

  // ── Login / Register Screen ──
  if (!session) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] flex font-sans antialiased transition-colors duration-500 relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[30%] -left-[15%] w-[60%] h-[60%] bg-blue-200/40 dark:bg-blue-900/15 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-[50%] -right-[15%] w-[50%] h-[50%] bg-indigo-200/40 dark:bg-indigo-900/15 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
          <div className="absolute top-[20%] left-[40%] w-[30%] h-[30%] bg-violet-200/20 dark:bg-violet-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
        </div>

        {/* LEFT: Feature Showcase (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
          <div className="relative z-10 max-w-md">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-500/20">
              <Wallet size={28} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] mb-4">
              Dompet Digital<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Kelola Uangmu.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-10">
              Pantau pemasukan, pengeluaran, investasi, dan hutang piutang dalam satu dashboard yang presisi dan cerdas.
            </p>

            {/* Feature pills */}
            <div className="space-y-3">
              {[
                { icon: <PieIcon size={16} />, text: 'Analitik & grafik otomatis', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/40' },
                { icon: <Bot size={16} />, text: 'Asisten AI cerdas (2 mode)', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-800/40' },
                { icon: <FileText size={16} />, text: 'Export laporan PDF & CSV', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40' },
                { icon: <CreditCard size={16} />, text: 'Radar tagihan & multi-wallet', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40' },
              ].map((f, i) => (
                <div key={i} className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-xs font-semibold mr-2 ${f.color}`}>
                  {f.icon} {f.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Auth Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-[420px] relative z-10">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                <Wallet size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Dompet Digital</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">Kelola keuanganmu dengan presisi.</p>
            </div>

            {/* Desktop title */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isRegistering ? 'Buat akun baru' : 'Masuk ke akun'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm font-medium">
                {isRegistering ? 'Daftar gratis dan mulai kelola keuanganmu.' : 'Selamat datang kembali! Masukkan kredensialmu.'}
              </p>
            </div>

            <div className="bg-white dark:bg-[#111] p-7 sm:p-8 rounded-[1.75rem] shadow-[0_4px_40px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_40px_rgb(0,0,0,0.15)] border border-slate-200/40 dark:border-slate-800/40">
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">Email</label>
                  <input required type="email" placeholder="nama@email.com" className="w-full bg-slate-50/80 dark:bg-[#0A0A0A] px-4 py-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all duration-200 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} disabled={authLoading} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">Password</label>
                  <input required type="password" placeholder="Min. 6 karakter" className="w-full bg-slate-50/80 dark:bg-[#0A0A0A] px-4 py-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all duration-200 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} disabled={authLoading} />
                </div>
                <button disabled={authLoading} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center text-sm mt-2 disabled:opacity-50 shadow-lg shadow-blue-500/15 active:scale-[0.98]">
                  {authLoading ? <Loader2 className="animate-spin" size={18} /> : isRegistering ? 'Daftar Sekarang' : 'Masuk Dashboard'}
                </button>
              </form>

              {!isRegistering && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/60 dark:border-slate-800/60"></div></div>
                    <div className="relative flex justify-center text-[10px]">
                      <span className="px-3 bg-white dark:bg-[#111] text-slate-400 uppercase tracking-[0.15em] font-bold">atau</span>
                    </div>
                  </div>
                  <button onClick={handleDemoLogin} disabled={authLoading} className="w-full bg-slate-50/80 dark:bg-slate-900/30 text-slate-600 dark:text-slate-300 font-semibold py-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/30 transition-all duration-200 flex items-center justify-center gap-2 text-sm">
                    <Sparkles size={14} className="text-blue-500" /> Coba Akun Demo
                  </button>
                </>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between text-sm px-1">
              <button onClick={() => setIsRegistering(!isRegistering)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 font-medium text-[13px]">
                {isRegistering ? '← Sudah punya akun? Masuk' : 'Belum punya akun? Daftar →'}
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-slate-100/60 dark:bg-slate-800/40 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors duration-200">
                {isDarkMode ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-slate-400" />}
              </button>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // ── MAIN DASHBOARD ──
  const NAV_ITEMS = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutGrid },
    { id: 'transactions' as const, label: 'Transaksi', icon: ArrowUpDown },
    { id: 'analytics' as const, label: 'Analitik', icon: PieIcon },
    { id: 'wallets' as const, label: 'Dompet', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#09090B] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-500">

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog open={!!confirmState} title={confirmState?.title || ''} message={confirmState?.message || ''} danger={confirmState?.danger} onConfirm={() => handleConfirmResult(true)} onCancel={() => handleConfirmResult(false)} />

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[250px] bg-white dark:bg-[#111] border-r border-slate-200/60 dark:border-slate-800/60 z-50 p-5">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Wallet size={20} className="text-white" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-800 dark:text-white">Dompet<span className="text-blue-500">.</span></span>
        </div>

        {/* Profile */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 mb-6 border border-slate-100 dark:border-slate-800">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto mb-2 shadow-md">
            {displayUsername.charAt(0)}
          </div>
          <p className="text-center font-bold text-sm text-slate-800 dark:text-white">{displayUsername}</p>
          <div className="flex justify-center mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${userLevel.color}`}>{userLevel.icon} {userLevel.title}</span>
          </div>
          {/* Badges */}
          <div className="flex justify-center gap-1.5 mt-2.5">
            {gamification.streak >= 3 && <div className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 bg-amber-100 text-amber-600 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800" title={`${gamification.streak} No Spend Days`}><Zap size={10} /> {gamification.streak} Day Streak</div>}
            {gamification.isIronSaver && <div className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800" title="Saving Rate >= 30%"><ShieldAlert size={10} className="text-emerald-500"/> Iron Saver</div>}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${activeView === item.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
          </button>
          <button onClick={() => setIsEditingSettings(true)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <Settings size={16} /> Pengaturan
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all">
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="lg:ml-[250px] min-h-screen pb-28 lg:pb-0">

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/70 dark:bg-[#09090B]/70 backdrop-blur-2xl px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1A1A1A] dark:bg-white rounded-2xl flex items-center justify-center shadow-md">
                <Wallet size={18} className="text-white dark:text-[#1A1A1A]" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">Welcome back,</p>
                <p className="text-sm text-slate-900 dark:text-white font-bold leading-tight">{displayUsername}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={togglePrivacy} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-[#1A1A1A] border border-slate-100 dark:border-slate-800 rounded-full shadow-sm">
                {showBalance ? <Eye size={16} className="text-slate-600 dark:text-slate-300" /> : <EyeOff size={16} className="text-slate-600 dark:text-slate-300" />}
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-[#1A1A1A] border border-slate-100 dark:border-slate-800 rounded-full shadow-sm">
                {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
              </button>
            </div>
          </div>
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-[#111]/50 backdrop-blur-sm sticky top-0 z-40">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
            {activeView === 'dashboard' ? 'Overview' : activeView === 'transactions' ? 'Transaksi' : activeView === 'analytics' ? 'Analitik' : activeView === 'wallets' ? 'Dompet' : 'Pengaturan'}
          </h1>
          <div className="flex items-center gap-3">
            {/* Filters */}
            <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button onClick={() => setFilterMode('month')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterMode === 'month' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Bulan</button>
              <button onClick={() => setFilterMode('custom')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterMode === 'custom' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Rentang</button>
            </div>
            {filterMode === 'month' ? (
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none shadow-sm cursor-pointer">
                <option value="all">Semua Waktu</option>
                {availableMonths.map(m => <option key={m} value={m}>{parseMonthSafe(m).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</option>)}
              </select>
            ) : (
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl gap-1.5 shadow-sm">
                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-transparent outline-none text-xs font-bold text-slate-700 dark:text-slate-200 w-[110px]" />
                <span className="text-slate-300 text-xs">—</span>
                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-transparent outline-none text-xs font-bold text-slate-700 dark:text-slate-200 w-[110px]" />
              </div>
            )}
            <button onClick={togglePrivacy} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all shadow-sm">
              {showBalance ? <Eye size={16} className="text-slate-400" /> : <EyeOff size={16} className="text-slate-400" />}
            </button>
          </div>
        </header>

        {/* ═══ CONTENT AREA ═══ */}
        <div className="p-4 sm:p-6 lg:p-8">

          {/* Mobile Filter Row */}
          <div className="lg:hidden flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button onClick={() => setFilterMode('month')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterMode === 'month' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-500'}`}>Bulan</button>
              <button onClick={() => setFilterMode('custom')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterMode === 'custom' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-500'}`}>Rentang</button>
            </div>
            {filterMode === 'month' ? (
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none flex-1 shadow-sm">
                <option value="all">Semua Waktu</option>
                {availableMonths.map(m => <option key={m} value={m}>{parseMonthSafe(m).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</option>)}
              </select>
            ) : (
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl gap-1.5 flex-1 shadow-sm">
                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-transparent outline-none text-xs font-bold w-[100px] text-slate-700 dark:text-slate-200" />
                <span className="text-slate-300 text-xs">—</span>
                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-transparent outline-none text-xs font-bold w-[100px] text-slate-700 dark:text-slate-200" />
              </div>
            )}
          </div>

          {(activeView === 'dashboard' || !activeView) && <>
            {/* ── OVERVIEW CARDS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Net Worth Card */}
              <div className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 rounded-2xl text-white relative overflow-hidden shadow-lg shadow-blue-500/20">
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/80">Total Kekayaan</p>
                  <button onClick={togglePrivacy} className="text-blue-200 hover:text-white transition-colors">
                    {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
                <p className="text-2xl font-black tracking-tight mb-1 truncate">{displayMoney(stats.netWorth)}</p>
                <div className="flex items-center gap-1 text-[10px] text-blue-200/70">
                  {stats.netWorth >= 0 ? <><TrendingUp size={10} /> Sehat</> : <><TrendingDown size={10} /> Perlu Perhatian</>}
                </div>
              </div>

              {/* Saldo Card - Green */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-5 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 relative overflow-hidden">
                <div className="absolute top-2 right-3 w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <Wallet size={14} className="text-emerald-500" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 dark:text-emerald-400/60 mb-1">Saldo Kas</p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight truncate">{displayMoney(stats.balance)}</p>
                <p className="text-[10px] text-emerald-500 mt-1 font-medium">Saving Rate: {stats.savingsRate}%</p>
              </div>

              {/* Pemasukan Card - Amber */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 relative overflow-hidden">
                <div className="absolute top-2 right-3 w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <ArrowUpRight size={14} className="text-amber-500" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/60 dark:text-amber-400/60 mb-1">Pemasukan</p>
                <p className="text-xl font-black text-amber-700 dark:text-amber-300 tracking-tight truncate">{displayMoney(stats.income)}</p>
                <p className="text-[10px] text-amber-500 mt-1 font-medium">{filteredTransactions.filter(t => t.type === 'pemasukan').length} transaksi</p>
              </div>

              {/* Pengeluaran Card - Rose */}
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 p-5 rounded-2xl border border-rose-200/60 dark:border-rose-800/40 relative overflow-hidden">
                <div className="absolute top-2 right-3 w-8 h-8 bg-rose-500/10 rounded-full flex items-center justify-center">
                  <ArrowDownRight size={14} className="text-rose-500" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600/60 dark:text-rose-400/60 mb-1">Pengeluaran</p>
                <p className="text-xl font-black text-rose-700 dark:text-rose-300 tracking-tight truncate">{displayMoney(stats.expense)}</p>
                <p className="text-[10px] text-rose-500 mt-1 font-medium">{filteredTransactions.filter(t => t.type === 'pengeluaran').length} transaksi</p>
              </div>
            </div>

            {/* ── TARGET + STATS ROW ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Target Progress */}
              <div className="lg:col-span-2 bg-white dark:bg-[#111] p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center"><Target size={14} className="text-amber-500" /></div>
                    Target Impian
                  </h3>
                  <span className="text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                    {Math.min(100, Math.round((stats.netWorth / Number(targetSaving || 1)) * 100))}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2.5">
                  <div className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.max(2, Math.min(100, (stats.netWorth / Number(targetSaving || 1)) * 100))}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Terkumpul: <span className="font-bold text-slate-700 dark:text-slate-200">{displayMoney(stats.netWorth)}</span></span>
                  <span>Target: <span className="font-bold text-slate-700 dark:text-slate-200">{displayMoney(Number(targetSaving))}</span></span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard title="Investasi" val={displayMoney(stats.totalAssets)} icon={<Gem size={18} />} color="text-teal-600 dark:text-teal-400" bg="bg-teal-50 dark:bg-teal-900/20" />
                <StatCard title="Tagihan" val={displayMoney(stats.totalBills)} icon={<CreditCard size={18} />} color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-900/20" />
              </div>
            </div>

            {/* AI Insights */}
            <div className="lg:col-span-2 bg-white dark:bg-[#111] border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[1.75rem] shadow-sm shadow-slate-200/50 dark:shadow-none flex flex-col relative overflow-hidden mb-6">
              <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-15 pointer-events-none ${aiPersonality === 'roasting' ? 'bg-rose-400' : 'bg-indigo-400'}`} />
              <div className="flex items-center justify-between mb-5 relative z-10 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl text-white shadow-md flex items-center justify-center ${aiPersonality === 'roasting' ? 'bg-gradient-to-br from-rose-500 to-red-600' : 'bg-gradient-to-br from-indigo-500 to-blue-600'}`}>
                    {aiPersonality === 'roasting' ? <ShieldAlert size={20} /> : <Bot size={20} />}
                  </div>
                  <div>
                    <h2 className={`font-black text-base flex items-center gap-1.5 ${aiPersonality === 'roasting' ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                      Asisten AI <Sparkles size={13} />
                    </h2>
                    <p className="text-[10px] text-slate-400 font-medium">Analisis anggaran otomatis</p>
                  </div>
                </div>
                <button onClick={toggleAIPersonality} className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors border ${aiPersonality === 'roasting' ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800'}`}>
                  <RefreshCw size={10} /> Mode {aiPersonality}
                </button>
              </div>
              <div className="space-y-3 relative z-10 overflow-y-auto max-h-[240px] custom-scrollbar pr-1">
                {smartInsights.map((insight, idx) => {
                  const styles: Record<string, string> = {
                    danger: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-800',
                    warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800',
                    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800',
                    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800',
                    tip: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                  };
                  const icons: Record<string, React.ReactNode> = {
                    danger: <AlertTriangle size={14} />, warning: <AlertTriangle size={14} />,
                    success: <CheckCircle2 size={14} />, info: <Info size={14} />, tip: <Lightbulb size={14} />,
                  };
                  return (
                    <div key={idx} className={`flex items-start gap-3 p-3.5 rounded-2xl border ${styles[insight.type] || styles.tip}`}>
                      <span className="mt-0.5 shrink-0">{icons[insight.type] || icons.tip}</span>
                      <p className="text-xs sm:text-sm font-medium leading-relaxed">{insight.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Heatmap */}
            <div className="bg-white dark:bg-[#111] rounded-[1.5rem] shadow-sm border border-slate-200/50 dark:border-slate-800/50 p-6 mb-6">
              <h3 className="font-bold text-[17px] text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Calendar className="text-blue-500" size={18} /> Kalender Keuangan (Bulan Ini)</h3>
              <div className="flex gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
                {heatmapData.map((d, i) => {
                  let colorClass = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'; // No spend
                  if (d.amount === 0) colorClass = 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-500'; // Green (No spend day)
                  else if (d.amount < 50000) colorClass = 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-500'; // Light spend
                  else if (d.amount < 200000) colorClass = 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-500'; // Medium spend
                  else colorClass = 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-500'; // High spend
                  
                  return (
                    <div key={i} className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg flex items-center justify-center border text-[10px] sm:text-xs font-bold transition-all hover:scale-110 cursor-help ${colorClass}`} title={`Tanggal ${d.date}: ${formatIDR(d.amount)}`}>
                      {d.date}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 text-[10px] font-medium text-slate-400 mt-3">
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800"></div> No Spend Day</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800"></div> Pengeluaran Besar</span>
              </div>
            </div>

            {/* Recent Transactions (Dashboard compact view) */}
            <div className="bg-white dark:bg-[#111] rounded-[1.5rem] shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-200/50 dark:border-slate-800/50 overflow-hidden p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-[17px] text-slate-900 dark:text-white tracking-tight">Transactions</h3>
                <button onClick={() => setActiveView('transactions')} className="text-slate-800 dark:text-white hover:opacity-70"><ArrowRight size={20} /></button>
              </div>
              <div className="space-y-4 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
                {filteredTransactions.slice(0, 6).map(t => {
                  const isIncome = t.type === 'pemasukan';
                  return (
                    <div key={t.id} className="flex items-center justify-between cursor-pointer group" onClick={() => setSelectedReceipt(t)}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1rem] flex items-center justify-center bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] shadow-sm group-hover:scale-[1.03] transition-transform">
                          {isIncome ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-slate-900 dark:text-white capitalize leading-tight mb-0.5">{t.title}</p>
                          <p className="text-[12px] font-medium text-slate-500 capitalize">{isIncome ? 'Received' : 'Sent'} • {t.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-[15px] font-bold tracking-tight leading-tight mb-0.5 ${isIncome ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}>
                          {isIncome ? '+' : '-'}{displayMoney(Number(t.amount))}
                        </p>
                        <p className="text-[12px] font-medium text-slate-500">
                          {new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {filteredTransactions.length === 0 && <div className="text-center text-slate-400 text-sm py-4">Belum ada transaksi</div>}
              </div>
            </div>
          </>}

          {/* ═══ TRANSACTIONS VIEW ═══ */}
          {activeView === 'transactions' && <>

            {/* ── MAIN CONTENT GRID ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

              {/* LEFT: Form + History */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-5">

                {/* FORM INPUT */}
                <section id="formCatat" className={`bg-white dark:bg-[#111] rounded-[1.5rem] shadow-sm shadow-slate-200/50 dark:shadow-none border transition-all duration-300 relative overflow-hidden ${editingId ? 'border-amber-300/80 dark:border-amber-600/50 ring-1 ring-amber-200/30 dark:ring-amber-800/20' : 'border-slate-200/50 dark:border-slate-800/50'}`}>
                  <div className="p-6 relative z-10">
                    {editingId && (
                      <div className="flex items-center gap-2 mb-4 text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5 rounded-2xl">
                        <Edit2 size={15} /><span className="text-sm font-bold">Mode Edit Aktif</span>
                      </div>
                    )}
                    <div className="flex items-end justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <h2 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                          Operation
                        </h2>
                        {/* TOMBOL AI SCANNER */}
                        <div className="ml-2">
                          <input type="file" accept="image/*" id="scan-receipt" className="hidden" onChange={handleScanReceipt} disabled={isScanning} />
                          <label htmlFor="scan-receipt" className="cursor-pointer flex items-center gap-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all">
                            {isScanning ? <><Loader2 className="animate-spin inline" size={14} /> Membaca AI...</> : <><Camera size={14} /> Scan AI</>}
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-4 text-[13px] font-bold text-slate-500">
                        <button type="button" onClick={() => setFormData({ ...formData, type: 'pengeluaran' })} className={`pb-1 border-b-2 transition-colors ${formData.type === 'pengeluaran' ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'border-transparent hover:text-slate-700'}`}>Kirim</button>
                        <button type="button" onClick={() => setFormData({ ...formData, type: 'pemasukan' })} className={`pb-1 border-b-2 transition-colors ${formData.type === 'pemasukan' ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'border-transparent hover:text-slate-700'}`}>Terima</button>
                      </div>
                    </div>

                    {/* PREVIEW STRUK YANG DIUPLOAD */}
                    {receiptPreview && (
                      <div className="mb-4 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1A1A1A] p-2 flex items-center gap-4 animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800 relative">
                          <img src={receiptPreview} alt="Preview Struk" className="w-full h-full object-cover" />
                          {isScanning && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                              <Loader2 size={16} className="text-white animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Gambar Struk</p>
                          <p className="text-[10px] text-slate-500 truncate">{isScanning ? 'AI sedang menganalisis...' : 'Analisis selesai.'}</p>
                        </div>
                        <button type="button" onClick={() => setReceiptPreview(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" disabled={isScanning}>
                          <X size={16} />
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* From/Wallet */}
                      <div>
                        <label className="text-[12px] font-bold text-slate-500 mb-2 block">Dari Sumber Dana</label>
                        <div className="flex flex-col sm:flex-row items-center bg-slate-50 dark:bg-[#1A1A1A] rounded-[1.25rem] border border-slate-200 dark:border-slate-800 p-2 gap-2">
                          <div className="relative w-full sm:w-[140px] shrink-0 bg-white dark:bg-[#2A2A2A] rounded-[1rem] border border-slate-200 dark:border-slate-700 flex items-center px-3 py-3">
                            <Landmark size={18} className="text-slate-800 dark:text-white mr-2" />
                            <select className="bg-transparent outline-none w-full font-bold text-slate-800 dark:text-white text-sm cursor-pointer appearance-none" value={formData.wallet} onChange={e => setFormData({ ...formData, wallet: e.target.value })}>
                              {WALLET_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                            </select>
                            <ChevronDown size={16} className="text-slate-400 ml-1 pointer-events-none" />
                          </div>
                          <input required placeholder="Judul / Deskripsi..." className="bg-transparent px-3 py-3 outline-none w-full font-bold text-slate-800 dark:text-white text-[15px] placeholder:text-slate-400 placeholder:font-medium text-right sm:text-left" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                      </div>

                      {/* To/Category/Amount */}
                      <div>
                        <label className="text-[12px] font-bold text-slate-500 mb-2 block">Tujuan & Nominal</label>
                        <div className="flex flex-col sm:flex-row items-center bg-slate-50 dark:bg-[#1A1A1A] rounded-[1.25rem] border border-slate-200 dark:border-slate-800 p-2 gap-2">
                          <div className="relative w-full sm:w-[140px] shrink-0 bg-white dark:bg-[#2A2A2A] rounded-[1rem] border border-slate-200 dark:border-slate-700 flex items-center px-3 py-3">
                            <select className="bg-transparent outline-none font-black text-slate-800 dark:text-white text-sm cursor-pointer mr-2" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                              <option value="IDR">Rp</option>
                              <option value="USD">$</option>
                              <option value="SGD">S$</option>
                              <option value="JPY">¥</option>
                              <option value="EUR">€</option>
                            </select>
                            <select className="bg-transparent outline-none w-full font-bold text-slate-800 dark:text-white text-sm cursor-pointer appearance-none truncate" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                              {formData.type === 'pengeluaran' ? (
                                <><option value="Makanan">Makanan</option><option value="Transportasi">Transport</option><option value="Tagihan">Tagihan</option><option value="Belanja">Belanja</option><option value="Hiburan">Hiburan</option><option value="Investasi">Investasi</option><option value="Beri Hutang">Beri Hutang</option><option value="Bayar Pinjaman">Bayar Pinjaman</option><option value="Lainnya">Lainnya</option></>
                              ) : (
                                <><option value="Gaji Pokok">Gaji</option><option value="Bonus">Bonus</option><option value="Investasi">Jual Aset</option><option value="Terima Pinjaman">Terima Pinjaman</option><option value="Dibayar Hutang">Dibayar Hutang</option><option value="Lainnya">Lainnya</option></>
                              )}
                            </select>
                            <ChevronDown size={16} className="text-slate-400 ml-1 pointer-events-none" />
                          </div>
                          <input required type="number" placeholder="0" className="bg-transparent px-3 py-3 outline-none w-full font-bold text-slate-800 dark:text-white text-xl placeholder:text-slate-400 text-right" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                        </div>
                      </div>

                      {['Beri Hutang', 'Bayar Pinjaman', 'Terima Pinjaman', 'Dibayar Hutang'].includes(formData.category) && (
                        <div>
                          <label className="text-[12px] font-bold text-slate-500 mb-2 block">Nama Pihak / Orang (Opsional)</label>
                          <input placeholder="Contoh: Budi, Kantor, dll" className="w-full bg-slate-50 dark:bg-[#1A1A1A] rounded-[1.25rem] border border-slate-200 dark:border-slate-800 px-4 py-3 outline-none font-bold text-slate-800 dark:text-white text-sm" value={formData.person_name || ''} onChange={e => setFormData({ ...formData, person_name: e.target.value })} />
                        </div>
                      )}

                      {formData.amount && <p className="text-[12px] font-bold text-slate-500 mt-2 mb-2">Rate: {formatIDR(Number(formData.amount))}</p>}

                      {formData.currency !== 'IDR' && (
                        <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                          <AlertOctagon size={16} className="text-amber-500 shrink-0" />
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block mb-1">Nominal Asli ({formData.currency})</label>
                            <input type="number" placeholder={`Contoh: 15.50`} className="w-full bg-transparent outline-none font-bold text-amber-900 dark:text-amber-100 text-sm placeholder:text-amber-300 dark:placeholder:text-amber-700" value={formData.original_amount || ''} onChange={e => setFormData({ ...formData, original_amount: e.target.value })} />
                          </div>
                          <p className="text-[10px] text-amber-600 dark:text-amber-500 text-right w-[40%] leading-tight">Nilai utama (atas) tetap dalam IDR sebagai kalkulasi.</p>
                        </div>
                      )}

                      {/* Geo-tagging */}
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-slate-800 p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${useLocation ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}><Camera size={14} /></div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">Simpan Lokasi (GPS)</p>
                            <p className="text-[9px] text-slate-500">Tandai tempat transaksi ini terjadi</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={useLocation} onChange={() => setUseLocation(!useLocation)} />
                          <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                        </label>
                      </div>

                      {/* Submit */}
                      <div className="flex gap-3 pt-2">
                        <button disabled={isSubmitting} className="w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-bold p-4 rounded-[1.25rem] transition-all active:scale-[0.98] disabled:opacity-50 text-[15px] flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-gray-100 shadow-lg shadow-black/5 dark:shadow-white/5">
                          {isSubmitting ? <><Loader2 className="animate-spin" size={18} />Memproses...</> : editingId ? <><Edit2 size={18} />Update</> : <><ArrowRightLeft size={18} /> Simpan Transaksi</>}
                        </button>
                        {editingId && <button type="button" onClick={handleCancelEdit} className="px-6 bg-slate-100 dark:bg-[#1A1A1A] text-slate-600 dark:text-slate-300 font-bold rounded-[1.25rem] hover:bg-slate-200 transition-colors">Batal</button>}
                      </div>
                    </form>
                  </div>
                </section>

                {/* RIWAYAT TRANSAKSI */}
                <section className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
                  {/* Header */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                      <h2 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white">
                        <Calendar className="text-blue-500" size={20} /> Riwayat Aktivitas
                      </h2>
                      <div className="flex items-center gap-2">
                        {filteredTransactions.length > 0 && (
                          <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 hidden sm:inline-block">
                            {filteredTransactions.length} transaksi
                          </span>
                        )}
                        <button onClick={exportPDF} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:text-blue-600 transition-all text-xs shadow-sm">
                          <FileText size={13} /> PDF
                        </button>
                        <button onClick={exportCSV} className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all text-xs shadow-sm">
                          <Download size={13} /> CSV
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="flex flex-1 items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 ring-blue-500/20 shadow-sm transition-all gap-2">
                        <Search size={15} className="text-slate-400 shrink-0" />
                        <input type="text" placeholder="Cari transaksi, kategori, rekening..." className="bg-transparent outline-none w-full text-sm text-slate-700 dark:text-slate-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        {searchQuery && <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 shrink-0"><X size={14} /></button>}
                      </div>
                      <div className="flex items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-2 w-full sm:w-auto">
                        <ArrowUpDown size={15} className="text-slate-400 shrink-0" />
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer appearance-none">
                          <option value="newest">Terbaru</option><option value="oldest">Terlama</option><option value="highest">Terbesar</option><option value="lowest">Terkecil</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Transaction List */}
                  <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-950/30">
                    {loading ? (
                      <div className="p-12 text-center">
                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-medium">Memuat transaksi...</p>
                      </div>
                    ) : filteredTransactions.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <PiggyBank size={28} className="text-slate-400" />
                        </div>
                        <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">Belum ada transaksi</p>
                        <p className="text-slate-400 text-xs">{searchQuery ? 'Coba kata kunci lain' : 'Mulai catat aktivitas keuanganmu!'}</p>
                      </div>
                    ) : (
                      filteredTransactions.map((t) => {
                        const isIncome = t.type === 'pemasukan';
                        const isInvest = t.category === 'Investasi';
                        const isSPPD = t.category === 'SPPD';
                        const isDebt = ['Beri Hutang', 'Bayar Pinjaman', 'Dibayar Hutang', 'Terima Pinjaman'].includes(t.category);

                        let iconBg = isIncome ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600';
                        if (isInvest) iconBg = 'bg-teal-50 dark:bg-teal-900/20 text-teal-600';
                        if (isSPPD) iconBg = 'bg-orange-50 dark:bg-orange-900/20 text-orange-600';
                        if (isDebt) iconBg = 'bg-slate-100 dark:bg-slate-800 text-slate-500';

                        return (
                          <div key={t.id} className={`mb-2 p-3.5 sm:p-4 rounded-2xl border transition-all hover:shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${editingId === t.id ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700' : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800'}`}>
                            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                              <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${iconBg}`}>
                                {isIncome && !isInvest ? <ArrowUpRight size={17} /> : isInvest ? <Gem size={17} /> : <ArrowDownRight size={17} />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-800 dark:text-slate-200 capitalize text-sm line-clamp-1">{t.title}</p>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                                  <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium">{t.category}</span>
                                  <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-800 font-bold flex items-center gap-0.5"><Landmark size={8} /> {t.wallet || 'Tunai'}</span>
                                  {t.latitude && t.longitude && (
                                    <a href={`https://maps.google.com/?q=${t.latitude},${t.longitude}`} target="_blank" rel="noreferrer" className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-800 font-bold flex items-center gap-0.5 hover:bg-amber-100 transition-colors">
                                      <MapPin size={8} /> Geo
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end sm:hidden shrink-0">
                                <p className={`text-sm font-black truncate ${isIncome ? 'text-emerald-500' : isInvest ? 'text-teal-500' : isDebt ? 'text-slate-500' : 'text-rose-500'}`}>
                                  {isIncome ? '+' : '-'}{displayMoney(Number(t.amount))}
                                </p>
                                {t.original_amount && t.currency && t.currency !== 'IDR' && (
                                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">{t.original_amount} {t.currency}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3">
                              <div className="hidden sm:flex flex-col items-end mr-1">
                                <p className={`text-base font-black tracking-tight whitespace-nowrap truncate max-w-[150px] lg:max-w-[200px] text-right ${isIncome ? 'text-emerald-500' : isInvest ? 'text-teal-500' : isDebt ? 'text-slate-500' : 'text-rose-500'}`}>
                                  {isIncome ? '+' : '-'}{displayMoney(Number(t.amount))}
                                </p>
                                {t.original_amount && t.currency && t.currency !== 'IDR' && (
                                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t.original_amount} {t.currency}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => setSelectedReceipt(t)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800 transition-colors" title="Lihat Struk"><Receipt size={14} /></button>
                                <button onClick={() => handleDuplicate(t)} className="p-2 text-violet-600 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 rounded-xl border border-violet-200 dark:border-violet-800 transition-colors" title="Duplikat"><Copy size={14} /></button>
                                <button onClick={() => handleEditClick(t)} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800 transition-colors" title="Edit"><Edit2 size={14} /></button>
                                <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors" title="Hapus"><Trash2 size={14} /></button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>

              {/* RIGHT: Charts, Budget, Wallet */}
              <div className="space-y-5 sm:space-y-6">

                {/* Wallet & AI Panel with tabs */}
                <section className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
                  <div className="flex border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-[#0C0C0E]">
                    <button onClick={() => setActiveTab('insights')} className={`flex-1 py-3.5 text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-1.5 ${activeTab === 'insights' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-white dark:bg-[#111]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                      <Bot size={14} /> AI Insights
                    </button>
                    {/* NEW: Wallet Breakdown Tab */}
                    <button onClick={() => setActiveTab('wallets')} className={`flex-1 py-3.5 text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-1.5 ${activeTab === 'wallets' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-white dark:bg-[#111]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                      <Landmark size={14} /> Saldo Rekening
                    </button>
                  </div>

                  <div className="p-5">
                    {activeTab === 'insights' ? (
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Ringkasan Keuangan</p>
                        {[
                          { label: 'Saving Rate', val: `${stats.savingsRate}%`, color: stats.savingsRate >= 20 ? 'text-emerald-600' : 'text-amber-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                          { label: 'Cashflow Ratio', val: `${stats.cashflowRatio}%`, color: stats.cashflowRatio < 80 ? 'text-emerald-600' : 'text-rose-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                          { label: 'Total Transaksi', val: filteredTransactions.length.toString(), color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-50 dark:bg-slate-800' },
                          { label: 'Rata-rata Pengeluaran', val: filteredTransactions.filter(t => t.type === 'pengeluaran').length > 0 ? formatIDR(stats.expense / filteredTransactions.filter(t => t.type === 'pengeluaran').length) : 'N/A', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                        ].map(item => (
                          <div key={item.label} className={`flex items-center justify-between p-3 rounded-xl ${item.bg}`}>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.label}</span>
                            <span className={`text-sm font-black truncate max-w-[50%] text-right ${item.color}`}>{item.val}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Per Sumber Dana</p>
                        {walletBreakdown.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-4">Belum ada data rekening.</p>
                        ) : walletBreakdown.map(w => (
                          <div key={w.name} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                  <Landmark size={12} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{w.name}</span>
                              </div>
                              <span className={`text-sm font-black truncate max-w-[50%] text-right ${w.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                                {displayMoney(w.balance)}
                              </span>
                            </div>
                            <div className="flex gap-3 text-[10px] text-slate-500 pl-9">
                              <span className="text-emerald-600 truncate max-w-[40%] text-right">+{formatIDR(w.income)}</span>
                              <span className="text-rose-500 truncate max-w-[40%] text-right">-{formatIDR(w.expense)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* Budget Section */}
                <section className="bg-white dark:bg-[#111] rounded-[1.75rem] shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-200/50 dark:border-slate-800/50 p-5 sm:p-6">
                  <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h2 className="text-sm font-black flex items-center gap-2 text-slate-800 dark:text-white"><AlertOctagon className="text-rose-500" size={18} /> Batas Anggaran</h2>
                      <p className="text-[10px] text-slate-400 mt-0.5">Peringatan micro-budgeting</p>
                    </div>
                    <button onClick={() => setIsEditingSettings(true)} className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors">Ubah Batas</button>
                  </div>
                  <div className="space-y-4">
                    {Object.keys(catBudgets).filter(k => Number(catBudgets[k]) > 0).length === 0 ? (
                      <div className="text-center p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800">
                        <AlertOctagon size={24} className="mx-auto mb-2 opacity-40" />
                        Belum ada batas anggaran. Klik <b className="text-blue-600">Ubah Batas</b>.
                      </div>
                    ) : (
                      Object.keys(catBudgets).filter(k => Number(catBudgets[k]) > 0).map(cat => {
                        const limit = Number(catBudgets[cat]);
                        const spent = filteredTransactions.filter(t => t.type === 'pengeluaran' && t.category === cat).reduce((acc, curr) => acc + Number(curr.amount), 0);
                        const percent = Math.min(100, Math.round((spent / limit) * 100));
                        const isDanger = spent > limit;
                        const isWarning = spent > limit * 0.8 && !isDanger;
                        return (
                          <div key={cat} className={`p-4 rounded-2xl border ${isDanger ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900' : isWarning ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800'}`}>
                            <div className="flex justify-between items-end mb-2">
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 truncate">{cat} {isDanger && <AlertTriangle size={12} className="text-rose-500 animate-pulse shrink-0" />}</p>
                                <p className="text-[10px] text-slate-500 font-medium truncate">{formatIDR(spent)} / {formatIDR(limit)}</p>
                              </div>
                              <span className={`text-xs font-black shrink-0 ${isDanger ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>{percent}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-700 rounded-full ${isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${percent}%` }} />
                            </div>
                            {isDanger && <p className="text-[10px] text-rose-600 mt-2 font-bold truncate">⚠️ Lewat {formatIDR(spent - limit)}</p>}
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

                {/* Pie Chart */}
                <section className="bg-white dark:bg-[#111] rounded-[1.75rem] shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-200/50 dark:border-slate-800/50 p-5 sm:p-6">
                  <div className="mb-1">
                    <h2 className="text-sm font-black flex items-center gap-2 text-slate-800 dark:text-white"><Tag size={18} className="text-blue-500" /> Alokasi Konsumsi</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">*Di luar Aset Investasi & Hutang</p>
                  </div>
                  <div className="h-40 w-full relative mt-3">
                    {categoryChartData.length === 0 ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <PieIcon size={28} className="opacity-30" />
                        <p className="text-xs font-medium">Belum ada pengeluaran</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryChartData} innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value" stroke="none">
                            {categoryChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(value: any) => formatIDR(Number(value))} contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: isDarkMode ? '#fff' : '#000', fontSize: '11px', fontWeight: '700' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    {categoryChartData.map((item: any, idx) => {
                      const total = categoryChartData.reduce((a, c) => a + c.value, 0);
                      const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{item.name}</span>
                            <span className="text-slate-400 font-medium shrink-0">{pct}%</span>
                          </div>
                          <span className="font-bold text-slate-800 dark:text-white shrink-0 ml-2 truncate max-w-[40%] text-right">{displayMoney(item.value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

              </div>
            </div>
          </>}

          {/* ═══ ANALYTICS VIEW ═══ */}
          {activeView === 'analytics' && <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* AI Insights */}
              <div className="bg-white dark:bg-[#111] border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-2xl relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-15 pointer-events-none ${aiPersonality === 'roasting' ? 'bg-rose-400' : 'bg-indigo-400'}`} />
                <div className="flex items-center justify-between mb-5 relative z-10 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl text-white shadow-md flex items-center justify-center ${aiPersonality === 'roasting' ? 'bg-gradient-to-br from-rose-500 to-red-600' : 'bg-gradient-to-br from-indigo-500 to-blue-600'}`}>
                      {aiPersonality === 'roasting' ? <ShieldAlert size={18} /> : <Bot size={18} />}
                    </div>
                    <div>
                      <h2 className={`font-black text-sm flex items-center gap-1.5 ${aiPersonality === 'roasting' ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`}>Asisten AI <Sparkles size={12} /></h2>
                      <p className="text-[10px] text-slate-400">Analisis otomatis</p>
                    </div>
                  </div>
                  <button onClick={toggleAIPersonality} className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl border ${aiPersonality === 'roasting' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800' : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'}`}>
                    <RefreshCw size={10} /> {aiPersonality}
                  </button>
                </div>
                <div className="space-y-3 relative z-10 overflow-y-auto max-h-[300px] custom-scrollbar">
                  {smartInsights.map((insight, idx) => {
                    const stl: Record<string, string> = { danger: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-800', warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800', success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800', info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800', tip: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
                    const ico: Record<string, React.ReactNode> = { danger: <AlertTriangle size={14} />, warning: <AlertTriangle size={14} />, success: <CheckCircle2 size={14} />, info: <Info size={14} />, tip: <Lightbulb size={14} /> };
                    return (<div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border ${stl[insight.type] || stl.tip}`}><span className="mt-0.5 shrink-0">{ico[insight.type] || ico.tip}</span><p className="text-xs font-medium leading-relaxed">{insight.text}</p></div>);
                  })}
                </div>
              </div>
              {/* Pie Chart */}
              <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5">
                <h2 className="text-sm font-black flex items-center gap-2 text-slate-800 dark:text-white mb-1"><Tag size={16} className="text-blue-500" /> Alokasi Konsumsi</h2>
                <p className="text-[10px] text-slate-400 mb-3">*Di luar Aset Investasi & Hutang</p>
                <div className="h-44 w-full relative">
                  {categoryChartData.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2"><PieIcon size={28} className="opacity-30" /><p className="text-xs">Belum ada pengeluaran</p></div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryChartData} innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value" stroke="none">{categoryChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}</Pie><Tooltip formatter={(value: any) => formatIDR(Number(value))} contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: isDarkMode ? '#fff' : '#000', fontSize: '11px', fontWeight: '700' }} /></PieChart></ResponsiveContainer>
                  )}
                </div>
                <div className="space-y-2 mt-3">
                  {categoryChartData.map((item: any, idx) => { const total = categoryChartData.reduce((a, c) => a + c.value, 0); const pct = total > 0 ? Math.round((item.value / total) * 100) : 0; return (<div key={idx} className="flex justify-between items-center text-xs"><div className="flex items-center gap-2 min-w-0 flex-1"><div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} /><span className="text-slate-600 dark:text-slate-300 font-medium truncate">{item.name}</span><span className="text-slate-400 shrink-0">{pct}%</span></div><span className="font-bold text-slate-800 dark:text-white shrink-0 ml-2 truncate max-w-[40%] text-right">{displayMoney(item.value)}</span></div>); })}
                </div>
              </div>
            </div>
            {/* Budget Section */}
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 mb-6">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-black flex items-center gap-2"><AlertOctagon className="text-rose-500" size={16} /> Batas Anggaran</h2>
                <button onClick={() => setIsEditingSettings(true)} className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800">Ubah Batas</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.keys(catBudgets).filter(k => Number(catBudgets[k]) > 0).length === 0 ? (
                  <div className="col-span-full text-center p-6 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800"><AlertOctagon size={24} className="mx-auto mb-2 opacity-40" />Belum ada batas anggaran.</div>
                ) : (
                  Object.keys(catBudgets).filter(k => Number(catBudgets[k]) > 0).map(cat => { const limit = Number(catBudgets[cat]); const spent = filteredTransactions.filter(t => t.type === 'pengeluaran' && t.category === cat).reduce((acc, curr) => acc + Number(curr.amount), 0); const percent = Math.min(100, Math.round((spent / limit) * 100)); const isDanger = spent > limit; const isWarning = spent > limit * 0.8 && !isDanger; return (<div key={cat} className={`p-4 rounded-xl border ${isDanger ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900' : isWarning ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800'}`}><div className="flex justify-between items-end mb-2"><div className="min-w-0 pr-2"><p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 truncate">{cat} {isDanger && <AlertTriangle size={12} className="text-rose-500 shrink-0" />}</p><p className="text-[10px] text-slate-500 truncate">{formatIDR(spent)} / {formatIDR(limit)}</p></div><span className={`text-xs font-black shrink-0 ${isDanger ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>{percent}%</span></div><div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full transition-all duration-700 rounded-full ${isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${percent}%` }} /></div>{isDanger && <p className="text-[10px] text-rose-600 mt-2 font-bold truncate">⚠️ Lewat {formatIDR(spent - limit)}</p>}</div>); })
                )}
              </div>
            </div>
            {/* Cashflow Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[{ label: 'Saving Rate', val: `${stats.savingsRate}%`, color: stats.savingsRate >= 20 ? 'text-emerald-600' : 'text-amber-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }, { label: 'Cashflow Ratio', val: `${stats.cashflowRatio}%`, color: stats.cashflowRatio < 80 ? 'text-emerald-600' : 'text-rose-600', bg: 'bg-blue-50 dark:bg-blue-900/20' }, { label: 'Total Transaksi', val: filteredTransactions.length.toString(), color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-50 dark:bg-slate-800' }, { label: 'Rata-rata Keluar', val: filteredTransactions.filter(t => t.type === 'pengeluaran').length > 0 ? formatIDR(stats.expense / filteredTransactions.filter(t => t.type === 'pengeluaran').length) : 'N/A', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' }].map(item => (<div key={item.label} className={`flex items-center justify-between p-4 rounded-xl ${item.bg} border border-slate-100 dark:border-slate-800`}><span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.label}</span><span className={`text-sm font-black truncate max-w-[50%] text-right ${item.color}`}>{item.val}</span></div>))}
            </div>
          </>}

          {/* ═══ WALLETS VIEW ═══ */}
          {activeView === 'wallets' && <>
            {/* Top row: Saldo + Hutang + Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
              {/* Saldo Rekening */}
              <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5">
                <h3 className="text-xs font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2 uppercase tracking-widest"><Landmark size={14} className="text-blue-500" /> Saldo Rekening</h3>
                <div className="space-y-2">
                  {walletBreakdown.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">Belum ada transaksi.</p> : walletBreakdown.map(w => (
                    <div key={w.name} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <div className="flex items-center gap-2"><div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center"><Landmark size={11} className="text-blue-600 dark:text-blue-400" /></div><span className="text-xs font-bold text-slate-700 dark:text-slate-300">{w.name}</span></div>
                      <div className="text-right"><p className={`text-xs font-black ${w.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{displayMoney(w.balance)}</p><p className="text-[9px] text-slate-400">+{formatIDR(w.income)} / -{formatIDR(w.expense)}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Hutang Piutang */}
              <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5">
                <h3 className="text-xs font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2 uppercase tracking-widest"><Briefcase size={14} className="text-amber-500" /> Hutang Piutang</h3>
                <div className="space-y-2">
                  {debtTracker.length === 0 ? <div className="flex flex-col items-center py-4"><CheckCircle2 size={24} className="text-emerald-400 mb-2" /><p className="text-xs text-slate-400 text-center">Tidak ada hutang aktif!</p></div> : debtTracker.map(d => (
                    <div key={d.name} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-lg flex items-center justify-center ${d.net > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}><span className="text-[10px]">{d.net > 0 ? '↑' : '↓'}</span></div><span className="text-xs font-bold text-slate-700 dark:text-slate-300">{d.name}</span></div>
                      <div className="text-right"><p className={`text-xs font-black ${d.net > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatIDR(Math.abs(d.net))}</p><p className="text-[9px] text-slate-400">{d.net > 0 ? 'Berhutang padamu' : 'Kamu berhutang'}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Radar Tagihan */}
              <div className="bg-[#0F172A] border border-slate-800/60 p-5 rounded-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500 rounded-full blur-[40px] opacity-20 pointer-events-none" />
                <div className="flex items-center gap-2 text-rose-400 mb-3 relative z-10"><div className="w-7 h-7 bg-rose-500/20 rounded-xl flex items-center justify-center border border-rose-500/30"><CreditCard size={14} /></div><div><p className="font-black text-xs uppercase tracking-widest">Radar Tagihan</p><p className="text-[9px] text-slate-500">Biaya berulang</p></div></div>
                <p className="text-2xl font-black mb-3 relative z-10">{displayMoney(stats.totalBills)}</p>
                <div className="space-y-1.5 relative z-10">
                  {stats.billsTransactions.length === 0 ? <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 p-2.5 rounded-xl border border-emerald-400/20"><CheckCircle2 size={14} /><p className="text-xs">Bersih, tidak ada tagihan!</p></div> : stats.billsTransactions.slice(0, 4).map((t: any) => (
                    <div key={t.id} className="flex justify-between items-center text-xs bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                      <div className="min-w-0 flex-1 pr-2"><p className="text-slate-300 truncate text-[11px]">{t.title}</p><p className="font-bold text-rose-400 text-[10px]">{formatIDR(Number(t.amount))}</p></div>
                      <button onClick={() => handleQuickPay(t)} className="shrink-0 bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded-lg transition-colors text-[10px]">Bayar</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Kantong Tabungan */}
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 mb-5">
              <div className="flex justify-between items-center mb-4">
                <div><h3 className="text-sm font-black flex items-center gap-2 text-slate-800 dark:text-white"><Target size={16} className="text-indigo-500" /> Kantong Tabungan</h3><p className="text-[10px] text-slate-400 mt-0.5">Sub-rekening virtual untuk target spesifik</p></div>
                <button onClick={() => setShowPocketModal(true)} className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-xl transition-colors shadow-sm"><Plus size={13} /> Buat Kantong</button>
              </div>
              {pockets.length === 0 ? (
                <div className="flex flex-col items-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <PiggyBank size={32} className="text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-sm font-bold text-slate-400">Belum ada kantong tabungan</p>
                  <p className="text-xs text-slate-400 mt-1">Buat kantong untuk target impianmu!</p>
                  <button onClick={() => setShowPocketModal(true)} className="mt-3 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors">+ Buat Kantong Pertama</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pockets.map(p => {
                    const pct = Math.min(100, Math.round((p.balance / p.target_amount) * 100));
                    return (
                      <div key={p.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-indigo-900/10 dark:to-slate-900">
                        <div className="flex items-center gap-2 mb-3"><span className="text-2xl">{p.icon}</span><div><p className="font-black text-sm text-slate-800 dark:text-white leading-tight">{p.name}</p><p className="text-[10px] text-slate-400">{pct}% tercapai</p></div></div>
                        <div className="mb-2"><div className="flex justify-between text-[10px] mb-1"><span className="text-slate-500">{formatIDR(p.balance)}</span><span className="font-bold text-indigo-600">{formatIDR(p.target_amount)}</span></div><div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} /></div></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Portofolio Investasi */}
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 mb-5">
              <div className="flex justify-between items-center mb-4">
                <div><h3 className="text-sm font-black flex items-center gap-2 text-slate-800 dark:text-white"><TrendingUp size={16} className="text-teal-500" /> Portofolio Investasi</h3><p className="text-[10px] text-slate-400 mt-0.5">Pantau nilai & keuntungan aset kamu</p></div>
                <button onClick={() => setShowInvestModal(true)} className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-teal-500 hover:bg-teal-600 px-3 py-1.5 rounded-xl transition-colors shadow-sm"><Plus size={13} /> Tambah Aset</button>
              </div>
              {investments.length === 0 ? (
                <div className="flex flex-col items-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Gem size={32} className="text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-sm font-bold text-slate-400">Belum ada aset investasi</p>
                  <p className="text-xs text-slate-400 mt-1">Catat emas, saham, reksa dana, kripto, dll.</p>
                  <button onClick={() => setShowInvestModal(true)} className="mt-3 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-4 py-2 rounded-xl border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors">+ Tambah Aset Pertama</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {investments.map(inv => {
                    const profit = inv.current_value - inv.invested_amount;
                    const pct = (profit / inv.invested_amount) * 100;
                    const isUp = profit >= 0;
                    return (
                      <div key={inv.id} className={`p-4 rounded-xl border bg-gradient-to-br ${isUp ? 'from-teal-50 to-slate-50 border-teal-100 dark:from-teal-900/10 dark:to-slate-900 dark:border-teal-900' : 'from-rose-50 to-slate-50 border-rose-100 dark:from-rose-900/10 dark:to-slate-900 dark:border-rose-900'}`}>
                        <div className="flex justify-between items-start mb-2"><div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{inv.asset_type}</p><p className="font-black text-sm text-slate-800 dark:text-white mt-0.5">{inv.asset_name}</p>{inv.platform && <p className="text-[10px] text-slate-400">{inv.platform}</p>}</div><span className={`text-[10px] font-black px-2 py-1 rounded-lg ${isUp ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>{isUp ? '+' : ''}{pct.toFixed(1)}%</span></div>
                        <div className="flex justify-between items-end mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800"><div><p className="text-[9px] text-slate-400">Nilai Kini</p><p className={`font-black text-sm ${isUp ? 'text-teal-600' : 'text-rose-600'}`}>{formatIDR(inv.current_value)}</p></div><div className="text-right"><p className="text-[9px] text-slate-400">Modal</p><p className="text-xs font-bold text-slate-600 dark:text-slate-300">{formatIDR(inv.invested_amount)}</p></div></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Export */}
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 mb-10">
              <h3 className="text-sm font-black mb-1 text-slate-800 dark:text-white">Export Laporan</h3>
              <p className="text-[10px] text-slate-400 mb-3">Unduh atau bagikan ringkasan keuanganmu</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={exportPDF} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold py-3 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors text-sm"><FileText size={16} /> PDF</button>
                <button onClick={exportCSV} className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold py-3 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors text-sm"><Download size={16} /> CSV</button>
                <button onClick={exportWA} className="flex-1 flex items-center justify-center gap-2 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-bold py-3 rounded-xl border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors text-sm"><MessageSquare size={16} /> WhatsApp</button>
              </div>
            </div>
          </>}



        </div>{/* end content padding */}
      </div>{/* end main content */}

      {/* ── POCKET MODAL ── */}
      {showPocketModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4" onClick={() => setShowPocketModal(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center"><Target size={20} /></div><div><h3 className="font-black text-lg">Buat Kantong Baru</h3><p className="text-indigo-200 text-xs">Tentukan nama dan target tabunganmu</p></div></div><button onClick={() => setShowPocketModal(false)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"><X size={16} /></button></div>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Nama Kantong</label><input placeholder="Contoh: Liburan Jepang ✈️" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" value={pocketForm.name} onChange={e => setPocketForm({...pocketForm, name: e.target.value})} /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Ikon</label><div className="flex gap-2 flex-wrap">{['🎯','✈️','🏠','💻','🎓','💍','🚗','💎','🏖️','🎮'].map(ic => (<button key={ic} onClick={() => setPocketForm({...pocketForm, icon: ic})} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${pocketForm.icon === ic ? 'bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-500' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'}`}>{ic}</button>))}</div></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Target Nominal (Rp)</label><input type="number" placeholder="25.000.000" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" value={pocketForm.target_amount} onChange={e => setPocketForm({...pocketForm, target_amount: e.target.value})} /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Saldo Awal (Opsional)</label><input type="number" placeholder="0" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" value={pocketForm.balance} onChange={e => setPocketForm({...pocketForm, balance: e.target.value})} /></div>
              <button onClick={handleSavePocket} disabled={isSavingPocket} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/20">{isSavingPocket ? <><Loader2 className="animate-spin" size={18} />Menyimpan...</> : <><Check size={18} /> Buat Kantong</>}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── INVEST MODAL ── */}
      {showInvestModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4" onClick={() => setShowInvestModal(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center"><TrendingUp size={20} /></div><div><h3 className="font-black text-lg">Tambah Aset Investasi</h3><p className="text-teal-200 text-xs">Catat nilai aset yang kamu miliki</p></div></div><button onClick={() => setShowInvestModal(false)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"><X size={16} /></button></div>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Jenis Aset</label><div className="flex flex-wrap gap-2">{['Saham','Reksa Dana','Emas','Kripto','Deposito','Properti','Lainnya'].map(t => (<button key={t} onClick={() => setInvestForm({...investForm, asset_type: t})} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${investForm.asset_type === t ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 ring-2 ring-teal-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}>{t}</button>))}</div></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Nama Aset</label><input placeholder="Contoh: BBCA, Bitcoin, SBN" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all" value={investForm.name} onChange={e => setInvestForm({...investForm, name: e.target.value})} /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Platform</label><input placeholder="Contoh: Bibit, Indodax, Tokopedia" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all" value={investForm.platform} onChange={e => setInvestForm({...investForm, platform: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Modal Awal (Rp)</label><input type="number" placeholder="0" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all" value={investForm.invested_amount} onChange={e => setInvestForm({...investForm, invested_amount: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Nilai Kini (Rp)</label><input type="number" placeholder="0" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all" value={investForm.current_value} onChange={e => setInvestForm({...investForm, current_value: e.target.value})} /></div>
              </div>
              {investForm.invested_amount && investForm.current_value && (() => { const p = Number(investForm.current_value) - Number(investForm.invested_amount); const pct = (p / Number(investForm.invested_amount)) * 100; return <div className={`flex items-center justify-between p-3 rounded-xl ${p >= 0 ? 'bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800' : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'}`}><span className="text-xs font-bold text-slate-600 dark:text-slate-400">Estimasi P&L</span><span className={`text-sm font-black ${p >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>{p >= 0 ? '+' : ''}{formatIDR(p)} ({pct.toFixed(1)}%)</span></div>; })()}
              <button onClick={handleSaveInvest} disabled={isSavingInvest} className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-teal-500/20">{isSavingInvest ? <><Loader2 className="animate-spin" size={18} />Menyimpan...</> : <><Check size={18} /> Simpan Aset</>}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MOBILE BOTTOM NAV REFINED ═══ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/60 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <div className="flex items-end justify-around py-2 px-1 relative">

          {[{ id: 'dashboard' as const, icon: Home, label: 'Beranda' }, { id: 'analytics' as const, icon: BarChart3, label: 'Analitik' }].map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id)} className={`flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all duration-300 ${activeView === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
              <div className={`transition-transform duration-300 ${activeView === item.id ? 'scale-110' : 'scale-100'}`}>
                <item.icon size={22} strokeWidth={activeView === item.id ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] tracking-wide transition-all ${activeView === item.id ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </button>
          ))}

          {/* CENTER FLOATING BUTTON */}
          <div className="relative -top-6 px-2">
            <button
              onClick={() => setActiveView('transactions')}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 active:scale-95 ${activeView === 'transactions' ? 'bg-blue-600 shadow-blue-500/40 ring-4 ring-blue-50 dark:ring-blue-900/30' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30 border-2 border-white dark:border-[#0A0A0A]'}`}
            >
              <Plus size={24} strokeWidth={2.5} className="text-white" />
            </button>
            <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] tracking-wide whitespace-nowrap transition-all ${activeView === 'transactions' ? 'font-bold text-blue-600 dark:text-blue-400' : 'font-medium text-slate-400'}`}>Catat</span>
          </div>

          {[{ id: 'wallets' as const, icon: CreditCard, label: 'Dompet' }, { id: 'settings' as const, icon: Settings, label: 'Lainnya' }].map(item => (
            <button key={item.id} onClick={() => { if (item.id === 'settings') setIsEditingSettings(true); else setActiveView(item.id); }} className={`flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all duration-300 ${activeView === item.id || (item.id === 'settings' && isEditingSettings) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
              <div className={`transition-transform duration-300 ${activeView === item.id || (item.id === 'settings' && isEditingSettings) ? 'scale-110' : 'scale-100'}`}>
                <item.icon size={22} strokeWidth={activeView === item.id || (item.id === 'settings' && isEditingSettings) ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] tracking-wide transition-all ${activeView === item.id || (item.id === 'settings' && isEditingSettings) ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </button>
          ))}

        </div>
      </nav>

      {/* ── RECEIPT MODAL ── */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedReceipt(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Receipt Header */}
            <div className={`p-6 text-center text-white ${selectedReceipt.type === 'pemasukan' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : selectedReceipt.category === 'Investasi' ? 'bg-gradient-to-br from-teal-500 to-cyan-600' : 'bg-gradient-to-br from-rose-500 to-red-600'}`}>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                {selectedReceipt.type === 'pemasukan' ? <ArrowUpRight size={26} /> : selectedReceipt.category === 'Investasi' ? <Gem size={26} /> : <ArrowDownRight size={26} />}
              </div>
              <h3 className="font-black text-xl uppercase tracking-wide">Struk Transaksi</h3>
              <p className="text-white/70 text-xs mt-1">{new Date(selectedReceipt.created_at).toLocaleString('id-ID')}</p>
            </div>

            {/* Ticket perforation */}
            <div className="relative">
              <div className="absolute -top-3 left-0 right-0 flex justify-between px-2">
                {[...Array(14)].map((_, i) => <div key={i} className="w-5 h-6 bg-[#F0F4F8] dark:bg-slate-950 rounded-full" />)}
              </div>
              <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 mx-5 pt-8 pb-5 space-y-4">
                <div className="text-center mb-5">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total {selectedReceipt.type}</p>
                  <p className={`text-4xl font-black truncate px-2 ${selectedReceipt.type === 'pemasukan' ? 'text-emerald-500' : selectedReceipt.category === 'Investasi' ? 'text-teal-500' : 'text-rose-500'}`}>
                    {formatIDR(Number(selectedReceipt.amount))}
                  </p>
                </div>
                {[
                  { label: 'Keterangan', val: selectedReceipt.title },
                  { label: 'Kategori', val: selectedReceipt.category },
                  { label: 'Sumber Dana', val: selectedReceipt.wallet || 'Tunai', extra: 'text-blue-600 dark:text-blue-400' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-start">
                    <span className="text-slate-400 text-xs font-medium">{row.label}</span>
                    <span className={`text-xs font-bold text-right max-w-[60%] truncate ${row.extra || 'text-slate-800 dark:text-slate-200'}`}>{row.val}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-medium">Ref ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300">{selectedReceipt.id.split('-')[0].toUpperCase()}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(selectedReceipt.id); showToast('Ref ID disalin!', 'success'); }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      title="Salin ID">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                {selectedReceipt.image_url && (
                  <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <img src={selectedReceipt.image_url} alt="Bukti Struk" className="w-full h-auto object-cover max-h-48" />
                  </div>
                )}
              </div>
              {/* Barcode decoration */}
              <div className="mx-5 border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-5 pb-5 text-center">
                <div className="h-10 w-full flex justify-center gap-0.5 opacity-30">
                  {[...Array(30)].map((_, i) => <div key={i} className="bg-slate-800 dark:bg-slate-200 h-full rounded-sm" style={{ width: `${Math.random() * 3 + 1}px` }} />)}
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-bold tracking-widest uppercase">Dompet Digital • {new Date().getFullYear()}</p>
              </div>
            </div>

            <button onClick={() => setSelectedReceipt(null)} className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full backdrop-blur-sm transition-all"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* ── SETTINGS MODAL ── */}
      {isEditingSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            <div className="flex justify-between items-center mb-7 sticky top-0 bg-white dark:bg-slate-900 pb-4 z-10 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Pengaturan Lanjutan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sesuaikan target & batasan keuanganmu</p>
              </div>
              <button onClick={() => setIsEditingSettings(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-500 hover:text-rose-500 transition-all"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              <div className="space-y-5">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm"><Wallet size={16} className="text-blue-500" /> Data Dasar</h4>
                {[
                  { label: 'Saldo Kas Tunai Awal', placeholder: 'Contoh: 1000000', val: initialBalance, setter: setInitialBalance },
                  { label: 'Target Kekayaan Impian', placeholder: 'Contoh: 50000000', val: targetSaving, setter: setTargetSaving },
                ].map(field => (
                  <div key={field.label}>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">{field.label}</label>
                    <input type="number" placeholder={field.placeholder} className="w-full bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 ring-blue-500/20 font-bold text-slate-800 dark:text-white text-sm" value={field.val} onChange={e => field.setter(e.target.value as any)} />
                    {field.val ? <p className="text-[10px] text-blue-500 mt-1 font-bold truncate">→ {formatIDR(Number(field.val))}</p> : null}
                  </div>
                ))}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={handleResetData} disabled={isSubmitting} className="w-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-bold py-3 rounded-2xl hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50 text-sm border border-rose-100 dark:border-rose-900">
                    {isSubmitting ? <><Loader2 className="animate-spin inline mr-2" size={14} />Menghapus...</> : '🗑️ Hapus Semua Data (Reset)'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1 text-sm"><AlertOctagon size={16} className="text-rose-500" /> Batas Anggaran per Kategori</h4>
                  <p className="text-[10px] text-slate-400 mb-4">Kosongkan jika tidak dibatasi.</p>
                </div>
                {['Makanan', 'Tagihan', 'Transportasi', 'Belanja', 'Hiburan'].map((cat) => (
                  <div key={cat} className="flex flex-col bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-xs font-bold text-slate-600 dark:text-slate-300">{cat}</span>
                      <input type="number" placeholder="Tanpa batas" className="w-full bg-transparent p-2 outline-none font-bold text-slate-800 dark:text-white text-xs border-b border-slate-200 dark:border-slate-700 focus:border-blue-500 transition-colors" value={catBudgets[cat]} onChange={e => setCatBudgets({ ...catBudgets, [cat]: e.target.value })} />
                    </div>
                    {catBudgets[cat] && <p className="text-[10px] text-blue-500 text-right mt-1 font-bold truncate">{formatIDR(Number(catBudgets[cat]))}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Theme Picker */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3 text-sm"><Sparkles size={16} className="text-amber-500" /> Tema Aplikasi (Beta)</h4>
              <div className="flex gap-3">
                {[
                  { id: 'default', name: 'Default', bg: 'bg-blue-500' },
                  { id: 'cyberpunk', name: 'Cyberpunk', bg: 'bg-fuchsia-500' },
                  { id: 'matcha', name: 'Matcha', bg: 'bg-emerald-500' },
                  { id: 'ocean', name: 'Ocean', bg: 'bg-cyan-500' }
                ].map(theme => (
                  <button key={theme.id} onClick={() => setAppTheme(theme.id)} className={`flex-1 p-2 rounded-xl border ${appTheme === theme.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'} transition-all flex flex-col items-center gap-1.5`}>
                    <div className={`w-6 h-6 rounded-full ${theme.bg}`} />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
              <button onClick={saveSettings} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none active:scale-[0.98] text-sm">
                <Check size={16} className="inline mr-2" />Simpan Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── STAT CARD COMPONENT ──────────────────────────────────────────────────────
function StatCard({ title, val, icon, color, bg }: any) {
  return (
    <div className="bg-white dark:bg-[#111] p-3.5 sm:p-4 rounded-[1.25rem] shadow-sm shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800/50 flex flex-col gap-2.5 hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
      <div className="flex items-center gap-2">
        <div className={`${bg} ${color} w-8 h-8 flex items-center justify-center rounded-[0.65rem] shrink-0`}>
          {icon}
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.05em] truncate">
          {title}
        </p>
      </div>
      <p className="text-[14px] sm:text-[15px] xl:text-[16px] font-black text-slate-900 dark:text-white tracking-tight leading-tight break-words">
        {val}
      </p>
    </div>
  );
}