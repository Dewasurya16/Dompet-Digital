export const formatIDR = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export const parseMonthSafe = (ym: string) => new Date(`${ym}-15`);

export const CATEGORY_COLORS: any = {
  'Makanan': '#F59E0B', 'Transportasi': '#3B82F6', 'Tagihan': '#EF4444',
  'Belanja': '#EC4899', 'Hiburan': '#8B5CF6', 'Investasi': '#14B8A6',
  'SPPD': '#F97316', 'Beri Hutang': '#64748B', 'Bayar Pinjaman': '#64748B',
  'Gaji Pokok': '#10B981', 'Tukin': '#3B82F6', 'Uang Makan': '#F59E0B',
  'Bonus': '#8B5CF6', 'Dibayar Hutang': '#64748B', 'Terima Pinjaman': '#64748B',
  'Lainnya': '#94A3B8'
};

export const WALLET_OPTIONS = ['Kas Tunai', 'Mandiri', 'BRI', 'BCA', 'BNI', 'BSI', 'GoPay', 'OVO', 'DANA', 'Lainnya'];
