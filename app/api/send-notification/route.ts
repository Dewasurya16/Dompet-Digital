// app/api/send-notification/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper untuk format Rupiah di dalam email
const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export async function POST(req: Request) {
    try {
        const { email, type, data, attachmentBase64, filename } = await req.json();

        const usernameRaw = email.split('@')[0];
        const displayName = usernameRaw.charAt(0).toUpperCase() + usernameRaw.slice(1);

        let subject = '';
        let htmlContent = '';
        const attachments: any[] = [];

        const baseStyle = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 460px; margin: 0 auto; background: #FFFFFF; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0; text-align: center; color: #334155;`;

        // 1. Notifikasi Welcome
        if (type === 'welcome') {
            subject = `Selamat Datang di My Dompet Digital, ${displayName}! 🎉`;
            htmlContent = `
            <div style="${baseStyle}">
                <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); padding: 40px 20px;">
                    <div style="font-size: 40px; margin-bottom: 10px;">👋</div>
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800;">Halo, ${displayName}!</h1>
                </div>
                <div style="padding: 30px; line-height: 1.6;">
                    <p style="margin: 0 0 15px 0;">Selamat bergabung di <strong>My Dompet Digital</strong>. Mulai sekarang, catat pengeluaran jadi lebih mudah dan elegan.</p>
                    <p style="margin: 0; color: #64748B;">Ayo wujudkan target impianmu bersama kami! 💪</p>
                </div>
            </div>`;
        }
        // 2. Notifikasi Level Up (Gamifikasi)
        else if (type === 'levelup') {
            subject = `👑 Wih! Kamu Naik Level jadi ${data.newLevel}!`;
            htmlContent = `
            <div style="${baseStyle}">
                <div style="background: linear-gradient(135deg, #F59E0B, #FCD34D); padding: 40px 20px;">
                    <div style="font-size: 50px; margin-bottom: 10px;">${data.icon}</div>
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px;">LEVEL UP!</h1>
                </div>
                <div style="padding: 30px; line-height: 1.6;">
                    <p style="font-size: 16px;">Kekayaanmu menyentuh angka baru. Kamu resmi dinobatkan sebagai:</p>
                    <h2 style="color: #F59E0B; font-size: 28px; margin: 15px 0;">${data.newLevel}</h2>
                    <p style="color: #64748B;">Pertahankan terus gaya hematmu! 💸</p>
                </div>
            </div>`;
        }
        // 3. Pengiriman Laporan PDF / CSV
        else if (type === 'report') {
            subject = `📊 Lampiran Laporan Keuanganmu (${filename})`;
            htmlContent = `
            <div style="${baseStyle}">
                <div style="background: #F1F5F9; padding: 40px 20px; border-bottom: 2px dashed #CBD5E1;">
                    <div style="font-size: 40px; margin-bottom: 10px;">📁</div>
                    <h1 style="color: #0F172A; margin: 0; font-size: 20px; font-weight: 800;">Laporan Siap!</h1>
                </div>
                <div style="padding: 30px; line-height: 1.6;">
                    <p>Halo ${displayName},<br><br>Sesuai permintaanmu, laporan keuangan telah berhasil di-export. Silakan cek bagian <strong>lampiran (attachment)</strong> pada email ini.</p>
                </div>
            </div>`;

            if (attachmentBase64) {
                attachments.push({ filename, content: attachmentBase64 });
            }
        }
        // 4. Peringatan Budget Jebol (AI Alert)
        else if (type === 'budget_alert') {
            const { category, spent, limit, personality } = data;
            const remaining = limit - spent;
            const remainingText = remaining >= 0 ? `Sisa <strong>${formatIDR(remaining)}</strong>` : `Malah minus <strong>${formatIDR(Math.abs(remaining))}</strong>`;

            const isRoast = personality === 'roasting';

            subject = isRoast
                ? `🚨 Woy! Jatah ${category} Lu Udah Sekarat!`
                : `⚠️ Peringatan: Anggaran ${category} Menipis`;

            const roastText = `Gaya elit ekonomi sulit! Lu udah abisin <strong>${formatIDR(spent)}</strong> buat ${category} bulan ini. Limit lu cuma <strong>${formatIDR(limit)}</strong>. ${remainingText} doang, mau makan angin lu akhir bulan? Mending ngerem dari sekarang deh!`;

            const motivatorText = `Halo ${displayName}, sekadar mengingatkan bahwa pengeluaranmu untuk kategori <strong>${category}</strong> sudah mencapai <strong>${formatIDR(spent)}</strong> dari batas anggaran <strong>${formatIDR(limit)}</strong>. ${remainingText}. Yuk, lebih bijak lagi mengerem pengeluaran agar target menabungmu tetap tercapai! Kamu pasti bisa! 💪`;

            htmlContent = `
            <div style="${baseStyle}">
                <div style="background: ${isRoast ? 'linear-gradient(135deg, #E11D48, #9F1239)' : 'linear-gradient(135deg, #F59E0B, #D97706)'}; padding: 40px 20px;">
                    <div style="font-size: 40px; margin-bottom: 10px;">${isRoast ? '🔥' : '🎯'}</div>
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800;">${isRoast ? 'REM WOY!' : 'Perhatian Anggaran'}</h1>
                </div>
                <div style="padding: 30px; line-height: 1.6;">
                    <p style="margin: 0 0 15px 0; font-size: 15px; color: #475569;">${isRoast ? roastText : motivatorText}</p>
                </div>
            </div>`;
        }
        // 5. Goal Reached (Selebrasi Tabungan)
        else if (type === 'goal_reached') {
            const { pocketName, targetAmount } = data;
            subject = `🎉 SELAMAT! Tabungan '${pocketName}' Tercapai!`;
            htmlContent = `
            <div style="${baseStyle}">
                <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 40px 20px;">
                    <div style="font-size: 50px; margin-bottom: 10px;">🏆</div>
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 900;">TARGET TERCAPAI!</h1>
                </div>
                <div style="padding: 30px; line-height: 1.6;">
                    <p style="font-size: 16px;">Luar biasa, ${displayName}! Tabungan <strong>${pocketName}</strong> kamu telah menyentuh target 100% sebesar <strong>${formatIDR(targetAmount)}</strong>.</p>
                    <p style="color: #64748B;">Kerja keras dan disiplinmu membuahkan hasil. Silakan cairkan impianmu sekarang! 🏖️🚀</p>
                </div>
            </div>`;
        }
        // 6. Anomaly Alert (Pengeluaran Besar)
        else if (type === 'anomaly_alert') {
            const { amount, category, description } = data;
            subject = `🚨 PERINGATAN: Transaksi Besar Rp ${amount.toLocaleString('id-ID')} Terdeteksi!`;
            htmlContent = `
            <div style="${baseStyle}">
                <div style="background: linear-gradient(135deg, #EF4444, #B91C1C); padding: 40px 20px;">
                    <div style="font-size: 50px; margin-bottom: 10px;">💳</div>
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 900;">TRANSAKSI ANOMALI</h1>
                </div>
                <div style="padding: 30px; line-height: 1.6;">
                    <p style="font-size: 16px;">Sistem AI kami mendeteksi pengeluaran besar yang tidak biasa hari ini:</p>
                    <div style="background: #FEF2F2; border: 1px solid #FECACA; padding: 15px; border-radius: 12px; margin: 20px 0;">
                        <h2 style="color: #EF4444; font-size: 28px; margin: 0;">${formatIDR(amount)}</h2>
                        <p style="color: #7F1D1D; margin: 5px 0 0 0; font-size: 14px;"><strong>Kategori:</strong> ${category}<br><strong>Catatan:</strong> ${description}</p>
                    </div>
                    <p style="color: #64748B;">Apakah ini benar kamu? Jika tidak, segera hubungi bank kamu. Jika iya, ingat rem sedikit pengeluaran bulan ini ya! 💸</p>
                </div>
            </div>`;
        }
        // 7. Bill Reminder (Jatuh Tempo Tagihan)
        else if (type === 'bill_reminder') {
            const { billName, amount, daysLeft } = data;
            subject = `🔔 H-${daysLeft}: Tagihan ${billName} Segera Jatuh Tempo`;
            htmlContent = `
            <div style="${baseStyle}">
                <div style="background: linear-gradient(135deg, #3B82F6, #2563EB); padding: 40px 20px;">
                    <div style="font-size: 50px; margin-bottom: 10px;">📅</div>
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 900;">REMINDER TAGIHAN</h1>
                </div>
                <div style="padding: 30px; line-height: 1.6;">
                    <p style="font-size: 16px;">Halo ${displayName}, sekadar mengingatkan bahwa tagihanmu akan jatuh tempo dalam <strong>${daysLeft} hari</strong>:</p>
                    <h2 style="color: #2563EB; font-size: 24px; margin: 15px 0;">${billName} - ${formatIDR(amount)}</h2>
                    <p style="color: #64748B;">Pastikan saldomu cukup agar layanan tidak terputus dan tidak kena denda ya! ⚡</p>
                </div>
            </div>`;
        }
        // 8. Monthly Recap
        else if (type === 'monthly_recap') {
            const { monthName, totalIncome, totalExpense } = data;
            const diff = totalIncome - totalExpense;
            const isPositive = diff >= 0;
            
            subject = `📊 Rekap Finansial Bulan ${monthName} Kamu Sudah Siap!`;
            htmlContent = `
            <div style="${baseStyle}">
                <div style="background: linear-gradient(135deg, #8B5CF6, #6D28D9); padding: 40px 20px;">
                    <div style="font-size: 50px; margin-bottom: 10px;">📈</div>
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 900;">REKAP ${monthName.toUpperCase()}</h1>
                </div>
                <div style="padding: 30px; line-height: 1.6; text-align: left;">
                    <p style="font-size: 16px; text-align: center;">Kerja bagus bulan ini, ${displayName}! Berikut adalah ringkasan arus kas kamu:</p>
                    
                    <div style="background: #F8FAFC; border-radius: 12px; padding: 15px; margin: 20px 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #64748B;">Pemasukan:</span>
                            <strong style="color: #10B981;">+ ${formatIDR(totalIncome)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px; margin-bottom: 10px;">
                            <span style="color: #64748B;">Pengeluaran:</span>
                            <strong style="color: #EF4444;">- ${formatIDR(totalExpense)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #334155; font-weight: bold;">Sisa Uang:</span>
                            <strong style="color: ${isPositive ? '#10B981' : '#EF4444'};">${isPositive ? '+' : ''} ${formatIDR(diff)}</strong>
                        </div>
                    </div>
                    
                    <p style="text-align: center; color: #64748B; font-size: 14px;">Mari persiapkan strategi finansial yang lebih baik untuk bulan depan! 💪</p>
                </div>
            </div>`;
        }

        const { error } = await resend.emails.send({
            from: 'My Dompet Digital <no-reply@mydompetdigital.my.id>',
            to: [email],
            subject: subject,
            html: htmlContent,
            attachments: attachments.length > 0 ? attachments : undefined
        });

        if (error) {
            console.error("Resend Error:", error);
            return NextResponse.json({ error }, { status: 400 });
        }
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Internal Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}