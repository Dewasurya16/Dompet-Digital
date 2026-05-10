/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Wallet, Target, FileText, Plus, Calendar, PieChart as PieIcon,
  ArrowUpRight, ArrowDownRight, Tag, Settings, X, Moon, Sun,
  LogOut, Bot, Sparkles, Search, Download, Loader2,
  Edit2, Trash2, AlertTriangle, CheckCircle2, ArrowUpDown, ArrowDownLeft, ChevronDown,
  Eye, EyeOff, Receipt, ShieldAlert, RefreshCw, Gem, Briefcase,
  AlertOctagon, CreditCard, MessageSquare, Landmark, Copy,
  TrendingUp, TrendingDown, BarChart3, PiggyBank, Check,
  Bell, Info, Zap, Home, LayoutGrid, Camera, Lightbulb, MapPin, Mail, Users
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

// ─── SWEETALERT TOAST (COMIC STYLE) ───────────────────────────────────────────
const SwalToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: { popup: 'rounded-xl border-[3px] border-[#0B3E3A] shadow-[6px_6px_0_0_#0B3E3A] text-sm font-black text-[#0B3E3A]' },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const formatIDR = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const parseMonthSafe = (ym: string) => new Date(`${ym}-15`);
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const CATEGORY_COLORS: any = {
  'Makanan': '#FDE68A', 'Transportasi': '#BAE6FD', 'Tagihan': '#FECDD3',
  'Belanja': '#FBCFE8', 'Hiburan': '#DDD6FE', 'Investasi': '#A7F3D0',
  'SPPD': '#FED7AA', 'Beri Hutang': '#E2E8F0', 'Bayar Pinjaman': '#E2E8F0',
  'Gaji Pokok': '#A7F3D0', 'Tukin': '#BAE6FD', 'Uang Makan': '#FDE68A',
  'Bonus': '#DDD6FE', 'Dibayar Hutang': '#E2E8F0', 'Terima Pinjaman': '#E2E8F0',
  'Lainnya': '#F1F5F9'
};

const WALLET_OPTIONS = ['Kas Tunai', 'Mandiri', 'BRI', 'BCA', 'BNI', 'BSI', 'GoPay', 'OVO', 'DANA', 'Lainnya'];
const DEFAULT_FORM = { title: '', amount: '', type: 'pengeluaran', category: 'Makanan', wallet: 'Kas Tunai', image_url: '', person_name: '', currency: 'IDR', original_amount: '', latitude: null as number | null, longitude: null as number | null };

// ─── TOAST SYSTEM (COMIC STYLE) ───────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';
type Toast = { id: number; message: string; type: ToastType };

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={18} strokeWidth={2.5} />,
    error: <AlertTriangle size={18} strokeWidth={2.5} />,
    warning: <AlertOctagon size={18} strokeWidth={2.5} />,
    info: <Info size={18} strokeWidth={2.5} />,
  };
  const styles: Record<ToastType, string> = {
    success: 'bg-[#A7F3D0] text-[#0B3E3A]',
    error: 'bg-[#FECDD3] text-[#0B3E3A]',
    warning: 'bg-[#FDE68A] text-[#0B3E3A]',
    info: 'bg-[#BAE6FD] text-[#0B3E3A]',
  };
  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 z-[999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-[3px] border-[#0B3E3A] shadow-[4px_4px_0_0_#0B3E3A] text-sm font-black max-w-xs pointer-events-auto animate-in slide-in-from-right duration-300 ${styles[t.type]}`}>
          {icons[t.type]}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="opacity-70 hover:opacity-100 shrink-0 hover:scale-110 transition-transform"><X size={16} strokeWidth={3} /></button>
        </div>
      ))}
    </div>
  );
}

// ─── CONFIRM DIALOG (COMIC STYLE) ─────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = false }: {
  open: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-[#0B3E3A]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[8px_8px_0_0_#0B3E3A] dark:shadow-[8px_8px_0_0_#FFFFFF] p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
        <div className={`w-14 h-14 rounded-full border-[3px] border-[#0B3E3A] dark:border-white flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-[#FECDD3] text-[#E11D48]' : 'bg-[#FDE68A] text-[#D97706]'}`}>
          <AlertTriangle size={28} strokeWidth={2.5} />
        </div>
        <h3 className="text-center font-black text-[#0B3E3A] dark:text-white text-xl mb-2">{title}</h3>
        <p className="text-center text-[#0B3E3A]/70 dark:text-slate-300 font-bold text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-white dark:bg-[#2A2A2A] border-[3px] border-[#0B3E3A] dark:border-white text-[#0B3E3A] dark:text-white font-black rounded-xl hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[3px_3px_0_0_#0B3E3A] dark:shadow-[3px_3px_0_0_#FFFFFF] transition-all">Batal</button>
          <button onClick={onConfirm} className={`flex-1 py-3 font-black rounded-xl border-[3px] border-[#0B3E3A] shadow-[3px_3px_0_0_#0B3E3A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-[#0B3E3A] ${danger ? 'bg-[#F43F5E]' : 'bg-[#10B981]'}`}>Ya, Gas!</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [isScanning, setIsScanning] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [initialBalance, setInitialBalance] = useState<number | string>(0);
  const [targetSaving, setTargetSaving] = useState<number | string>(25000000);
  const [catBudgets, setCatBudgets] = useState<any>({ Makanan: '', Transportasi: '', Tagihan: '', Belanja: '', Hiburan: '', Lainnya: '' });

  const [pockets, setPockets] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [appTheme, setAppTheme] = useState('default');

  const [showPocketModal, setShowPocketModal] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [pocketForm, setPocketForm] = useState({ name: '', icon: '🎯', target_amount: '', balance: '' });
  const [investForm, setInvestForm] = useState({ name: '', asset_type: 'Saham', platform: '', invested_amount: '', current_value: '' });
  const [isSavingPocket, setIsSavingPocket] = useState(false);
  const [isSavingInvest, setIsSavingInvest] = useState(false);
  const [editingPocketId, setEditingPocketId] = useState<string | null>(null);
  const [editingInvestId, setEditingInvestId] = useState<string | null>(null);

  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingPDFEmail, setIsSendingPDFEmail] = useState(false);
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
  const [activeView, setActiveView] = useState<'dashboard' | 'transactions' | 'analytics' | 'wallets' | 'settings' | 'bills'>('dashboard');

  const [bills, setBills] = useState<any[]>([]);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billForm, setBillForm] = useState({ name: '', amount: '', due_date: '', category: 'Tagihan' });
  const [isSavingBill, setIsSavingBill] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);

  const fetchData = async (userId?: string) => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const uid = userId || currentSession?.user?.id;
    if (!uid) return;

    setLoading(true);
    const [txRes, pocketsRes, invRes, billsRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('pockets').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('investments').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('bills').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    ]);
    if (!txRes.error && txRes.data) setTransactions(txRes.data);
    if (!pocketsRes.error && pocketsRes.data) setPockets(pocketsRes.data);
    if (!invRes.error && invRes.data) setInvestments(invRes.data);
    if (!billsRes.error && billsRes.data) setBills(billsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    setIsMounted(true);
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession) fetchData();
      else router.push('/login');
      setIsCheckingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') { setSession(session); fetchData(); }
      else if (event === 'SIGNED_OUT') {
        setSession(null); setTransactions([]); router.push('/login');
      }
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
  }, [router]);

  useEffect(() => {
    if (!isMounted) return;
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('fin_theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('fin_theme', 'light'); }
  }, [isDarkMode, isMounted]);

  useEffect(() => {
    if (!isMounted || !session?.user?.email || bills.length === 0) return;
    const today = new Date();
    const todayDate = today.getDate();
    const lastBillReminderKey = `last_bill_reminder_${today.toDateString()}`;
    if (!localStorage.getItem(lastBillReminderKey)) {
      bills.forEach((bill: any) => {
        const daysLeft = bill.due_date - todayDate;
        if (daysLeft === 3 || daysLeft === 1) {
          fetch('/api/send-notification', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email, type: 'bill_reminder', data: { billName: bill.name, amount: bill.amount, daysLeft } })
          }).catch(console.error);
        }
      });
      localStorage.setItem(lastBillReminderKey, 'true');
    }
  }, [bills, isMounted, session]);

  const togglePrivacy = () => { const nv = !showBalance; setShowBalance(nv); localStorage.setItem('fin_privacy', nv ? 'visible' : 'hidden'); };
  const toggleAIPersonality = () => { const nv = aiPersonality === 'motivator' ? 'roasting' : 'motivator'; setAiPersonality(nv); localStorage.setItem('fin_ai_personality', nv); };
  const displayMoney = (amount: number) => showBalance ? formatIDR(amount) : 'Rp ••••••';

  const username = session?.user?.email ? session.user.email.split('@')[0] : '';
  const displayUsername = username.charAt(0).toUpperCase() + username.slice(1);

  // AI auto-categorization
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

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: 'question', title: 'Keluar dari Akun?', text: 'Sesi kamu akan diakhiri. Sampai jumpa! 👋',
      showCancelButton: true, confirmButtonColor: '#F43F5E', cancelButtonColor: '#94A3B8',
      confirmButtonText: 'Ya, Keluar', cancelButtonText: 'Batal', reverseButtons: true,
      customClass: { popup: 'rounded-2xl border-[4px] border-[#0B3E3A] shadow-[8px_8px_0_0_#0B3E3A]', confirmButton: 'rounded-xl font-black border-[3px] border-[#0B3E3A]', cancelButton: 'rounded-xl font-black border-[3px] border-[#0B3E3A]' },
    });
    if (!result.isConfirmed) return;
    setIsCheckingAuth(true);
    const { error } = await supabase.auth.signOut();
    if (error) { showToast('Gagal keluar: ' + error.message, 'error'); setIsCheckingAuth(false); }
  };

  const saveSettings = () => {
    localStorage.setItem('fin_initialBalance', (initialBalance || 0).toString());
    localStorage.setItem('fin_targetSaving', (targetSaving || 0).toString());
    localStorage.setItem('fin_catBudgets', JSON.stringify(catBudgets));
    setIsEditingSettings(false); showToast('Pengaturan berhasil disimpan!', 'success');
  };

  const handleResetData = async () => {
    const ok = await confirm('Hapus Semua Data', 'Tindakan ini akan menghapus SELURUH riwayat transaksimu dan tidak bisa dibatalkan.', true);
    if (!ok) return;
    setIsSubmitting(true);
    const uid = session?.user?.id; if (!uid) return;
    const { error } = await supabase.from('transactions').delete().eq('user_id', uid);
    if (!error) { localStorage.clear(); window.location.reload(); }
    else { showToast('Gagal mereset data.', 'error'); setIsSubmitting(false); }
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = '';
    setReceiptPreview(URL.createObjectURL(file));
    setIsScanning(true); showToast("AI sedang membaca struk... 🤖", "info");

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
      } catch (e) { console.error('Upload fail', e); }

      try {
        const res = await fetch('/api/scan-receipt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64 }) });
        const data = await res.json();
        if (res.ok && data.title) {
          setFormData((prev: any) => ({ ...prev, title: data.title, amount: data.amount.toString(), category: data.category || 'Makanan', type: 'pengeluaran', image_url: publicImageUrl }));
          showToast("Struk berhasil dipindai! Silakan cek form.", "success");
        } else { showToast(data.error || "Gagal membaca struk.", "error"); }
      } catch (err) { console.error("Error Scan API:", err); showToast("Terjadi kesalahan koneksi ke server.", "error"); }
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
    e.preventDefault(); if (!formData.title || !formData.amount) return;
    setIsSubmitting(true);
    let lat = formData.latitude, lng = formData.longitude;
<<<<<<< HEAD

=======
    
>>>>>>> 9a6c17f4c90e52860e79e1a86cee2f5c010d72f5
    if (useLocation && !lat && !lng) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch (err) { console.warn("Location disabled or timed out"); }
    }

    const payload = { title: formData.title, amount: Number(formData.amount), type: formData.type, category: formData.category, wallet: formData.wallet, image_url: formData.image_url, person_name: formData.person_name, currency: formData.currency, original_amount: formData.original_amount ? Number(formData.original_amount) : null, latitude: lat, longitude: lng, user_id: session?.user?.id };

    if (editingId) {
      const { error } = await supabase.from('transactions').update(payload).eq('id', editingId);
      setIsSubmitting(false);
      if (!error) {
        setEditingId(null); setReceiptPreview(null); setFormData(DEFAULT_FORM); setUseLocation(false); fetchData(); showToast('Transaksi berhasil diperbarui!', 'success');
      } else showToast(`Gagal update: ${error.message}`, 'error');
    } else {
      // 🚀 PROSES SIMPAN TRANSAKSI BARU
      const { data, error } = await supabase.from('transactions').insert([payload]).select().single();
      setIsSubmitting(false);
<<<<<<< HEAD

=======
      
>>>>>>> 9a6c17f4c90e52860e79e1a86cee2f5c010d72f5
      if (!error && data) {
        if (session?.user?.email) {
          // ✉️ TRIGGER 1: KIRIM EMAIL STRUK
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
              refId: data.id,
              date: new Date().toLocaleString('id-ID'),
              latitude: lat,
              longitude: lng
            })
          }).catch(console.error);

          // 🤖 TRIGGER 2: CEK BUDGET UNTUK NOTIFIKASI AI
          if (payload.type === 'pengeluaran' && catBudgets[payload.category]) {
            const limit = Number(catBudgets[payload.category]);
            // Hitung total pengeluaran + transaksi baru
            const spentSoFar = filteredTransactions.filter((t: any) => t.type === 'pengeluaran' && t.category === payload.category).reduce((acc: any, curr: any) => acc + Number(curr.amount), 0) + payload.amount;
<<<<<<< HEAD

=======
            
>>>>>>> 9a6c17f4c90e52860e79e1a86cee2f5c010d72f5
            // Jika lewat 90% dari budget, kirim email alert
            if (spentSoFar >= limit * 0.9 && limit > 0) {
              fetch('/api/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: session.user.email,
                  type: 'budget_alert',
                  data: { category: payload.category, spent: spentSoFar, limit: limit, personality: aiPersonality }
                })
              }).catch(console.error);
            }
          }

          // 🚨 TRIGGER 3: CEK SALDO KAS/DOMPET MINUS (KAS MERAH)
          const currentWalletBalance = walletBreakdown.find((w: any) => w.name === payload.wallet)?.balance || 0;
          const newWalletBalance = payload.type === 'pengeluaran' ? currentWalletBalance - payload.amount : currentWalletBalance + payload.amount;

          if (newWalletBalance < 0 && payload.type === 'pengeluaran') {
            fetch('/api/send-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: session.user.email,
<<<<<<< HEAD
                type: 'anomaly_alert',
                data: {
                  amount: payload.amount,
                  category: 'SALDO MINUS',
                  description: `Awas! Pengeluaran ini membuat saldo ${payload.wallet} kamu jadi minus/berdarah (Defisit). Segera cek keuanganmu!`
=======
                type: 'anomaly_alert', 
                data: { 
                  amount: payload.amount, 
                  category: 'SALDO MINUS', 
                  description: `Awas! Pengeluaran ini membuat saldo ${payload.wallet} kamu jadi minus/berdarah (Defisit). Segera cek keuanganmu!` 
>>>>>>> 9a6c17f4c90e52860e79e1a86cee2f5c010d72f5
                }
              })
            }).catch(console.error);
          }

          // 🏆 TRIGGER 4: TARGET IMPIAN UTAMA TERCAPAI
          const currentNetWorth = stats.globalNetWorth;
          const target = Number(targetSaving);
<<<<<<< HEAD

=======
          
>>>>>>> 9a6c17f4c90e52860e79e1a86cee2f5c010d72f5
          if (currentNetWorth < target && (currentNetWorth + payload.amount) >= target && payload.type === 'pemasukan') {
            fetch('/api/send-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: session.user.email,
                type: 'goal_reached',
<<<<<<< HEAD
                data: {
                  pocketName: 'Target Kekayaan Impian',
                  targetAmount: target
=======
                data: { 
                  pocketName: 'Target Kekayaan Impian', 
                  targetAmount: target 
>>>>>>> 9a6c17f4c90e52860e79e1a86cee2f5c010d72f5
                }
              })
            }).catch(console.error);
          }
        }

        setFormData(DEFAULT_FORM); setUseLocation(false); setReceiptPreview(null); fetchData(); showToast('Transaksi disimpan & Email dikirim! 🎉', 'success');
      } else {
        showToast(`Gagal simpan: ${error?.message}`, 'error');
      }
    }
  };

  const handleEditClick = (t: any) => {
    setEditingId(t.id); setReceiptPreview(null);
    setFormData({ ...DEFAULT_FORM, title: t.title, amount: t.amount.toString(), type: t.type, category: t.category, wallet: t.wallet || 'Kas Tunai', image_url: t.image_url || '', person_name: t.person_name || '', currency: t.currency || 'IDR', original_amount: t.original_amount ? t.original_amount.toString() : '', latitude: t.latitude || null, longitude: t.longitude || null });
    setUseLocation(!!t.latitude); document.getElementById('formCatat')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteTransaction = async (id: string) => {
    const ok = await confirm('Hapus Transaksi', 'Transaksi ini akan dihapus secara permanen.', true);
    if (!ok) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) { fetchData(); showToast('Transaksi dihapus.', 'info'); } else showToast('Gagal menghapus: ' + error.message, 'error');
  };

  const handleCancelEdit = () => { setEditingId(null); setReceiptPreview(null); setFormData(DEFAULT_FORM); setUseLocation(false); };

  const handleDuplicate = async (t: any) => {
    const ok = await confirm('Duplikat Transaksi', `Gunakan "${t.title}" sebagai template pencatatan baru?`);
    if (!ok) return;
    setFormData({ ...DEFAULT_FORM, title: t.title, amount: t.amount.toString(), type: t.type, category: t.category, wallet: t.wallet || 'Kas Tunai', image_url: t.image_url || '', person_name: t.person_name || '', currency: t.currency || 'IDR', original_amount: t.original_amount ? t.original_amount.toString() : '' });
    setEditingId(null); setReceiptPreview(null); document.getElementById('formCatat')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickPay = async (t: any) => {
    const ok = await confirm('Bayar Lagi', `Catat otomatis tagihan "${t.title}" sebesar ${formatIDR(Number(t.amount))} untuk hari ini?`);
    if (!ok) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('transactions').insert([{ title: t.title, amount: Number(t.amount), type: t.type, category: t.category, wallet: t.wallet }]);
    setIsSubmitting(false);
    if (!error) { fetchData(); showToast(`Tagihan ${t.title} berhasil dicatat!`, 'success'); } else { showToast('Gagal mencatat: ' + error.message, 'error'); }
  };

<<<<<<< HEAD
  const handleSavePocket = async () => {
    if (!pocketForm.name || !pocketForm.target_amount) return;
    setIsSavingPocket(true);

    const targetAmount = Number(pocketForm.target_amount);
    const currentBalance = Number(pocketForm.balance || 0);

    const payload = {
      name: pocketForm.name,
      icon: pocketForm.icon,
      target_amount: targetAmount,
      balance: currentBalance,
      user_id: session?.user?.id
    };

    const { error } = editingPocketId
      ? await supabase.from('pockets').update(payload).eq('id', editingPocketId)
      : await supabase.from('pockets').insert([payload]);

    setIsSavingPocket(false);

    if (!error) {
      // 🏆 CEK APAKAH TARGET KANTONG TERCAPAI
      if (currentBalance >= targetAmount) {
        fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: session.user.email,
            type: 'goal_reached',
            data: {
              pocketName: pocketForm.name,
              targetAmount: targetAmount
            }
          })
        }).catch(console.error);
      }

      setShowPocketModal(false); fetchData(); showToast('Kantong disimpan!', 'success');
    }
=======
 const handleSavePocket = async () => {
  if (!pocketForm.name || !pocketForm.target_amount) return;
  setIsSavingPocket(true);
  
  const targetAmount = Number(pocketForm.target_amount);
  const currentBalance = Number(pocketForm.balance || 0);

  const payload = { 
    name: pocketForm.name, 
    icon: pocketForm.icon, 
    target_amount: targetAmount, 
    balance: currentBalance, 
    user_id: session?.user?.id 
>>>>>>> 9a6c17f4c90e52860e79e1a86cee2f5c010d72f5
  };

  const { error } = editingPocketId 
    ? await supabase.from('pockets').update(payload).eq('id', editingPocketId)
    : await supabase.from('pockets').insert([payload]);

  setIsSavingPocket(false);

  if (!error) {
    // 🏆 CEK APAKAH TARGET KANTONG TERCAPAI
    if (currentBalance >= targetAmount) {
      fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          type: 'goal_reached',
          data: { 
            pocketName: pocketForm.name, 
            targetAmount: targetAmount 
          }
        })
      }).catch(console.error);
    }
    
    setShowPocketModal(false); fetchData(); showToast('Kantong disimpan!', 'success');
  }
};

  const handleEditPocket = (pocket: any) => { setEditingPocketId(pocket.id); setPocketForm({ name: pocket.name, icon: pocket.icon || '🎯', target_amount: pocket.target_amount.toString(), balance: pocket.balance.toString() }); setShowPocketModal(true); };
  const handleDeletePocket = async (id: string) => {
    const ok = await confirm('Hapus Kantong', 'Yakin ingin menghapus kantong ini?', true);
    if (!ok) return;
    const { error } = await supabase.from('pockets').delete().eq('id', id);
    if (!error) { fetchData(); showToast('Kantong dihapus.', 'info'); } else showToast('Gagal menghapus: ' + error.message, 'error');
  };

  const handleSaveInvest = async () => {
    if (!investForm.name || !investForm.invested_amount || !investForm.current_value) return showToast('Semua field wajib diisi!', 'warning');
    setIsSavingInvest(true);
    const payload = { asset_name: investForm.name, asset_type: investForm.asset_type, platform: investForm.platform || '', amount: Number(investForm.invested_amount), purchase_price: Number(investForm.invested_amount), invested_amount: Number(investForm.invested_amount), current_value: Number(investForm.current_value), current_price: Number(investForm.current_value), user_id: session?.user?.id };
    let error;
    if (editingInvestId) { const { error: updateError } = await supabase.from('investments').update(payload).eq('id', editingInvestId); error = updateError; }
    else { const { error: insertError } = await supabase.from('investments').insert([payload]); error = insertError; }
    setIsSavingInvest(false);
    if (!error) { setShowInvestModal(false); setEditingInvestId(null); setInvestForm({ name: '', asset_type: 'Saham', platform: '', invested_amount: '', current_value: '' }); fetchData(); showToast(editingInvestId ? 'Aset diperbarui! 📈' : 'Aset ditambahkan! 📈', 'success'); } else showToast('Gagal menyimpan: ' + error.message, 'error');
  };

  const handleEditInvest = (invest: any) => { setEditingInvestId(invest.id); setInvestForm({ name: invest.asset_name, asset_type: invest.asset_type, platform: invest.platform || '', invested_amount: invest.invested_amount.toString(), current_value: invest.current_value.toString() }); setShowInvestModal(true); };
  const handleDeleteInvest = async (id: string) => {
    const ok = await confirm('Hapus Aset', 'Yakin menghapus aset investasi ini?', true);
    if (!ok) return;
    const { error } = await supabase.from('investments').delete().eq('id', id);
    if (!error) { fetchData(); showToast('Aset dihapus.', 'info'); } else showToast('Gagal menghapus: ' + error.message, 'error');
  };

  const handleSaveBill = async () => {
    if (!billForm.name || !billForm.amount || !billForm.due_date) return showToast('Semua field wajib diisi!', 'warning');
    const dueDay = Number(billForm.due_date); if (dueDay < 1 || dueDay > 31) return showToast('Tanggal jatuh tempo 1-31!', 'warning');
    setIsSavingBill(true);
    const payload = { name: billForm.name, amount: Number(billForm.amount), due_date: dueDay, category: billForm.category, user_id: session?.user?.id };
    let error;
    if (editingBillId) { const { error: updateError } = await supabase.from('bills').update(payload).eq('id', editingBillId); error = updateError; }
    else { const { error: insertError } = await supabase.from('bills').insert([payload]); error = insertError; }
    setIsSavingBill(false);
    if (!error) { setShowBillModal(false); setEditingBillId(null); setBillForm({ name: '', amount: '', due_date: '', category: 'Tagihan' }); fetchData(); showToast(editingBillId ? 'Tagihan diperbarui!' : 'Tagihan ditambahkan!', 'success'); } else showToast('Gagal menyimpan: ' + error.message, 'error');
  };

  const handleEditBill = (bill: any) => { setEditingBillId(bill.id); setBillForm({ name: bill.name, amount: bill.amount.toString(), due_date: bill.due_date.toString(), category: bill.category }); setShowBillModal(true); };
  const handleDeleteBill = async (id: string) => {
    const ok = await confirm('Hapus Tagihan', 'Tagihan dihapus permanen.', true);
    if (!ok) return;
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (!error) { fetchData(); showToast('Tagihan dihapus.', 'info'); } else showToast('Gagal menghapus: ' + error.message, 'error');
  };

  const availableMonths = useMemo(() => {
    const months = new Set(transactions.map(t => { const d = new Date(t.created_at); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }));
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    if (filterMode === 'month') { if (filterMonth !== 'all') { result = result.filter(t => { const d = new Date(t.created_at); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === filterMonth; }); } }
    else if (filterMode === 'custom' && customStartDate && customEndDate) { const start = new Date(customStartDate); start.setHours(0, 0, 0, 0); const end = new Date(customEndDate); end.setHours(23, 59, 59, 999); result = result.filter(t => { const tDate = new Date(t.created_at); return tDate >= start && tDate <= end; }); }
    if (searchQuery) result = result.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()) || (t.wallet && t.wallet.toLowerCase().includes(searchQuery.toLowerCase())));
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
    return Object.entries(walletMap).map(([name, v]) => ({ name, balance: v.income - v.expense, income: v.income, expense: v.expense })).sort((a, b) => b.balance - a.balance);
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
    return Object.entries(personMap).map(([name, v]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), net: v.given - v.received })).filter(x => x.net !== 0).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [transactions]);

  const heatmapData = useMemo(() => {
    const now = new Date(); const year = now.getFullYear(); const month = now.getMonth(); const daysInMonth = getDaysInMonth(year, month);
    const data = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const expenses = transactions.filter(t => t.type === 'pengeluaran' && t.created_at.startsWith(dateStr)).reduce((sum, t) => sum + Number(t.amount), 0);
      data.push({ date: i, amount: expenses });
    }
    return data;
  }, [transactions]);

  const userLevel = useMemo(() => {
    const nw = stats.globalNetWorth;
    if (nw >= 50000000) return { title: 'Sultan', icon: '👑', color: 'bg-[#FDE68A] text-[#B45309] border-[#B45309]' };
    if (nw >= 10000000) return { title: 'Master Hemat', icon: '💎', color: 'bg-[#BAE6FD] text-[#0284C7] border-[#0284C7]' };
    if (nw >= 2000000) return { title: 'Prajurit', icon: '🛡️', color: 'bg-[#A7F3D0] text-[#047857] border-[#047857]' };
    return { title: 'Pemula', icon: '🌱', color: 'bg-white text-[#0B3E3A] border-[#0B3E3A]' };
  }, [stats.globalNetWorth]);

  const gamification = useMemo(() => {
    let streak = 0; const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(now.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const hasExpense = transactions.some(t => t.type === 'pengeluaran' && t.created_at.startsWith(dateStr));
      if (!hasExpense) streak++; else break;
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

  const buildPDFDoc = async () => {
    const doc = new jsPDF();
    const periodText = filterMode === 'month' ? (filterMonth === 'all' ? 'Semua Waktu' : parseMonthSafe(filterMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })) : `${customStartDate} s/d ${customEndDate}`;

    // ── HEADER KOMIK ──────────────────────────────
    // Background header kuning (tema kartun)
    doc.setFillColor(253, 230, 138); // #FDE68A
    doc.rect(0, 0, 210, 50, 'F');
    // Border bawah header
    doc.setDrawColor(11, 62, 58);
    doc.setLineWidth(2);
    doc.line(0, 50, 210, 50);

    // ── LOGO DI HEADER ────────────────────────────
    try {
      const resp = await fetch('/logo.png');
      const blob = await resp.blob();
      const logoB64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(165, 8, 34, 34, 4, 4, 'F');
      doc.setDrawColor(11, 62, 58);
      doc.setLineWidth(1.5);
      doc.roundedRect(165, 8, 34, 34, 4, 4, 'S');
      // Shadow Logo
      doc.setDrawColor(11, 62, 58);
      doc.setLineWidth(0.5);
      doc.roundedRect(167, 10, 34, 34, 4, 4, 'S');
      doc.addImage(logoB64, 'PNG', 167, 10, 30, 30);
    } catch { /* skip */ }

    // Judul
    doc.setTextColor(11, 62, 58);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN KEUANGAN', 14, 24);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dicetak pada : ${new Date().toLocaleDateString('id-ID')} • Oleh: Dompet Digital`, 14, 34);
    doc.text(`Periode      : ${periodText}`, 14, 42);

    // ── BOX KEKAYAAN BERSIH ───────────────────────
    const summaryY = 60;
    doc.setFillColor(167, 243, 208); // Hijau terang
    doc.roundedRect(14, summaryY, 182, 36, 4, 4, 'F');
    doc.setDrawColor(11, 62, 58);
    doc.setLineWidth(1.5);
    doc.roundedRect(14, summaryY, 182, 36, 4, 4, 'S');
    // Shadow box
    doc.setDrawColor(11, 62, 58);
    doc.setLineWidth(0.5);
    doc.roundedRect(16, summaryY + 2, 182, 36, 4, 4, 'S');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 62, 58);
    doc.text('TOTAL KEKAYAAN BERSIH', 20, summaryY + 12);
    
    doc.setFontSize(22);
    doc.setTextColor(stats.netWorth >= 0 ? 11 : 244, stats.netWorth >= 0 ? 62 : 63, stats.netWorth >= 0 ? 58 : 94);
    doc.text(formatIDR(stats.netWorth), 20, summaryY + 26);

    // Info Samping
    doc.setFontSize(10);
    doc.setTextColor(11, 62, 58);
    doc.text('Pemasukan', 110, summaryY + 14);
    doc.text('Pengeluaran', 110, summaryY + 22);
    doc.text('Aset / Investasi', 110, summaryY + 30);
    
    // Titik dua
    doc.text(':', 138, summaryY + 14);
    doc.text(':', 138, summaryY + 22);
    doc.text(':', 138, summaryY + 30);
    
    // Angka rata kanan
    doc.setFont('helvetica', 'bold');
    doc.text(formatIDR(stats.income), 185, summaryY + 14, { align: 'right' });
    doc.text(formatIDR(stats.expense), 185, summaryY + 22, { align: 'right' });
    doc.text(formatIDR(stats.totalAssets), 185, summaryY + 30, { align: 'right' });

    // ── TABEL TRANSAKSI ───────────────────────────
    autoTable(doc, {
      startY: summaryY + 46,
      head: [['Tanggal', 'Keterangan', 'Kategori', 'Sumber', 'Tipe', 'Jumlah (Rp)']],
      body: filteredTransactions.map(t => [
        new Date(t.created_at).toLocaleDateString('id-ID'),
        t.title.length > 25 ? t.title.substring(0, 25) + '...' : t.title, 
        t.category,
        t.wallet || 'Tunai', 
        t.type === 'pemasukan' ? 'Masuk' : 'Keluar',
        new Intl.NumberFormat('id-ID').format(Number(t.amount))
      ]),
      theme: 'grid',
      styles: { 
        cellPadding: 5, 
        fontSize: 10, 
        textColor: [11, 62, 58], 
        lineColor: [11, 62, 58], 
        lineWidth: 0.5,
        font: 'helvetica'
      },
      headStyles: { 
        fillColor: [253, 230, 138], // Kuning kartun
        textColor: [11, 62, 58], 
        fontStyle: 'bold', 
        fontSize: 11, 
        halign: 'center',
        lineWidth: 1
      },
      columnStyles: { 
        0: { cellWidth: 25 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 28 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 35, halign: 'right', fontStyle: 'bold' } 
      },
      alternateRowStyles: { fillColor: [253, 251, 247] },
      didParseCell: (data: any) => {
        // Beri warna hijau/merah pada teks Tipe & Jumlah
        if (data.section === 'body') {
          const typeVal = data.row.raw[4];
          if (data.column.index === 4 || data.column.index === 5) {
            data.cell.styles.textColor = typeVal === 'Masuk' ? [16, 185, 129] : [244, 63, 94];
          }
        }
      }
    });

    // ── FOOTER ───────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(11, 62, 58);
      doc.setFont('helvetica', 'normal');
      doc.text(`Dompet Digital  •  Halaman ${i} dari ${pageCount}`, 14, 290);
      doc.text('mydompetdigital.my.id', 150, 290);
    }
    return doc;
  };

  const exportPDF = async () => {
    const doc = await buildPDFDoc();
    const filename = `Laporan_Keuangan_${Date.now()}.pdf`;
    doc.save(filename);
    showToast('PDF berhasil diunduh! 🎉', 'success');
  };

  const exportPDFEmail = async () => {
    if (!session?.user?.email) return;
    setIsSendingPDFEmail(true);
    showToast('Mempersiapkan PDF...', 'info');
    try {
      const doc = await buildPDFDoc();
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const filename = `Laporan_Keuangan_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`;
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          type: 'report',
          attachmentBase64: pdfBase64,
          filename
        })
      });
      if (res.ok) showToast('PDF berhasil dikirim ke email! 📧', 'success');
      else showToast('Gagal kirim email PDF.', 'error');
    } catch {
      showToast('Terjadi kesalahan.', 'error');
    }
    setIsSendingPDFEmail(false);
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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen text-[95%] bg-[#FDFBF7] dark:bg-[#062623] flex flex-col items-center justify-center transition-colors duration-300 font-sans">
        <div className="w-24 h-24 rounded-2xl bg-[#FDE68A] border-[4px] border-[#0B3E3A] flex items-center justify-center shadow-[8px_8px_0_0_#0B3E3A] animate-bounce mb-6">
          <Wallet size={40} className="text-[#0B3E3A]" />
        </div>
        <p className="text-[#0B3E3A] dark:text-white font-black text-xl">Menyiapkan Dompet...</p>
      </div>
    );
  }

  if (!session) return null;

  const NAV_ITEMS = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutGrid },
    { id: 'transactions' as const, label: 'Transaksi', icon: ArrowUpDown },
    { id: 'analytics' as const, label: 'Analitik', icon: PieIcon },
    { id: 'wallets' as const, label: 'Dompet', icon: CreditCard },
    { id: 'bills' as const, label: 'Tagihan', icon: Bell },
  ];

  return (
    <div className="min-h-screen text-[95%] bg-[#FDFBF7] dark:bg-[#062623] text-[#0B3E3A] dark:text-white font-sans antialiased transition-colors duration-500">

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog open={!!confirmState} title={confirmState?.title || ''} message={confirmState?.message || ''} danger={confirmState?.danger} onConfirm={() => handleConfirmResult(true)} onCancel={() => handleConfirmResult(false)} />

      {/* ═══ DESKTOP SIDEBAR (COMIC STYLE) ═══ */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] bg-white dark:bg-[#0B3E3A] border-r-[4px] border-[#0B3E3A] dark:border-white z-50 p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-white border-[3px] border-[#0B3E3A] dark:border-white rounded-2xl shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] -rotate-3 flex items-center justify-center p-1 overflow-hidden shrink-0">
            <img src="/logo.png" alt="Dompet Digital" className="w-full h-full object-contain" />
          </div>
          <span className="text-2xl font-black tracking-tight" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Dompet<span className="text-[#10B981]">.</span></span>
        </div>

        {/* Profile */}
        <div className="bg-[#FDE68A] dark:bg-[#062623] rounded-2xl p-4 mb-8 border-[3px] border-[#0B3E3A] dark:border-white shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white dark:bg-[#0B3E3A] border-[3px] border-[#0B3E3A] dark:border-white rounded-full flex items-center justify-center text-[#0B3E3A] dark:text-white font-black text-lg shrink-0">
              {displayUsername.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm truncate">{displayUsername}</p>
              <p className="text-[10px] font-bold opacity-80 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg border-[2px] ${userLevel.color}`}>{userLevel.icon} {userLevel.title}</span>
            {gamification.streak >= 3 && <div className="text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 bg-[#FDE68A] text-[#D97706] border-[2px] border-[#D97706]"><Zap size={10} /> {gamification.streak}d</div>}
            {gamification.isIronSaver && <div className="text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 bg-[#10B981] text-white border-[2px] border-[#0B3E3A]"><ShieldAlert size={10} /> Iron Saver</div>}
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-[#F43F5E] text-[#F43F5E] dark:text-white border-[3px] border-[#0B3E3A] dark:border-white hover:translate-x-[2px] hover:translate-y-[2px] shadow-[3px_3px_0_0_#0B3E3A] dark:shadow-[3px_3px_0_0_#FFFFFF] hover:shadow-none transition-all font-black text-xs">
            <LogOut size={14} /> Keluar
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-3">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-black transition-all duration-200 border-[3px] ${activeView === item.id ? 'bg-[#10B981] border-[#0B3E3A] dark:border-white text-[#0B3E3A] dark:text-white shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] translate-x-[-2px] translate-y-[-2px]' : 'bg-transparent border-transparent hover:border-[#0B3E3A] dark:hover:border-white hover:bg-[#BAE6FD] dark:hover:bg-[#062623]'}`}>
              <item.icon size={20} strokeWidth={2.5} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="space-y-3 pt-6 mt-4 border-t-[4px] border-[#0B3E3A] dark:border-white">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black hover:bg-[#FDE68A] dark:hover:bg-[#10B981] border-[3px] border-transparent hover:border-[#0B3E3A] dark:hover:border-white transition-all">
            {isDarkMode ? <Sun size={20} strokeWidth={2.5} className="text-[#FDE68A]" /> : <Moon size={20} strokeWidth={2.5} />}
            {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
          </button>
          <button onClick={() => setIsEditingSettings(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black hover:bg-[#BAE6FD] dark:hover:bg-[#062623] border-[3px] border-transparent hover:border-[#0B3E3A] dark:hover:border-white transition-all">
            <Settings size={20} strokeWidth={2.5} /> Pengaturan
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="lg:ml-[260px] min-h-screen pb-28 lg:pb-0">

        {/* Mobile Header (COMIC STYLE) */}
        <header className="lg:hidden sticky top-0 z-40 bg-[#FDFBF7] dark:bg-[#062623] border-b-[4px] border-[#0B3E3A] dark:border-white px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white border-[3px] border-[#0B3E3A] dark:border-white rounded-xl shadow-[3px_3px_0_0_#0B3E3A] dark:shadow-[3px_3px_0_0_#FFFFFF] flex items-center justify-center p-1 overflow-hidden shrink-0">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide opacity-70">Welcome back,</p>
                <p className="text-sm font-black leading-tight">{displayUsername}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Tombol Tema */}
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0B3E3A] border-[3px] border-[#0B3E3A] dark:border-white rounded-xl shadow-[3px_3px_0_0_#0B3E3A] dark:shadow-[3px_3px_0_0_#FFFFFF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                {isDarkMode ? <Sun size={18} strokeWidth={2.5} className="text-[#FDE68A]" /> : <Moon size={18} strokeWidth={2.5} className="text-[#0B3E3A] dark:text-white" />}
              </button>
              {/* Tombol Privasi */}
              <button onClick={togglePrivacy} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#0B3E3A] border-[3px] border-[#0B3E3A] dark:border-white rounded-xl shadow-[3px_3px_0_0_#0B3E3A] dark:shadow-[3px_3px_0_0_#FFFFFF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                {showBalance ? <Eye size={18} strokeWidth={2.5} /> : <EyeOff size={18} strokeWidth={2.5} />}
              </button>
              {/* Tombol Pengaturan */}
              <button onClick={() => setIsEditingSettings(true)} className="w-10 h-10 flex items-center justify-center bg-[#BAE6FD] dark:bg-[#064E3B] border-[3px] border-[#0B3E3A] dark:border-white rounded-xl shadow-[3px_3px_0_0_#0B3E3A] dark:shadow-[3px_3px_0_0_#FFFFFF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                <Settings size={18} strokeWidth={2.5} className="text-[#0B3E3A] dark:text-white" />
              </button>
            </div>
          </div>
        </header>

        {/* Desktop Top Bar (COMIC STYLE) */}
        <header className="hidden lg:flex items-center justify-between px-8 py-6 border-b-[4px] border-[#0B3E3A] dark:border-white bg-[#FDFBF7] dark:bg-[#062623] sticky top-0 z-40">
          <h1 className="text-2xl font-black tracking-tight uppercase" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            {activeView === 'dashboard' ? 'Overview' : activeView === 'transactions' ? 'Transaksi' : activeView === 'analytics' ? 'Analitik' : activeView === 'wallets' ? 'Dompet' : activeView === 'bills' ? 'Tagihan' : 'Pengaturan'}
          </h1>
          <div className="flex items-center gap-4">
            {/* Filters */}
            <div className="flex items-center bg-white dark:bg-[#0B3E3A] p-1.5 rounded-xl border-[3px] border-[#0B3E3A] dark:border-white shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF]">
              <button onClick={() => setFilterMode('month')} className={`px-4 py-2 text-xs font-black rounded-lg transition-all border-2 ${filterMode === 'month' ? 'bg-[#FDE68A] border-[#0B3E3A] text-[#0B3E3A]' : 'border-transparent opacity-70 hover:opacity-100'}`}>Bulan</button>
              <button onClick={() => setFilterMode('custom')} className={`px-4 py-2 text-xs font-black rounded-lg transition-all border-2 ${filterMode === 'custom' ? 'bg-[#FDE68A] border-[#0B3E3A] text-[#0B3E3A]' : 'border-transparent opacity-70 hover:opacity-100'}`}>Rentang</button>
            </div>
            {filterMode === 'month' ? (
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-white dark:bg-[#0B3E3A] px-4 py-3 rounded-xl border-[3px] border-[#0B3E3A] dark:border-white text-xs font-black outline-none shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] cursor-pointer">
                <option value="all">Semua Waktu</option>
                {availableMonths.map(m => <option key={m} value={m}>{parseMonthSafe(m).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</option>)}
              </select>
            ) : (
              <div className="flex items-center bg-white dark:bg-[#0B3E3A] border-[3px] border-[#0B3E3A] dark:border-white px-4 py-2 rounded-xl gap-2 shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF]">
                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-transparent outline-none text-xs font-black w-[110px]" />
                <span className="font-black">—</span>
                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-transparent outline-none text-xs font-black w-[110px]" />
              </div>
            )}
            <button onClick={togglePrivacy} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-[#0B3E3A] border-[3px] border-[#0B3E3A] dark:border-white rounded-xl shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
              {showBalance ? <Eye size={20} strokeWidth={2.5} /> : <EyeOff size={20} strokeWidth={2.5} />}
            </button>
          </div>
        </header>

        {/* ═══ CONTENT AREA ═══ */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

          {/* Mobile Filter Row */}
          <div className="lg:hidden flex flex-wrap items-center gap-3 mb-6">
            <div className="flex w-full items-center bg-white dark:bg-[#0B3E3A] p-1.5 rounded-xl border-[3px] border-[#0B3E3A] dark:border-white shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF]">
              <button onClick={() => setFilterMode('month')} className={`flex-1 px-4 py-2 text-xs font-black rounded-lg transition-all border-2 ${filterMode === 'month' ? 'bg-[#FDE68A] border-[#0B3E3A] text-[#0B3E3A]' : 'border-transparent opacity-70'}`}>Bulan</button>
              <button onClick={() => setFilterMode('custom')} className={`flex-1 px-4 py-2 text-xs font-black rounded-lg transition-all border-2 ${filterMode === 'custom' ? 'bg-[#FDE68A] border-[#0B3E3A] text-[#0B3E3A]' : 'border-transparent opacity-70'}`}>Rentang</button>
            </div>
            {filterMode === 'month' ? (
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full bg-white dark:bg-[#0B3E3A] px-4 py-3 rounded-xl border-[3px] border-[#0B3E3A] dark:border-white text-xs font-black outline-none shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] cursor-pointer">
                <option value="all">Semua Waktu</option>
                {availableMonths.map(m => <option key={m} value={m}>{parseMonthSafe(m).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</option>)}
              </select>
            ) : (
              <div className="flex w-full items-center justify-between bg-white dark:bg-[#0B3E3A] border-[3px] border-[#0B3E3A] dark:border-white px-4 py-2 rounded-xl gap-2 shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF]">
                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-transparent outline-none text-xs font-black w-full" />
                <span className="font-black px-2">—</span>
                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-transparent outline-none text-xs font-black w-full" />
              </div>
            )}
          </div>

          {/* ── VIEW: DASHBOARD ── */}
          {(activeView === 'dashboard' || !activeView) && <>
            {/* OVERVIEW CARDS (COMIC STYLE) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {/* Net Worth */}
              <div className="sm:col-span-2 lg:col-span-1 bg-[#BAE6FD] dark:bg-[#0B3E3A] p-6 rounded-2xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] relative overflow-hidden hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black uppercase tracking-widest text-[#0B3E3A] dark:text-white">Kekayaan</p>
                  <button onClick={togglePrivacy} className="text-[#0B3E3A] dark:text-white opacity-50 hover:opacity-100"><Eye size={16} strokeWidth={3} /></button>
                </div>
                <p className="text-3xl font-black tracking-tight mb-2 truncate text-[#0B3E3A] dark:text-white">{displayMoney(stats.netWorth)}</p>
                <div className="flex items-center gap-1.5 text-xs font-black px-2 py-1 bg-white/50 dark:bg-black/20 rounded-lg inline-flex border-2 border-[#0B3E3A] dark:border-white">
                  {stats.netWorth >= 0 ? <><TrendingUp size={12} strokeWidth={3} /> Sehat</> : <><TrendingDown size={12} strokeWidth={3} /> Defisit</>}
                </div>
              </div>

              {/* Saldo */}
              <div className="bg-[#A7F3D0] dark:bg-[#062623] p-6 rounded-2xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] hover:-translate-y-1 transition-transform">
                <div className="w-10 h-10 bg-white dark:bg-[#0B3E3A] border-[3px] border-[#0B3E3A] dark:border-white rounded-full flex items-center justify-center mb-4">
                  <Wallet size={18} strokeWidth={2.5} className="text-[#0B3E3A] dark:text-white" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Saldo Kas</p>
                <p className="text-2xl font-black truncate">{displayMoney(stats.balance)}</p>
              </div>

              {/* Pemasukan */}
              <div className="bg-[#FDE68A] dark:bg-[#062623] p-6 rounded-2xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] hover:-translate-y-1 transition-transform">
                <div className="w-10 h-10 bg-white dark:bg-[#0B3E3A] border-[3px] border-[#0B3E3A] dark:border-white rounded-full flex items-center justify-center mb-4">
                  <ArrowUpRight size={18} strokeWidth={2.5} className="text-[#0B3E3A] dark:text-white" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Pemasukan</p>
                <p className="text-2xl font-black truncate">{displayMoney(stats.income)}</p>
              </div>

              {/* Pengeluaran */}
              <div className="bg-[#FECDD3] dark:bg-[#062623] p-6 rounded-2xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] hover:-translate-y-1 transition-transform">
                <div className="w-10 h-10 bg-white dark:bg-[#0B3E3A] border-[3px] border-[#0B3E3A] dark:border-white rounded-full flex items-center justify-center mb-4">
                  <ArrowDownRight size={18} strokeWidth={2.5} className="text-[#0B3E3A] dark:text-white" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Pengeluaran</p>
                <p className="text-2xl font-black truncate">{displayMoney(stats.expense)}</p>
              </div>
            </div>

            {/* TARGET & AI ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Progress Bar Comic Style */}
              <div className="lg:col-span-2 bg-white dark:bg-[#0B3E3A] p-6 rounded-2xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-lg flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#FDE68A] border-2 border-[#0B3E3A] rounded-xl flex items-center justify-center"><Target size={16} strokeWidth={3} className="text-[#0B3E3A]" /></div>
                    Target Impian
                  </h3>
                  <span className="text-sm font-black bg-[#FDE68A] text-[#0B3E3A] px-3 py-1 rounded-xl border-[3px] border-[#0B3E3A]">
                    {Math.min(100, Math.round((stats.netWorth / Number(targetSaving || 1)) * 100))}%
                  </span>
                </div>
                <div className="h-6 w-full bg-slate-100 dark:bg-[#062623] rounded-full border-[3px] border-[#0B3E3A] dark:border-white overflow-hidden mb-3 relative">
                  <div className="h-full bg-[#10B981] border-r-[3px] border-[#0B3E3A] dark:border-white relative"
                    style={{ width: `${Math.max(2, Math.min(100, (stats.netWorth / Number(targetSaving || 1)) * 100))}%` }}>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)' }} />
                  </div>
                </div>
                <div className="flex justify-between text-xs font-black opacity-80">
                  <span>Terkumpul: {displayMoney(stats.netWorth)}</span>
                  <span>Target: {displayMoney(Number(targetSaving))}</span>
                </div>
              </div>

              {/* AI Insight Box Comic Style */}
              <div className="bg-[#BAE6FD] dark:bg-[#062623] border-[4px] border-[#0B3E3A] dark:border-white p-6 rounded-2xl shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] relative overflow-hidden">
                <div className="flex items-center justify-between mb-5 border-b-[3px] border-[#0B3E3A] dark:border-white pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border-[3px] border-[#0B3E3A] dark:border-white flex items-center justify-center shadow-[2px_2px_0_0_#0B3E3A] dark:shadow-[2px_2px_0_0_#FFFFFF] ${aiPersonality === 'roasting' ? 'bg-[#FECDD3]' : 'bg-[#FDE68A]'}`}>
                      {aiPersonality === 'roasting' ? <ShieldAlert size={18} strokeWidth={2.5} className="text-[#0B3E3A] dark:text-white" /> : <Bot size={18} strokeWidth={2.5} className="text-[#0B3E3A] dark:text-white" />}
                    </div>
                    <h2 className="font-black text-lg uppercase">AI {aiPersonality}</h2>
                  </div>
                  <button onClick={toggleAIPersonality} className="bg-white dark:bg-[#0B3E3A] p-2 rounded-xl border-[3px] border-[#0B3E3A] dark:border-white hover:translate-x-[2px] hover:translate-y-[2px] shadow-[2px_2px_0_0_#0B3E3A] dark:shadow-[2px_2px_0_0_#FFFFFF] hover:shadow-none transition-all">
                    <RefreshCw size={14} strokeWidth={3} />
                  </button>
                </div>
                <div className="space-y-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  {smartInsights.map((insight, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border-[3px] border-[#0B3E3A] dark:border-white shadow-[2px_2px_0_0_#0B3E3A] dark:shadow-[2px_2px_0_0_#FFFFFF] bg-white dark:bg-[#0B3E3A]`}>
                      <span className="mt-0.5 shrink-0 text-[#0B3E3A] dark:text-white">{insight.type === 'danger' ? '🚨' : insight.type === 'success' ? '✅' : '💡'}</span>
                      <p className="text-xs font-black leading-relaxed text-[#0B3E3A] dark:text-white">{insight.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick List Transactions */}
            <div className="bg-white dark:bg-[#0B3E3A] border-[4px] border-[#0B3E3A] dark:border-white p-6 rounded-2xl shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] mb-8">
              <div className="flex items-center justify-between mb-6 border-b-[3px] border-[#0B3E3A] dark:border-white pb-3">
                <h3 className="font-black text-xl uppercase">Transaksi Terakhir</h3>
                <button onClick={() => setActiveView('transactions')} className="bg-[#FDE68A] border-[3px] border-[#0B3E3A] px-4 py-2 rounded-xl font-black text-xs shadow-[3px_3px_0_0_#0B3E3A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-[#0B3E3A]">Lihat Semua</button>
              </div>
              <div className="space-y-4">
                {filteredTransactions.slice(0, 5).map(t => {
                  const isIncome = t.type === 'pemasukan';
                  return (
                    <div key={t.id} className="flex items-center justify-between p-3 border-[3px] border-[#0B3E3A] dark:border-white rounded-xl hover:bg-[#F0EEE4] dark:hover:bg-[#062623] cursor-pointer transition-colors" onClick={() => setSelectedReceipt(t)}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl border-[3px] border-[#0B3E3A] dark:border-white flex items-center justify-center shadow-[2px_2px_0_0_#0B3E3A] dark:shadow-[2px_2px_0_0_#FFFFFF] ${isIncome ? 'bg-[#10B981]' : 'bg-[#F43F5E]'}`}>
                          {isIncome ? <ArrowDownLeft size={20} strokeWidth={3} className="text-[#0B3E3A] dark:text-white" /> : <ArrowUpRight size={20} strokeWidth={3} className="text-[#0B3E3A] dark:text-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase mb-1">{t.title}</p>
                          <p className="text-xs font-bold opacity-70">{t.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-black ${isIncome ? 'text-[#10B981]' : 'text-[#F43F5E]'} drop-shadow-[1px_1px_0_rgba(11,62,58,1)] dark:drop-shadow-none`}>
                          {isIncome ? '+' : '-'}{displayMoney(Number(t.amount))}
                        </p>
                        <p className="text-xs font-bold opacity-70 mt-1">{new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>}

          {/* ── VIEW: TRANSACTIONS ── */}
          {activeView === 'transactions' && <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT: FORM & HISTORY */}
              <div className="lg:col-span-2 space-y-6">

                {/* Form Wrapper */}
                <div id="formCatat" className={`bg-white dark:bg-[#0B3E3A] rounded-2xl border-[4px] shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] p-6 transition-all ${editingId ? 'border-[#FDE68A] bg-[#FEF3C7] dark:bg-[#0B3E3A]' : 'border-[#0B3E3A] dark:border-white'}`}>
                  {editingId && <div className="mb-4 inline-block bg-[#FDE68A] text-[#0B3E3A] font-black px-4 py-2 rounded-xl border-[3px] border-[#0B3E3A] shadow-[2px_2px_0_0_#0B3E3A]">✏️ MODE EDIT AKTIF</div>}

                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b-[3px] border-[#0B3E3A] dark:border-white pb-4">
                    <h2 className="text-2xl font-black uppercase">Catat Transaksi</h2>
                    <div className="flex items-center gap-3">
                      <input type="file" accept="image/*" id="scan-receipt" className="hidden" onChange={handleScanReceipt} disabled={isScanning} />
                      <label htmlFor="scan-receipt" className="cursor-pointer flex items-center gap-2 bg-[#BAE6FD] text-[#0B3E3A] px-4 py-2 rounded-xl text-xs font-black border-[3px] border-[#0B3E3A] shadow-[3px_3px_0_0_#0B3E3A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                        {isScanning ? <><Loader2 className="animate-spin inline" size={16} strokeWidth={3} /> BACA AI...</> : <><Camera size={16} strokeWidth={3} /> SCAN STRUK</>}
                      </label>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex bg-[#F0EEE4] dark:bg-[#062623] border-[3px] border-[#0B3E3A] dark:border-white rounded-xl p-1 shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)] dark:shadow-[inset_2px_2px_0_rgba(255,255,255,0.1)]">
                      <button type="button" onClick={() => setFormData({ ...formData, type: 'pengeluaran' })} className={`flex-1 py-3 text-sm font-black rounded-lg transition-all ${formData.type === 'pengeluaran' ? 'bg-[#F43F5E] text-white border-[3px] border-[#0B3E3A] dark:border-white shadow-[2px_2px_0_0_#0B3E3A] dark:shadow-[2px_2px_0_0_#FFFFFF]' : 'text-[#0B3E3A] dark:text-white opacity-60'}`}>PENGELUARAN</button>
                      <button type="button" onClick={() => setFormData({ ...formData, type: 'pemasukan' })} className={`flex-1 py-3 text-sm font-black rounded-lg transition-all ${formData.type === 'pemasukan' ? 'bg-[#10B981] text-white border-[3px] border-[#0B3E3A] dark:border-white shadow-[2px_2px_0_0_#0B3E3A] dark:shadow-[2px_2px_0_0_#FFFFFF]' : 'text-[#0B3E3A] dark:text-white opacity-60'}`}>PEMASUKAN</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormInput label="Deskripsi" icon={<Edit2 size={18} strokeWidth={3} />} type="text" placeholder="Beli Kopi..." value={formData.title} onChange={(v: string) => setFormData({ ...formData, title: v })} />
                      <FormInput label="Nominal" icon={<span className="font-black text-sm">Rp</span>} type="number" placeholder="50000" value={formData.amount} onChange={(v: string) => setFormData({ ...formData, amount: v })} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <SelectInput label="Kategori" value={formData.category} onChange={(v: string) => setFormData({ ...formData, category: v })} options={formData.type === 'pengeluaran' ? ['Makanan', 'Transportasi', 'Tagihan', 'Belanja', 'Hiburan', 'Investasi', 'Beri Hutang', 'Bayar Pinjaman', 'Lainnya'] : ['Gaji Pokok', 'Bonus', 'Investasi', 'Terima Pinjaman', 'Dibayar Hutang', 'Lainnya']} />
                      <SelectInput label="Sumber Dana" value={formData.wallet} onChange={(v: string) => setFormData({ ...formData, wallet: v })} options={WALLET_OPTIONS} />
                    </div>

                    {/* ── FIELD NAMA ORANG (HUTANG/PINJAMAN) ── */}
                    {['Beri Hutang', 'Bayar Pinjaman', 'Terima Pinjaman', 'Dibayar Hutang'].includes(formData.category) && (
                      <div className="p-4 bg-[#FDE68A] border-[3px] border-[#0B3E3A] dark:border-white rounded-xl shadow-[3px_3px_0_0_#0B3E3A] dark:shadow-[3px_3px_0_0_#FFFFFF]">
                        <p className="text-xs font-black text-[#0B3E3A] uppercase tracking-wide mb-2 flex items-center gap-2"><Users size={14} strokeWidth={3} /> Nama Orang (Wajib untuk Hutang!)</p>
                        <FormInput label="" icon={<Users size={18} strokeWidth={3} />} type="text" placeholder="Nama teman/saudara..." value={formData.person_name} onChange={(v: string) => setFormData({ ...formData, person_name: v })} />
                      </div>
                    )}

                    {/* ── TOMBOL GPS ── */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 mb-2">
                      <button type="button" onClick={() => setUseLocation(!useLocation)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-[3px] border-[#0B3E3A] dark:border-white font-black text-xs transition-all shadow-[2px_2px_0_0_#0B3E3A] dark:shadow-[2px_2px_0_0_#FFFFFF] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${useLocation ? 'bg-[#10B981] text-white' : 'bg-white dark:bg-[#1A1A1A] text-[#0B3E3A] dark:text-white'}`}>
                        <MapPin size={16} strokeWidth={3} />
                        {useLocation ? 'LOKASI AKTIF ✅' : 'CATAT LOKASI GPS'}
                      </button>
                      <p className="text-[10px] font-bold opacity-60 italic text-[#0B3E3A] dark:text-white">
                        *Pastikan izin lokasi browser aktif
                      </p>
                    </div>

                    <div className="flex gap-4 pt-4 border-t-[3px] border-[#0B3E3A] dark:border-white">
                      <button disabled={isSubmitting} className="flex-1 bg-[#FDE68A] text-[#0B3E3A] font-black py-4 rounded-xl border-[4px] border-[#0B3E3A] shadow-[4px_4px_0_0_#0B3E3A] hover:bg-[#FCD34D] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all uppercase flex justify-center items-center gap-2">
                        {isSubmitting ? <><Loader2 className="animate-spin" size={20} strokeWidth={3} /> PROSES</> : <><Check size={20} strokeWidth={3} /> {editingId ? 'UPDATE' : 'SIMPAN'}</>}
                      </button>
                      {editingId && <button type="button" onClick={handleCancelEdit} className="px-6 bg-white dark:bg-[#2A2A2A] text-[#0B3E3A] dark:text-white font-black rounded-xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none transition-all uppercase">BATAL</button>}
                    </div>
                  </form>
                </div>

                {/* History List */}
                <div className="bg-white dark:bg-[#0B3E3A] rounded-2xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] overflow-hidden">
                  <div className="p-5 border-b-[3px] border-[#0B3E3A] dark:border-white bg-[#FDE68A] dark:bg-[#062623]">
                    <h3 className="font-black text-xl uppercase mb-4 text-[#0B3E3A] dark:text-white">Riwayat Keuangan</h3>
                    <div className="flex gap-3">
                      <div className="flex-1 flex items-center bg-white dark:bg-[#1A1A1A] border-[3px] border-[#0B3E3A] dark:border-white rounded-xl px-3 shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)] dark:shadow-[inset_2px_2px_0_rgba(255,255,255,0.1)]">
                        <Search size={18} strokeWidth={3} className="text-[#0B3E3A] dark:text-white opacity-50" />
                        <input type="text" placeholder="Cari..." className="w-full bg-transparent outline-none p-3 font-bold text-sm text-[#0B3E3A] dark:text-white placeholder:text-[#0B3E3A]/40 dark:placeholder:text-white/40" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 max-h-[600px] overflow-y-auto space-y-4 custom-scrollbar">
                    {filteredTransactions.map((t) => {
                      const isIncome = t.type === 'pemasukan';
                      return (
                        <div key={t.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 border-[3px] border-[#0B3E3A] dark:border-white rounded-xl bg-white dark:bg-[#0B3E3A] hover:translate-x-[2px] hover:translate-y-[2px] shadow-[3px_3px_0_0_#0B3E3A] dark:shadow-[3px_3px_0_0_#FFFFFF] hover:shadow-none transition-all gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl border-[3px] border-[#0B3E3A] dark:border-white flex items-center justify-center shrink-0 ${isIncome ? 'bg-[#10B981]' : 'bg-[#F43F5E]'}`}>
                              {isIncome ? <ArrowDownLeft size={20} strokeWidth={3} className="text-[#0B3E3A] dark:text-white" /> : <ArrowUpRight size={20} strokeWidth={3} className="text-[#0B3E3A] dark:text-white" />}
                            </div>
                            <div>
                              <p className="font-black uppercase text-sm sm:text-base">{t.title}</p>
                              <div className="flex gap-2 mt-1">
                                <span className="text-[10px] font-black bg-[#BAE6FD] text-[#0B3E3A] border-2 border-[#0B3E3A] px-2 py-0.5 rounded-md">{t.category}</span>
                                <span className="text-[10px] font-black bg-[#FDE68A] text-[#0B3E3A] border-2 border-[#0B3E3A] px-2 py-0.5 rounded-md">{t.wallet}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 w-full sm:w-auto">
                            <p className={`font-black text-lg ${isIncome ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                              {isIncome ? '+' : '-'}{displayMoney(Number(t.amount))}
                            </p>
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedReceipt(t)} className="w-8 h-8 flex items-center justify-center bg-[#BAE6FD] border-2 border-[#0B3E3A] rounded-lg shadow-[2px_2px_0_0_#0B3E3A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"><Receipt size={14} className="text-[#0B3E3A]" strokeWidth={3} /></button>
                              <button onClick={() => handleEditClick(t)} className="w-8 h-8 flex items-center justify-center bg-[#FDE68A] border-2 border-[#0B3E3A] rounded-lg shadow-[2px_2px_0_0_#0B3E3A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"><Edit2 size={14} className="text-[#0B3E3A]" strokeWidth={3} /></button>
                              <button onClick={() => handleDeleteTransaction(t.id)} className="w-8 h-8 flex items-center justify-center bg-[#FECDD3] border-2 border-[#0B3E3A] rounded-lg shadow-[2px_2px_0_0_#0B3E3A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"><Trash2 size={14} className="text-[#0B3E3A]" strokeWidth={3} /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT: CHART & WALLET (COMIC STYLE) */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#0B3E3A] rounded-2xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] p-6">
                  <h3 className="font-black text-lg uppercase border-b-[3px] border-[#0B3E3A] dark:border-white pb-3 mb-4">Statistik Kas</h3>
                  <div className="space-y-3">
                    {walletBreakdown.map(w => (
                      <div key={w.name} className="flex justify-between items-center p-3 border-[3px] border-[#0B3E3A] dark:border-white rounded-xl bg-[#FDFBF7] dark:bg-[#062623]">
                        <span className="font-black text-sm uppercase">{w.name}</span>
                        <span className={`font-black text-sm ${w.balance >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>{displayMoney(w.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0B3E3A] rounded-2xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] p-6">
                  <h3 className="font-black text-lg uppercase border-b-[3px] border-[#0B3E3A] dark:border-white pb-3 mb-4">Pie Chart</h3>
                  <div className="h-48 w-full relative">
                    {categoryChartData.length === 0 ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50"><PieIcon size={32} strokeWidth={2} /><p className="font-black mt-2">KOSONG</p></div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryChartData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="#0B3E3A" strokeWidth={3}>
                            {categoryChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(value: any) => formatIDR(Number(value))} contentStyle={{ backgroundColor: '#fff', border: '3px solid #0B3E3A', borderRadius: '12px', color: '#0B3E3A', fontSize: '12px', fontWeight: '900', boxShadow: '4px 4px 0 0 #0B3E3A' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>}

          {/* ── VIEW: ANALYTICS ── */}
          {activeView === 'analytics' && <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* AI Insights */}
              <div className="bg-[#BAE6FD] dark:bg-[#062623] border-[4px] border-[#0B3E3A] dark:border-white p-6 rounded-2xl shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] relative overflow-hidden">
                <div className="flex items-center justify-between mb-5 border-b-[3px] border-[#0B3E3A] dark:border-white pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border-[3px] border-[#0B3E3A] dark:border-white flex items-center justify-center shadow-[2px_2px_0_0_#0B3E3A] dark:shadow-[2px_2px_0_0_#FFFFFF] ${aiPersonality === 'roasting' ? 'bg-[#FECDD3]' : 'bg-[#FDE68A]'}`}>
                      {aiPersonality === 'roasting' ? <ShieldAlert size={18} strokeWidth={2.5} className="text-[#0B3E3A] dark:text-white" /> : <Bot size={18} strokeWidth={2.5} className="text-[#0B3E3A] dark:text-white" />}
                    </div>
                    <h2 className="font-black text-lg uppercase">AI {aiPersonality}</h2>
                  </div>
                  <button onClick={toggleAIPersonality} className="bg-white dark:bg-[#0B3E3A] p-2 rounded-xl border-[3px] border-[#0B3E3A] dark:border-white hover:translate-x-[2px] hover:translate-y-[2px] shadow-[2px_2px_0_0_#0B3E3A] dark:shadow-[2px_2px_0_0_#FFFFFF] hover:shadow-none transition-all">
                    <RefreshCw size={14} strokeWidth={3} />
                  </button>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {smartInsights.map((insight, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border-[3px] border-[#0B3E3A] dark:border-white shadow-[2px_2px_0_0_#0B3E3A] dark:shadow-[2px_2px_0_0_#FFFFFF] bg-white dark:bg-[#0B3E3A]`}>
                      <span className="mt-0.5 shrink-0 text-[#0B3E3A] dark:text-white">{insight.type === 'danger' ? '🚨' : insight.type === 'success' ? '✅' : '💡'}</span>
                      <p className="text-xs font-black leading-relaxed text-[#0B3E3A] dark:text-white">{insight.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white dark:bg-[#0B3E3A] border-[4px] border-[#0B3E3A] dark:border-white p-6 rounded-2xl shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF]">
                <h3 className="font-black text-lg uppercase border-b-[3px] border-[#0B3E3A] dark:border-white pb-3 mb-4"><Tag size={20} className="inline mr-2" strokeWidth={3} /> Alokasi Konsumsi</h3>
                <div className="h-48 w-full relative mb-6">
                  {categoryChartData.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50"><PieIcon size={32} strokeWidth={2} /><p className="font-black mt-2">KOSONG</p></div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryChartData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="#0B3E3A" strokeWidth={3}>
                          {categoryChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatIDR(Number(value))} contentStyle={{ backgroundColor: '#fff', border: '3px solid #0B3E3A', borderRadius: '12px', color: '#0B3E3A', fontSize: '12px', fontWeight: '900', boxShadow: '4px 4px 0 0 #0B3E3A' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="space-y-3">
                  {categoryChartData.map((item: any, idx) => {
                    const total = categoryChartData.reduce((a, c) => a + c.value, 0);
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 border-[3px] border-[#0B3E3A] dark:border-white rounded-xl bg-[#FDFBF7] dark:bg-[#062623]">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-[#0B3E3A] dark:border-white rounded-md" style={{ backgroundColor: item.color }} />
                          <span className="font-black uppercase">{item.name}</span>
                          <span className="font-bold opacity-60 ml-2">{pct}%</span>
                        </div>
                        <span className="font-black">{displayMoney(item.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Budget Section */}
            <div className="bg-white dark:bg-[#0B3E3A] border-[4px] border-[#0B3E3A] dark:border-white p-6 rounded-2xl shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] mb-8">
              <div className="flex justify-between items-center mb-6 border-b-[3px] border-[#0B3E3A] dark:border-white pb-3">
                <h3 className="font-black text-lg uppercase"><AlertOctagon size={20} className="inline mr-2 text-[#F43F5E]" strokeWidth={3} /> Batas Anggaran</h3>
                <button onClick={() => setIsEditingSettings(true)} className="bg-[#BAE6FD] text-[#0B3E3A] border-[3px] border-[#0B3E3A] px-4 py-2 rounded-xl font-black text-xs shadow-[3px_3px_0_0_#0B3E3A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all uppercase">Ubah</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.keys(catBudgets).filter(k => Number(catBudgets[k]) > 0).length === 0 ? (
                  <div className="col-span-full p-6 border-[3px] border-dashed border-[#0B3E3A] dark:border-white rounded-2xl text-center opacity-60 font-black">BELUM ADA BATAS ANGGARAN</div>
                ) : (
                  Object.keys(catBudgets).filter(k => Number(catBudgets[k]) > 0).map(cat => {
                    const limit = Number(catBudgets[cat]);
                    const spent = filteredTransactions.filter(t => t.type === 'pengeluaran' && t.category === cat).reduce((acc, curr) => acc + Number(curr.amount), 0);
                    const percent = Math.min(100, Math.round((spent / limit) * 100));
                    const isDanger = spent > limit;
                    return (
                      <div key={cat} className={`p-4 rounded-xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] ${isDanger ? 'bg-[#FECDD3]' : 'bg-[#A7F3D0]'}`}>
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <p className="font-black uppercase text-[#0B3E3A]">{cat}</p>
                            <p className="text-[10px] font-bold text-[#0B3E3A]/70 mt-1">{formatIDR(spent)} / {formatIDR(limit)}</p>
                          </div>
                          <span className="font-black text-xl text-[#0B3E3A]">{percent}%</span>
                        </div>
                        <div className="h-4 w-full bg-white rounded-full border-[3px] border-[#0B3E3A] overflow-hidden">
                          <div className={`h-full border-r-[3px] border-[#0B3E3A] ${isDanger ? 'bg-[#F43F5E]' : 'bg-[#10B981]'}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cashflow Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Saving Rate', val: `${stats.savingsRate}%`, bg: 'bg-[#A7F3D0]' },
                { label: 'Cashflow', val: `${stats.cashflowRatio}%`, bg: 'bg-[#BAE6FD]' },
                { label: 'Total Trans.', val: filteredTransactions.length.toString(), bg: 'bg-[#FDE68A]' },
                { label: 'Rata-rata Keluar', val: filteredTransactions.filter(t => t.type === 'pengeluaran').length > 0 ? formatIDR(stats.expense / filteredTransactions.filter(t => t.type === 'pengeluaran').length) : 'N/A', bg: 'bg-[#FECDD3]' }
              ].map(item => (
                <div key={item.label} className={`${item.bg} border-[4px] border-[#0B3E3A] dark:border-white shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] p-4 rounded-2xl flex flex-col items-center justify-center text-center hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all`}>
                  <span className="text-[10px] font-black uppercase text-[#0B3E3A] mb-1">{item.label}</span>
                  <span className="text-lg font-black text-[#0B3E3A] truncate w-full">{item.val}</span>
                </div>
              ))}
            </div>
          </>}

          {/* ── VIEW: WALLETS ── */}
          {activeView === 'wallets' && <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Saldo Rekening */}
              <div className="bg-white dark:bg-[#0B3E3A] border-[4px] border-[#0B3E3A] dark:border-white p-6 rounded-2xl shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF]">
                <h3 className="font-black text-lg uppercase border-b-[3px] border-[#0B3E3A] dark:border-white pb-3 mb-4"><Landmark size={20} className="inline mr-2" strokeWidth={3} /> Saldo Rekening</h3>
                <div className="space-y-3">
                  {walletBreakdown.length === 0 ? <p className="font-black opacity-50 text-center">KOSONG</p> : walletBreakdown.map(w => (
                    <div key={w.name} className="flex justify-between items-center p-3 border-[3px] border-[#0B3E3A] dark:border-white rounded-xl bg-[#FDFBF7] dark:bg-[#062623] hover:-translate-y-1 transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#BAE6FD] border-2 border-[#0B3E3A] rounded-lg flex items-center justify-center"><Landmark size={14} strokeWidth={3} className="text-[#0B3E3A]" /></div>
                        <span className="font-black text-sm uppercase">{w.name}</span>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-base ${w.balance >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>{displayMoney(w.balance)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hutang Piutang */}
              <div className="bg-white dark:bg-[#0B3E3A] border-[4px] border-[#0B3E3A] dark:border-white p-6 rounded-2xl shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF]">
                <h3 className="font-black text-lg uppercase border-b-[3px] border-[#0B3E3A] dark:border-white pb-3 mb-4"><Briefcase size={20} className="inline mr-2 text-[#D97706]" strokeWidth={3} /> Hutang Piutang</h3>
                <div className="space-y-3">
                  {debtTracker.length === 0 ? <p className="font-black opacity-50 text-center">BERSIH</p> : debtTracker.map(d => (
                    <div key={d.name} className="flex justify-between items-center p-3 border-[3px] border-[#0B3E3A] dark:border-white rounded-xl bg-[#FDFBF7] dark:bg-[#062623] hover:-translate-y-1 transition-transform">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 border-2 border-[#0B3E3A] rounded-lg flex items-center justify-center font-black text-xs ${d.net > 0 ? 'bg-[#A7F3D0] text-[#0B3E3A]' : 'bg-[#FECDD3] text-[#0B3E3A]'}`}>{d.net > 0 ? '↑' : '↓'}</div>
                        <span className="font-black text-sm uppercase">{d.name}</span>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-base ${d.net > 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>{formatIDR(Math.abs(d.net))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Radar Tagihan */}
              <div className="bg-[#FECDD3] dark:bg-[#F43F5E] border-[4px] border-[#0B3E3A] dark:border-white p-6 rounded-2xl shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20"><Bell size={100} strokeWidth={3} className="text-[#0B3E3A]" /></div>
                <h3 className="font-black text-lg uppercase text-[#0B3E3A] dark:text-white border-b-[3px] border-[#0B3E3A] dark:border-white pb-3 mb-4 relative z-10"><CreditCard size={20} className="inline mr-2" strokeWidth={3} /> Radar Tagihan</h3>
                <p className="text-3xl font-black mb-4 relative z-10 text-[#0B3E3A] dark:text-white">{displayMoney(stats.totalBills)}</p>
                <div className="space-y-3 relative z-10">
                  {stats.billsTransactions.length === 0 ? <div className="font-black text-sm bg-white p-3 rounded-xl border-[3px] border-[#0B3E3A] text-center text-[#0B3E3A]">TIDAK ADA TAGIHAN</div> : stats.billsTransactions.slice(0, 3).map((t: any) => (
                    <div key={t.id} className="flex justify-between items-center bg-white p-3 rounded-xl border-[3px] border-[#0B3E3A] text-[#0B3E3A]">
                      <div className="min-w-0 pr-2">
                        <p className="font-black uppercase truncate text-xs">{t.title}</p>
                        <p className="font-bold text-[#F43F5E] text-[10px]">{formatIDR(Number(t.amount))}</p>
                      </div>
                      <button onClick={() => handleQuickPay(t)} className="bg-[#FDE68A] border-2 border-[#0B3E3A] font-black text-[10px] px-3 py-1.5 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] shadow-[2px_2px_0_0_#0B3E3A] hover:shadow-none transition-all uppercase">Bayar</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Kantong Tabungan */}
            <div className="bg-white dark:bg-[#0B3E3A] border-[4px] border-[#0B3E3A] dark:border-white p-6 rounded-2xl shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] mb-8">
              <div className="flex justify-between items-center mb-6 border-b-[3px] border-[#0B3E3A] dark:border-white pb-3">
                <h3 className="font-black text-xl uppercase"><Target size={24} className="inline mr-2 text-[#8B5CF6]" strokeWidth={3} /> Kantong Tabungan</h3>
                <button onClick={() => setShowPocketModal(true)} className="bg-[#BAE6FD] text-[#0B3E3A] border-[3px] border-[#0B3E3A] px-4 py-2 rounded-xl font-black text-xs shadow-[3px_3px_0_0_#0B3E3A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2 uppercase"><Plus size={16} strokeWidth={3} /> Buat</button>
              </div>
              {pockets.length === 0 ? (
                <div className="p-10 border-[4px] border-dashed border-[#0B3E3A] dark:border-white rounded-2xl text-center opacity-60 font-black flex flex-col items-center gap-3">
                  <PiggyBank size={48} strokeWidth={2} />
                  BELUM ADA KANTONG
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {pockets.map(p => {
                    const pct = Math.min(100, Math.round((p.balance / p.target_amount) * 100));
                    return (
                      <div key={p.id} className="p-5 rounded-2xl border-[4px] border-[#0B3E3A] bg-[#DDD6FE] dark:bg-[#4C1D95] shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF]">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl drop-shadow-[2px_2px_0_rgba(11,62,58,1)]">{p.icon}</span>
                            <div>
                              <p className="font-black uppercase text-[#0B3E3A] dark:text-white leading-tight">{p.name}</p>
                              <p className="text-xs font-bold opacity-80 text-[#0B3E3A] dark:text-white mt-1">{pct}% TERCAPAI</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditPocket(p)} className="p-2 bg-white text-[#0B3E3A] border-2 border-[#0B3E3A] rounded-lg shadow-[2px_2px_0_0_#0B3E3A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"><Edit2 size={14} strokeWidth={3} /></button>
                            <button onClick={() => handleDeletePocket(p.id)} className="p-2 bg-white text-[#F43F5E] border-2 border-[#0B3E3A] rounded-lg shadow-[2px_2px_0_0_#0B3E3A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"><Trash2 size={14} strokeWidth={3} /></button>
                          </div>
                        </div>
                        <div className="mb-2 flex justify-between text-[10px] font-black text-[#0B3E3A] dark:text-white uppercase">
                          <span>{formatIDR(p.balance)}</span>
                          <span>{formatIDR(p.target_amount)}</span>
                        </div>
                        <div className="h-4 w-full bg-white rounded-full border-[3px] border-[#0B3E3A] overflow-hidden">
                          <div className="h-full bg-[#10B981] border-r-[3px] border-[#0B3E3A]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Portofolio Investasi */}
            <div className="bg-white dark:bg-[#0B3E3A] border-[4px] border-[#0B3E3A] dark:border-white p-6 rounded-2xl shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] mb-8">
              <div className="flex justify-between items-center mb-6 border-b-[3px] border-[#0B3E3A] dark:border-white pb-3">
                <h3 className="font-black text-xl uppercase"><TrendingUp size={24} className="inline mr-2 text-[#10B981]" strokeWidth={3} /> Investasi</h3>
                <button onClick={() => setShowInvestModal(true)} className="bg-[#A7F3D0] text-[#0B3E3A] border-[3px] border-[#0B3E3A] px-4 py-2 rounded-xl font-black text-xs shadow-[3px_3px_0_0_#0B3E3A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2 uppercase"><Plus size={16} strokeWidth={3} /> Tambah</button>
              </div>
              {investments.length === 0 ? (
                <div className="p-10 border-[4px] border-dashed border-[#0B3E3A] dark:border-white rounded-2xl text-center opacity-60 font-black flex flex-col items-center gap-3">
                  <Gem size={48} strokeWidth={2} />
                  BELUM ADA ASET
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {investments.map(inv => {
                    const profit = inv.current_value - inv.invested_amount;
                    const pct = (profit / inv.invested_amount) * 100;
                    const isUp = profit >= 0;
                    return (
                      <div key={inv.id} className={`p-5 rounded-2xl border-[4px] border-[#0B3E3A] shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] ${isUp ? 'bg-[#A7F3D0] dark:bg-[#064E3B]' : 'bg-[#FECDD3] dark:bg-[#881337]'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 pr-2">
                            <p className="text-[10px] font-black opacity-80 uppercase text-[#0B3E3A] dark:text-white">{inv.asset_type}</p>
                            <p className="font-black text-base text-[#0B3E3A] dark:text-white mt-1 uppercase">{inv.asset_name}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg border-2 border-[#0B3E3A] text-[#0B3E3A] bg-white`}>{isUp ? '+' : ''}{pct.toFixed(1)}%</span>
                            <div className="flex gap-1">
                              <button onClick={() => handleEditInvest(inv)} className="p-1.5 bg-white text-[#0B3E3A] border-2 border-[#0B3E3A] rounded-md shadow-[2px_2px_0_0_#0B3E3A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"><Edit2 size={12} strokeWidth={3} /></button>
                              <button onClick={() => handleDeleteInvest(inv.id)} className="p-1.5 bg-white text-[#F43F5E] border-2 border-[#0B3E3A] rounded-md shadow-[2px_2px_0_0_#0B3E3A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"><Trash2 size={12} strokeWidth={3} /></button>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-end mt-2 pt-3 border-t-[3px] border-[#0B3E3A] dark:border-white text-[#0B3E3A] dark:text-white">
                          <div><p className="text-[10px] font-black uppercase opacity-80 mb-1">Nilai Kini</p><p className="font-black text-lg drop-shadow-[1px_1px_0_rgba(11,62,58,0.5)]">{formatIDR(inv.current_value)}</p></div>
                          <div className="text-right"><p className="text-[10px] font-black uppercase opacity-80 mb-1">Modal</p><p className="font-black text-sm">{formatIDR(inv.invested_amount)}</p></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Export */}
            <div className="bg-white dark:bg-[#0B3E3A] border-[4px] border-[#0B3E3A] dark:border-white p-6 rounded-2xl shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] mb-8">
              <h3 className="font-black text-xl uppercase mb-4 text-[#0B3E3A] dark:text-white border-b-[3px] border-[#0B3E3A] dark:border-white pb-3">🎉 Export Data</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button onClick={exportPDF} className="flex flex-col items-center justify-center gap-2 bg-[#FDE68A] text-[#0B3E3A] font-black py-5 px-3 rounded-xl border-[4px] border-[#0B3E3A] shadow-[4px_4px_0_0_#0B3E3A] hover:bg-[#FCD34D] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none transition-all uppercase text-xs">
                  <FileText size={24} strokeWidth={3} />
                  UNDUH PDF
                </button>
                <button onClick={exportPDFEmail} disabled={isSendingPDFEmail} className="flex flex-col items-center justify-center gap-2 bg-[#DDD6FE] text-[#0B3E3A] font-black py-5 px-3 rounded-xl border-[4px] border-[#0B3E3A] shadow-[4px_4px_0_0_#0B3E3A] hover:bg-[#C4B5FD] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none transition-all uppercase text-xs disabled:opacity-60">
                  {isSendingPDFEmail ? <Loader2 size={24} strokeWidth={3} className="animate-spin" /> : <Mail size={24} strokeWidth={3} />}
                  {isSendingPDFEmail ? 'KIRIM...' : 'EMAIL PDF'}
                </button>
                <button onClick={exportCSV} className="flex flex-col items-center justify-center gap-2 bg-[#A7F3D0] text-[#0B3E3A] font-black py-5 px-3 rounded-xl border-[4px] border-[#0B3E3A] shadow-[4px_4px_0_0_#0B3E3A] hover:bg-[#6EE7B7] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none transition-all uppercase text-xs">
                  <Download size={24} strokeWidth={3} />
                  CSV
                </button>
                <button onClick={exportWA} className="flex flex-col items-center justify-center gap-2 bg-[#BAE6FD] text-[#0B3E3A] font-black py-5 px-3 rounded-xl border-[4px] border-[#0B3E3A] shadow-[4px_4px_0_0_#0B3E3A] hover:bg-[#7DD3FC] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none transition-all uppercase text-xs">
                  <MessageSquare size={24} strokeWidth={3} />
                  WHATSAPP
                </button>
              </div>
            </div>
          </>}

          {/* ── VIEW: BILLS ── */}
          {activeView === 'bills' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white dark:bg-[#0B3E3A] border-[4px] border-[#0B3E3A] dark:border-white p-6 rounded-2xl shadow-[6px_6px_0_0_#0B3E3A] dark:shadow-[6px_6px_0_0_#FFFFFF] mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-[3px] border-[#0B3E3A] dark:border-white pb-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-black uppercase text-[#0B3E3A] dark:text-white"><Bell size={24} className="inline mr-2" strokeWidth={3} /> Tagihan & Reminder</h2>
                    <p className="text-xs font-bold mt-1 text-[#0B3E3A]/70 dark:text-white/70">Notifikasi email otomatis H-3 & H-1</p>
                  </div>
                  <button onClick={() => { setEditingBillId(null); setBillForm({ name: '', amount: '', due_date: '', category: 'Tagihan' }); setShowBillModal(true); }} className="bg-[#10B981] text-white border-[3px] border-[#0B3E3A] dark:border-white px-5 py-3 rounded-xl font-black text-sm shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all uppercase flex items-center gap-2 w-full sm:w-auto justify-center"><Plus size={18} strokeWidth={3} /> Tambah</button>
                </div>

                {bills.length === 0 ? (
                  <div className="p-12 border-[4px] border-dashed border-[#0B3E3A] dark:border-white rounded-2xl text-center opacity-60 font-black flex flex-col items-center gap-4">
                    <Bell size={64} strokeWidth={2} />
                    BELUM ADA TAGIHAN RUTIN
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bills.map((bill: any) => {
                      const today = new Date().getDate();
                      const daysLeft = bill.due_date - today;
                      const isUrgent = daysLeft >= 0 && daysLeft <= 3;
                      const isOverdue = daysLeft < 0;
                      return (
                        <div key={bill.id} className={`flex flex-col sm:flex-row items-center justify-between p-5 border-[4px] border-[#0B3E3A] dark:border-white rounded-2xl shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] gap-4 ${isOverdue ? 'bg-[#FECDD3] dark:bg-[#881337]' : isUrgent ? 'bg-[#FDE68A] dark:bg-[#78350F]' : 'bg-[#FDFBF7] dark:bg-[#062623]'}`}>
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className={`w-14 h-14 rounded-xl border-[3px] border-[#0B3E3A] dark:border-white flex items-center justify-center shrink-0 bg-white dark:bg-[#0B3E3A]`}>
                              <Bell size={24} strokeWidth={3} className={isOverdue ? 'text-[#F43F5E]' : isUrgent ? 'text-[#D97706]' : 'text-[#10B981]'} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="font-black uppercase text-lg text-[#0B3E3A] dark:text-white truncate">{bill.name}</p>
                                {isOverdue && <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#F43F5E] text-white border-2 border-[#0B3E3A]">LEWAT</span>}
                                {isUrgent && !isOverdue && <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#D97706] text-white border-2 border-[#0B3E3A]">SEGERA</span>}
                              </div>
                              <p className="text-sm font-bold text-[#0B3E3A]/80 dark:text-white/80">
                                {formatIDR(bill.amount)} <span className="mx-2">•</span> Tgl {bill.due_date}
                                {daysLeft >= 0 && <span className={`ml-2 font-black ${isUrgent ? 'text-[#D97706]' : 'text-[#0B3E3A] dark:text-white'}`}>({daysLeft === 0 ? 'Hari ini!' : `H-${daysLeft}`})</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <button onClick={() => handleEditBill(bill)} className="p-3 bg-white dark:bg-[#0B3E3A] text-[#0B3E3A] dark:text-white border-[3px] border-[#0B3E3A] dark:border-white rounded-xl shadow-[3px_3px_0_0_#0B3E3A] dark:shadow-[3px_3px_0_0_#FFFFFF] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"><Edit2 size={18} strokeWidth={3} /></button>
                            <button onClick={() => handleDeleteBill(bill.id)} className="p-3 bg-white dark:bg-[#0B3E3A] text-[#F43F5E] border-[3px] border-[#0B3E3A] dark:border-white rounded-xl shadow-[3px_3px_0_0_#0B3E3A] dark:shadow-[3px_3px_0_0_#FFFFFF] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"><Trash2 size={18} strokeWidth={3} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ═══ MOBILE BOTTOM NAV (COMIC STYLE) ═══ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FDE68A] dark:bg-[#0B3E3A] border-t-[4px] border-[#0B3E3A] dark:border-white pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-end justify-around py-3 px-2 relative">
          {[{ id: 'dashboard' as const, icon: Home, label: 'Home' }, { id: 'analytics' as const, icon: BarChart3, label: 'Stats' }].map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeView === item.id ? 'text-[#0B3E3A] dark:text-[#FDE68A]' : 'text-[#0B3E3A]/60 dark:text-white/60'}`}>
              <item.icon size={24} strokeWidth={activeView === item.id ? 3 : 2} />
              <span className="text-[10px] font-black uppercase">{item.label}</span>
            </button>
          ))}
          <div className="relative -top-8 px-2">
            <button onClick={() => setActiveView('transactions')} className="w-16 h-16 rounded-full border-[4px] border-[#0B3E3A] dark:border-white shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] bg-[#10B981] flex items-center justify-center hover:translate-y-[2px] active:shadow-none transition-all">
              <Plus size={32} strokeWidth={3} className="text-[#0B3E3A] dark:text-white" />
            </button>
          </div>
          {[{ id: 'wallets' as const, icon: CreditCard, label: 'Dompet' }, { id: 'bills' as const, icon: Bell, label: 'Tagihan' }].map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeView === item.id ? 'text-[#0B3E3A] dark:text-[#FDE68A]' : 'text-[#0B3E3A]/60 dark:text-white/60'}`}>
              <item.icon size={24} strokeWidth={activeView === item.id ? 3 : 2} />
              <span className="text-[10px] font-black uppercase">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ═══ MODALS (COMIC STYLE) ═══ */}
      {/* POCKET MODAL */}
      {showPocketModal && (
        <div className="fixed inset-0 bg-[#0B3E3A]/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4" onClick={() => setShowPocketModal(false)}>
          <div className="bg-[#FDFBF7] dark:bg-[#062623] w-full max-w-md rounded-2xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[8px_8px_0_0_#0B3E3A] dark:shadow-[8px_8px_0_0_#FFFFFF] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-[#DDD6FE] dark:bg-[#4C1D95] p-6 border-b-[4px] border-[#0B3E3A] dark:border-white flex justify-between items-center">
              <h3 className="font-black text-xl text-[#0B3E3A] dark:text-white uppercase">Buat Kantong</h3>
              <button onClick={() => setShowPocketModal(false)} className="w-8 h-8 bg-white border-[3px] border-[#0B3E3A] rounded-xl flex items-center justify-center shadow-[2px_2px_0_0_#0B3E3A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"><X size={16} strokeWidth={3} className="text-[#0B3E3A]" /></button>
            </div>
            <div className="p-6 space-y-5">
              <FormInput label="Nama Kantong" type="text" placeholder="Liburan Jepang" value={pocketForm.name} onChange={(v: string) => setPocketForm({ ...pocketForm, name: v })} icon={<Target size={18} strokeWidth={3} />} />
              <div>
                <label className="text-xs font-black text-[#0B3E3A] dark:text-white uppercase tracking-wide mb-2 block">Ikon</label>
                <div className="flex gap-2 flex-wrap">
                  {['🎯', '✈️', '🏠', '💻', '🎓', '💍', '🚗', '💎', '🏖️', '🎮'].map(ic => (
                    <button key={ic} onClick={() => setPocketForm({ ...pocketForm, icon: ic })} className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center border-[3px] transition-all ${pocketForm.icon === ic ? 'bg-[#FDE68A] border-[#0B3E3A] shadow-[2px_2px_0_0_#0B3E3A] dark:border-white dark:shadow-[2px_2px_0_0_#FFFFFF] translate-x-[-2px] translate-y-[-2px]' : 'bg-white dark:bg-[#1A1A1A] border-[#0B3E3A]/20 dark:border-white/20'}`}>{ic}</button>
                  ))}
                </div>
              </div>
              <FormInput label="Target Nominal (Rp)" type="number" placeholder="25000000" value={pocketForm.target_amount} onChange={(v: string) => setPocketForm({ ...pocketForm, target_amount: v })} icon={<span className="font-black text-sm">Rp</span>} />
              <FormInput label="Saldo Awal (Opsional)" type="number" placeholder="0" value={pocketForm.balance} onChange={(v: string) => setPocketForm({ ...pocketForm, balance: v })} icon={<span className="font-black text-sm">Rp</span>} />
              <button onClick={handleSavePocket} disabled={isSavingPocket} className="w-full bg-[#10B981] text-white font-black py-4 rounded-xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none transition-all uppercase flex justify-center items-center gap-2">
                {isSavingPocket ? <><Loader2 className="animate-spin" size={20} strokeWidth={3} /> PROSES...</> : <><Check size={20} strokeWidth={3} /> SIMPAN</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVEST MODAL */}
      {showInvestModal && (
        <div className="fixed inset-0 bg-[#0B3E3A]/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4" onClick={() => setShowInvestModal(false)}>
          <div className="bg-[#FDFBF7] dark:bg-[#062623] w-full max-w-md rounded-2xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[8px_8px_0_0_#0B3E3A] dark:shadow-[8px_8px_0_0_#FFFFFF] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-[#A7F3D0] dark:bg-[#064E3B] p-6 border-b-[4px] border-[#0B3E3A] dark:border-white flex justify-between items-center">
              <h3 className="font-black text-xl text-[#0B3E3A] dark:text-white uppercase">Aset Investasi</h3>
              <button onClick={() => setShowInvestModal(false)} className="w-8 h-8 bg-white border-[3px] border-[#0B3E3A] rounded-xl flex items-center justify-center shadow-[2px_2px_0_0_#0B3E3A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"><X size={16} strokeWidth={3} className="text-[#0B3E3A]" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-black text-[#0B3E3A] dark:text-white uppercase tracking-wide mb-2 block">Jenis Aset</label>
                <div className="flex flex-wrap gap-2">
                  {['Saham', 'Reksa Dana', 'Emas', 'Kripto', 'Deposito', 'Lainnya'].map(t => (
                    <button key={t} onClick={() => setInvestForm({ ...investForm, asset_type: t })} className={`px-4 py-2 rounded-xl text-xs font-black border-[3px] transition-all ${investForm.asset_type === t ? 'bg-[#FDE68A] border-[#0B3E3A] dark:border-white shadow-[2px_2px_0_0_#0B3E3A] dark:shadow-[2px_2px_0_0_#FFFFFF] translate-x-[-2px] translate-y-[-2px] text-[#0B3E3A]' : 'bg-white dark:bg-[#1A1A1A] border-[#0B3E3A]/20 dark:border-white/20 text-[#0B3E3A] dark:text-white'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <FormInput label="Nama Aset" type="text" placeholder="BBCA / Bitcoin" value={investForm.name} onChange={(v: string) => setInvestForm({ ...investForm, name: v })} icon={<TrendingUp size={18} strokeWidth={3} />} />
              <FormInput label="Platform" type="text" placeholder="Bibit / Indodax" value={investForm.platform} onChange={(v: string) => setInvestForm({ ...investForm, platform: v })} icon={<Briefcase size={18} strokeWidth={3} />} />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Modal (Rp)" type="number" placeholder="0" value={investForm.invested_amount} onChange={(v: string) => setInvestForm({ ...investForm, invested_amount: v })} icon={<span className="font-black">Rp</span>} />
                <FormInput label="Kini (Rp)" type="number" placeholder="0" value={investForm.current_value} onChange={(v: string) => setInvestForm({ ...investForm, current_value: v })} icon={<span className="font-black">Rp</span>} />
              </div>
              <button onClick={handleSaveInvest} disabled={isSavingInvest} className="w-full bg-[#10B981] text-white font-black py-4 rounded-xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none transition-all uppercase flex justify-center items-center gap-2">
                {isSavingInvest ? <><Loader2 className="animate-spin" size={20} strokeWidth={3} /> PROSES...</> : <><Check size={20} strokeWidth={3} /> SIMPAN</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BILL MODAL */}
      {showBillModal && (
        <div className="fixed inset-0 bg-[#0B3E3A]/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4" onClick={() => { setShowBillModal(false); setEditingBillId(null); }}>
          <div className="bg-[#FDFBF7] dark:bg-[#062623] w-full max-w-md rounded-2xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[8px_8px_0_0_#0B3E3A] dark:shadow-[8px_8px_0_0_#FFFFFF] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-[#FECDD3] dark:bg-[#881337] p-6 border-b-[4px] border-[#0B3E3A] dark:border-white flex justify-between items-center">
              <h3 className="font-black text-xl text-[#0B3E3A] dark:text-white uppercase">{editingBillId ? 'Edit Tagihan' : 'Tambah Tagihan'}</h3>
              <button onClick={() => { setShowBillModal(false); setEditingBillId(null); }} className="w-8 h-8 bg-white border-[3px] border-[#0B3E3A] rounded-xl flex items-center justify-center shadow-[2px_2px_0_0_#0B3E3A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"><X size={16} strokeWidth={3} className="text-[#0B3E3A]" /></button>
            </div>
            <div className="p-6 space-y-5">
              <FormInput label="Nama Tagihan" type="text" placeholder="Netflix / Listrik" value={billForm.name} onChange={(v: string) => setBillForm({ ...billForm, name: v })} icon={<Bell size={18} strokeWidth={3} />} />
              <FormInput label="Nominal (Rp)" type="number" placeholder="150000" value={billForm.amount} onChange={(v: string) => setBillForm({ ...billForm, amount: v })} icon={<span className="font-black">Rp</span>} />
              <FormInput label="Tanggal Jatuh Tempo (1-31)" type="number" placeholder="15" value={billForm.due_date} onChange={(v: string) => setBillForm({ ...billForm, due_date: v })} icon={<Calendar size={18} strokeWidth={3} />} />
              <button onClick={handleSaveBill} disabled={isSavingBill} className="w-full bg-[#10B981] text-white font-black py-4 rounded-xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none transition-all uppercase flex justify-center items-center gap-2">
                {isSavingBill ? <><Loader2 className="animate-spin" size={20} strokeWidth={3} /> PROSES...</> : <><Check size={20} strokeWidth={3} /> SIMPAN</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {isEditingSettings && (
        <div className="fixed inset-0 bg-[#0B3E3A]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] dark:bg-[#062623] w-full max-w-2xl rounded-2xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[8px_8px_0_0_#0B3E3A] dark:shadow-[8px_8px_0_0_#FFFFFF] max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
            <div className="bg-[#FDE68A] dark:bg-[#0B3E3A] p-6 border-b-[4px] border-[#0B3E3A] dark:border-white flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-black text-xl text-[#0B3E3A] dark:text-white uppercase">Pengaturan</h3>
              <button onClick={() => setIsEditingSettings(false)} className="w-8 h-8 bg-white border-[3px] border-[#0B3E3A] rounded-xl flex items-center justify-center shadow-[2px_2px_0_0_#0B3E3A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"><X size={16} strokeWidth={3} className="text-[#0B3E3A]" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="font-black text-lg uppercase mb-4 text-[#0B3E3A] dark:text-white border-b-[3px] border-[#0B3E3A] dark:border-white pb-2">Data Dasar</h4>
                  <div className="space-y-4">
                    <FormInput label="Saldo Kas Tunai Awal" type="number" placeholder="1000000" value={initialBalance} onChange={(v: any) => setInitialBalance(v)} icon={<Wallet size={18} strokeWidth={3} />} />
                    <FormInput label="Target Kekayaan Impian" type="number" placeholder="50000000" value={targetSaving} onChange={(v: any) => setTargetSaving(v)} icon={<Target size={18} strokeWidth={3} />} />
                  </div>
                </div>
                <button onClick={handleResetData} disabled={isSubmitting} className="w-full bg-[#F43F5E] text-white font-black py-4 rounded-xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none transition-all uppercase flex justify-center items-center gap-2">
                  {isSubmitting ? <><Loader2 className="animate-spin" size={20} strokeWidth={3} /> MENGHAPUS...</> : <><Trash2 size={20} strokeWidth={3} /> RESET SEMUA DATA</>}
                </button>
              </div>
              <div>
                <h4 className="font-black text-lg uppercase mb-4 text-[#0B3E3A] dark:text-white border-b-[3px] border-[#0B3E3A] dark:border-white pb-2">Batas Anggaran Bulanan</h4>
                <div className="space-y-4">
                  {['Makanan', 'Tagihan', 'Transportasi', 'Belanja', 'Hiburan'].map((cat) => (
                    <div key={cat}>
                      <FormInput label={cat} type="number" placeholder="Tanpa batas" value={catBudgets[cat]} onChange={(v: any) => setCatBudgets({ ...catBudgets, [cat]: v })} icon={<span className="font-black">Rp</span>} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t-[4px] border-[#0B3E3A] dark:border-white bg-white dark:bg-[#1A1A1A] flex flex-col gap-3">
              <button onClick={saveSettings} className="w-full bg-[#10B981] text-white font-black py-4 rounded-xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none transition-all uppercase flex justify-center items-center gap-2 text-lg">
                <Check size={24} strokeWidth={3} /> SIMPAN PENGATURAN
              </button>
              {/* Tombol Logout khusus tampil di Mobile */}
              <button onClick={handleLogout} className="lg:hidden w-full bg-[#F43F5E] text-white font-black py-4 rounded-xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[4px_4px_0_0_#0B3E3A] dark:shadow-[4px_4px_0_0_#FFFFFF] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0B3E3A] active:shadow-none transition-all uppercase flex justify-center items-center gap-2 text-lg">
                <LogOut size={24} strokeWidth={3} /> KELUAR AKUN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-[#0B3E3A]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedReceipt(null)}>
          <div className="bg-[#FDFBF7] dark:bg-[#062623] w-full max-w-sm rounded-2xl border-[4px] border-[#0B3E3A] dark:border-white shadow-[8px_8px_0_0_#0B3E3A] dark:shadow-[8px_8px_0_0_#FFFFFF] relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className={`p-6 text-center border-b-[4px] border-[#0B3E3A] dark:border-white ${selectedReceipt.type === 'pemasukan' ? 'bg-[#A7F3D0]' : selectedReceipt.category === 'Investasi' ? 'bg-[#BAE6FD]' : 'bg-[#FECDD3]'}`}>
              <div className="w-16 h-16 border-[4px] border-[#0B3E3A] bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0_0_#0B3E3A] rotate-3">
                {selectedReceipt.type === 'pemasukan' ? <ArrowUpRight size={32} strokeWidth={3} className="text-[#0B3E3A]" /> : selectedReceipt.category === 'Investasi' ? <Gem size={32} strokeWidth={3} className="text-[#0B3E3A]" /> : <ArrowDownRight size={32} strokeWidth={3} className="text-[#0B3E3A]" />}
              </div>
              <h3 className="font-black text-2xl uppercase tracking-widest text-[#0B3E3A]">STRUK</h3>
              <p className="text-[#0B3E3A] font-bold text-xs mt-1">{new Date(selectedReceipt.created_at).toLocaleString('id-ID')}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center mb-6">
                <p className="text-[#0B3E3A] dark:text-white text-xs font-black uppercase tracking-widest mb-1 opacity-70">TOTAL {selectedReceipt.type}</p>
                <p className={`text-4xl font-black truncate px-2 ${selectedReceipt.type === 'pemasukan' ? 'text-[#10B981]' : selectedReceipt.category === 'Investasi' ? 'text-[#0284C7]' : 'text-[#F43F5E]'}`}>
                  {formatIDR(Number(selectedReceipt.amount))}
                </p>
              </div>
              {[
                { label: 'Keterangan', val: selectedReceipt.title },
                { label: 'Kategori', val: selectedReceipt.category },
                { label: 'Sumber Dana', val: selectedReceipt.wallet || 'Tunai' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-start border-b-[3px] border-dashed border-[#0B3E3A]/20 dark:border-white/20 pb-2">
                  <span className="text-[#0B3E3A] dark:text-white opacity-70 text-xs font-black uppercase">{row.label}</span>
                  <span className={`text-sm font-black text-right max-w-[60%] text-[#0B3E3A] dark:text-white uppercase`}>{row.val}</span>
                </div>
              ))}

              {/* ── INFO LOKASI GPS ── */}
              {selectedReceipt.latitude && selectedReceipt.longitude && (
                <div className="flex justify-between items-center border-b-[3px] border-dashed border-[#0B3E3A]/20 dark:border-white/20 pb-2">
                  <span className="text-[#0B3E3A] dark:text-white opacity-70 text-xs font-black uppercase">Lokasi</span>
                  <a href={`https://maps.google.com/?q=${selectedReceipt.latitude},${selectedReceipt.longitude}`} target="_blank" rel="noreferrer" className="text-xs font-black bg-[#BAE6FD] text-[#0B3E3A] border-[2px] border-[#0B3E3A] px-2 py-1 rounded-md shadow-[2px_2px_0_0_#0B3E3A] flex items-center gap-1 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all uppercase">
                    <MapPin size={12} strokeWidth={3} /> BUKA PETA
                  </a>
                </div>
              )}

              <div className="flex justify-between items-center border-b-[3px] border-dashed border-[#0B3E3A]/20 dark:border-white/20 pb-2">
                <span className="text-[#0B3E3A] dark:text-white opacity-70 text-xs font-black uppercase">Ref ID</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black bg-[#FDE68A] text-[#0B3E3A] border-[2px] border-[#0B3E3A] px-2 py-1 rounded-md">{selectedReceipt.id.split('-')[0].toUpperCase()}</span>
                  <button onClick={() => { navigator.clipboard.writeText(selectedReceipt.id); showToast('Ref ID disalin!', 'success'); }} className="p-1 bg-white border-2 border-[#0B3E3A] rounded-md shadow-[2px_2px_0_0_#0B3E3A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"><Copy size={12} strokeWidth={3} className="text-[#0B3E3A]" /></button>
                </div>
              </div>
              {selectedReceipt.image_url && (
                <div className="mt-6 border-[4px] border-[#0B3E3A] rounded-xl overflow-hidden shadow-[4px_4px_0_0_#0B3E3A] transform -rotate-2">
                  <img src={selectedReceipt.image_url} alt="Bukti Struk" className="w-full h-auto object-cover max-h-48 grayscale hover:grayscale-0 transition-all" />
                </div>
              )}
            </div>

            <button onClick={() => setSelectedReceipt(null)} className="absolute -top-4 -right-4 w-10 h-10 bg-white border-[4px] border-[#0B3E3A] rounded-full flex items-center justify-center shadow-[4px_4px_0_0_#0B3E3A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"><X size={20} strokeWidth={3} className="text-[#0B3E3A]" /></button>
          </div>
        </div>
      )}

    </div>
  );
}

// ── COMIC STYLE INPUT HELPER ───────────────────────────────────────────────
function FormInput({ label, icon, type, placeholder, value, onChange }: any) {
  return (
    <div>
      <label className="text-xs font-black text-[#0B3E3A] dark:text-white uppercase tracking-wide mb-2 block">{label}</label>
      <div className="flex items-center bg-white dark:bg-[#1A1A1A] border-[3px] border-[#0B3E3A] dark:border-white rounded-xl overflow-hidden shadow-[3px_3px_0_0_#0B3E3A] dark:shadow-[3px_3px_0_0_#FFFFFF] focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:shadow-none transition-all">
        <span className="pl-4 pr-2 text-[#0B3E3A] dark:text-white">{icon}</span>
        <div className="w-1 h-6 bg-[#0B3E3A]/10 dark:bg-white/10 rounded-full" />
        <input required type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="flex-1 px-4 py-3.5 text-sm font-black text-[#0B3E3A] dark:text-white placeholder:text-[#0B3E3A]/40 dark:placeholder:text-white/40 outline-none bg-transparent" />
      </div>
    </div>
  );
}

// ── COMIC STYLE SELECT HELPER ──────────────────────────────────────────────
function SelectInput({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="text-xs font-black text-[#0B3E3A] dark:text-white uppercase tracking-wide mb-2 block">{label}</label>
      <div className="flex items-center bg-white dark:bg-[#1A1A1A] border-[3px] border-[#0B3E3A] dark:border-white rounded-xl overflow-hidden shadow-[3px_3px_0_0_#0B3E3A] dark:shadow-[3px_3px_0_0_#FFFFFF] focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:shadow-none transition-all pr-4 relative">
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3.5 text-sm font-black text-[#0B3E3A] dark:text-white outline-none bg-transparent appearance-none cursor-pointer z-10 relative">
          {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute right-4 z-0">
          <ChevronDown size={18} strokeWidth={3} className="text-[#0B3E3A] dark:text-white" />
        </div>
      </div>
    </div>
  );
}
