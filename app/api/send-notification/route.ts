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
        let headerColor = '';
        let headerIcon = '';
        let headerTitle = '';
        let bodyContent = '';
        const attachments: any[] = [];

        // Palet Warna Comic Style
        const darkTeal = '#0B3E3A';

        // 1. Notifikasi Welcome
        if (type === 'welcome') {
            subject = `Selamat Datang di Dompet Digital, ${displayName}! 🎉`;
            headerColor = '#FDE68A'; // Yellow
            headerIcon = '👋';
            headerTitle = `HALO, ${displayName.toUpperCase()}!`;
            bodyContent = `
                <p style="margin: 0 0 15px 0;">Selamat bergabung di <strong>Dompet Digital</strong>. Mulai sekarang, catat pengeluaran jadi lebih gampang, seru, dan elegan.</p>
                <p style="margin: 0; opacity: 0.8;">Ayo wujudkan target impianmu bersama kami! 💪</p>
            `;
        }
        // 2. Notifikasi Level Up (Gamifikasi)
        else if (type === 'levelup') {
            subject = `👑 Wih! Kamu Naik Level jadi ${data.newLevel}!`;
            headerColor = '#A7F3D0'; // Green
            headerIcon = data.icon || '🚀';
            headerTitle = 'LEVEL UP!';
            bodyContent = `
                <p style="font-size: 14px; margin-bottom: 12px;">Kekayaanmu menyentuh angka baru. Kamu resmi dinobatkan sebagai:</p>
                <div style="background-color: #FDE68A; border: 3px solid ${darkTeal}; border-radius: 12px; padding: 12px; display: inline-block; margin-bottom: 15px; box-shadow: 4px 4px 0 0 ${darkTeal};">
                    <h2 style="color: ${darkTeal}; font-size: 24px; margin: 0; font-weight: 900; text-transform: uppercase;">${data.newLevel}</h2>
                </div>
                <p style="opacity: 0.8; margin: 0;">Pertahankan terus gaya hematmu! 💸</p>
            `;
        }
        // 3. Pengiriman Laporan PDF / CSV
        else if (type === 'report') {
            subject = `📊 Lampiran Laporan Keuanganmu (${filename})`;
            headerColor = '#BAE6FD'; // Blue
            headerIcon = '📁';
            headerTitle = 'LAPORAN SIAP!';
            bodyContent = `
                <p style="margin: 0 0 15px 0;">Halo ${displayName},</p>
                <p style="margin: 0;">Sesuai permintaanmu, laporan keuangan telah berhasil di-export. Silakan cek bagian <strong>lampiran (attachment)</strong> pada email ini ya!</p>
            `;
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

            subject = isRoast ? `🚨 Woy! Jatah ${category} Lu Udah Sekarat!` : `⚠️ Peringatan: Anggaran ${category} Menipis`;
            headerColor = isRoast ? '#FECDD3' : '#FDE68A'; // Pink/Red vs Yellow
            headerIcon = isRoast ? '🔥' : '🎯';
            headerTitle = isRoast ? 'REM WOY!' : 'PERHATIAN ANGGARAN';

            const textContent = isRoast
                ? `Gaya elit ekonomi sulit! Lu udah abisin <strong>${formatIDR(spent)}</strong> buat ${category} bulan ini. Limit lu cuma <strong>${formatIDR(limit)}</strong>. ${remainingText} doang, mau makan angin lu akhir bulan? Mending ngerem dari sekarang deh!`
                : `Sekadar mengingatkan bahwa pengeluaranmu untuk kategori <strong>${category}</strong> sudah mencapai <strong>${formatIDR(spent)}</strong> dari batas anggaran <strong>${formatIDR(limit)}</strong>. ${remainingText}. Yuk, lebih bijak lagi mengerem pengeluaran agar target menabungmu tercapai!`;

            bodyContent = `<p style="margin: 0; line-height: 1.6;">${textContent}</p>`;
        }
        // 5. Goal Reached (Selebrasi Tabungan)
        else if (type === 'goal_reached') {
            const { pocketName, targetAmount } = data;
            subject = `🎉 SELAMAT! Tabungan '${pocketName}' Tercapai!`;
            headerColor = '#10B981'; // Solid Green
            headerIcon = '🏆';
            headerTitle = 'TARGET TERCAPAI!';
            bodyContent = `
                <p style="margin: 0 0 15px 0;">Luar biasa, ${displayName}! Tabungan <strong>${pocketName.toUpperCase()}</strong> kamu telah menyentuh target 100% sebesar <strong>${formatIDR(targetAmount)}</strong>.</p>
                <p style="margin: 0; opacity: 0.8;">Kerja keras dan disiplinmu membuahkan hasil. Silakan cairkan impianmu sekarang! 🏖️🚀</p>
            `;
        }
        // 6. Anomaly Alert (Pengeluaran Besar)
        else if (type === 'anomaly_alert') {
            const { amount, category, description } = data;
            subject = `🚨 PERINGATAN: Transaksi Besar Terdeteksi!`;
            headerColor = '#F43F5E'; // Solid Red
            headerIcon = '💳';
            headerTitle = 'TRANSAKSI ANOMALI';
            bodyContent = `
                <p style="margin: 0 0 15px 0;">Sistem AI kami mendeteksi pengeluaran besar yang tidak biasa hari ini:</p>
                <div style="background-color: #FFFFFF; border: 3px solid ${darkTeal}; border-radius: 12px; padding: 15px; text-align: left; margin-bottom: 20px;">
                    <h2 style="color: #F43F5E; font-size: 24px; margin: 0 0 10px 0; font-weight: 900;">${formatIDR(amount)}</h2>
                    <p style="margin: 5px 0 0 0; font-size: 13px;"><strong style="text-transform: uppercase;">Kategori:</strong> ${category}</p>
                    <p style="margin: 5px 0 0 0; font-size: 13px;"><strong style="text-transform: uppercase;">Catatan:</strong> ${description}</p>
                </div>
                <p style="margin: 0; opacity: 0.8;">Apakah ini benar kamu? Jika iya, ingat rem sedikit pengeluaran bulan ini ya! 💸</p>
            `;
        }
        // 7. Bill Reminder (Jatuh Tempo Tagihan)
        else if (type === 'bill_reminder') {
            const { billName, amount, daysLeft } = data;
            subject = `🔔 H-${daysLeft}: Tagihan ${billName} Segera Jatuh Tempo`;
            headerColor = '#BAE6FD'; // Blue
            headerIcon = '📅';
            headerTitle = 'REMINDER TAGIHAN';
            bodyContent = `
                <p style="margin: 0 0 15px 0;">Halo ${displayName}, sekadar mengingatkan bahwa tagihanmu akan jatuh tempo dalam <strong>${daysLeft} hari</strong>:</p>
                <div style="background-color: #FDFBF7; border: 3px solid ${darkTeal}; border-radius: 12px; padding: 15px; margin-bottom: 20px;">
                    <h2 style="color: ${darkTeal}; font-size: 20px; margin: 0; font-weight: 900; text-transform: uppercase;">${billName}</h2>
                    <p style="color: #F43F5E; font-size: 18px; font-weight: 900; margin: 5px 0 0 0;">${formatIDR(amount)}</p>
                </div>
                <p style="margin: 0; opacity: 0.8;">Pastikan saldomu cukup agar layanan tidak terputus dan tidak kena denda ya! ⚡</p>
            `;
        }
        // 8. Monthly Recap
        else if (type === 'monthly_recap') {
            const { monthName, totalIncome, totalExpense } = data;
            const diff = totalIncome - totalExpense;
            const isPositive = diff >= 0;

            subject = `📊 Rekap Finansial Bulan ${monthName} Kamu Sudah Siap!`;
            headerColor = '#DDD6FE'; // Purple
            headerIcon = '📈';
            headerTitle = `REKAP ${monthName.toUpperCase()}`;
            bodyContent = `
                <p style="margin: 0 0 15px 0;">Kerja bagus bulan ini, ${displayName}! Berikut adalah ringkasan arus kas kamu:</p>
                
                <div style="background-color: #FFFFFF; border: 3px solid ${darkTeal}; border-radius: 12px; padding: 15px; margin-bottom: 20px; font-size: 13px; text-align: left;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="opacity: 0.7; font-weight: 900; text-transform: uppercase;">Pemasukan</span>
                        <strong style="color: #10B981; font-size: 15px;">+ ${formatIDR(totalIncome)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 3px dashed ${darkTeal}40;">
                        <span style="opacity: 0.7; font-weight: 900; text-transform: uppercase;">Pengeluaran</span>
                        <strong style="color: #F43F5E; font-size: 15px;">- ${formatIDR(totalExpense)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 900; text-transform: uppercase;">Sisa Uang</span>
                        <strong style="color: ${isPositive ? '#10B981' : '#F43F5E'}; font-size: 18px; text-shadow: 1px 1px 0 ${darkTeal};">
                            ${isPositive ? '+' : ''} ${formatIDR(diff)}
                        </strong>
                    </div>
                </div>
                <p style="margin: 0; opacity: 0.8; font-size: 12px;">Mari persiapkan strategi finansial yang lebih baik untuk bulan depan! 💪</p>
            `;
        }

        // Wrapper HTML Utama (Comic / Neo-Brutalism Style)
        const finalHtml = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Arial Black', Impact, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FDFBF7; margin: 0; padding: 40px 15px; color: ${darkTeal};">
            <div style="max-width: 420px; margin: 0 auto; text-align: center;">

                <!-- LOGO -->
                <div style="margin-bottom: 20px;">
                  <div style="display:inline-block; background:#FFFFFF; border: 3px solid ${darkTeal}; border-radius: 16px; box-shadow: 4px 4px 0 0 ${darkTeal}; padding: 10px 14px; margin-bottom:6px;">
                    <span style="font-size: 36px; line-height: 1;">💳</span>
                  </div>
                  <div style="font-size: 22px; font-weight: 900; color: ${darkTeal}; letter-spacing: -0.5px;">Dompet<span style="color: #10B981;">.</span></div>
                </div>
                
                <div style="background: #FFFFFF; border-radius: 16px; border: 4px solid ${darkTeal}; box-shadow: 8px 8px 0 0 ${darkTeal}; overflow: hidden;">
                    
                    <div style="background-color: ${headerColor}; padding: 30px 20px; border-bottom: 4px solid ${darkTeal};">
                        <div style="font-size: 50px; line-height: 1; margin-bottom: 10px; filter: drop-shadow(2px 2px 0px ${darkTeal});">${headerIcon}</div>
                        <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: ${darkTeal}; text-shadow: 1px 1px 0 #FFFFFF;">
                            ${headerTitle}
                        </h1>
                    </div>

                    <div style="padding: 24px; background-color: #FFFFFF; font-family: sans-serif; font-weight: bold; font-size: 14px; color: ${darkTeal};">
                        ${bodyContent}
                    </div>

                </div>

                <div style="margin-top: 30px; font-family: sans-serif; font-size: 12px; font-weight: bold; color: ${darkTeal}; opacity: 0.7;">
                    <p style="margin: 0 0 8px 0; text-transform: uppercase;">Dikirim otomatis oleh robot kasir</p>
                    <p style="margin: 0;">⚡ <a href="https://mydompetdigital.my.id" style="color: ${darkTeal}; text-decoration: underline; font-weight: 900;">Dompet Digital</a></p>
                </div>

            </div>
        </body>
        </html>
        `;

        const { error } = await resend.emails.send({
            from: 'Dompet Digital <no-reply@mydompetdigital.my.id>',
            to: [email],
            subject: subject,
            html: finalHtml,
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