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