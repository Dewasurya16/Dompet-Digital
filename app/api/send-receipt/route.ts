// app/api/send-receipt/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, title, amount, type, category, wallet, refId, date } = body;

    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

    // Ekstrak nama dari email (contoh: budi@gmail.com jadi Budi)
    const usernameRaw = email.split('@')[0];
    const displayName = usernameRaw.charAt(0).toUpperCase() + usernameRaw.slice(1);

    const isIncome = type === 'pemasukan';

    // Palet Warna Pastel & Modern
    const themeColor = isIncome ? '#059669' : '#E11D48'; // Emerald tua / Rose tua
    const lightBg = isIncome ? '#ECFDF5' : '#FFF1F2'; // Background atas yang sangat soft
    const iconSymbol = isIncome ? '↓ Pemasukan' : '↑ Pengeluaran';

    // Kata-kata ramah (Friendly Copywriting)
    const friendlyMessage = isIncome
      ? 'Wah, alhamdulillah ada dana masuk nih! Asik, saldo nambah makin tebal. 🎉'
      : 'Catatan pengeluaranmu sudah kami simpan dengan rapi. Tetap bijak berbelanja ya! 💸';

    const { data, error } = await resend.emails.send({
      from: 'My Dompet Digital <no-reply@mydompetdigital.my.id>',
      to: [email],
      subject: `Halo ${displayName}, ini struk ${type} barumu!`,
      html: `
            <!DOCTYPE html>
            <html lang="id">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 40px 15px; -webkit-font-smoothing: antialiased; color: #334155;">
              
              <!-- Main Container -->
              <div style="max-width: 460px; margin: 0 auto;">
                
                <!-- Sapaan Friendly -->
                <div style="text-align: center; margin-bottom: 30px;">
                  
                  <!-- PERBAIKAN ICON: Menggunakan text-align dan line-height agar pasti di tengah -->
                  <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #3B82F6, #6366F1); border-radius: 18px; margin: 0 auto 16px; text-align: center; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);">
                    <span style="font-size: 28px; line-height: 56px; display: inline-block; vertical-align: middle; margin: 0;">👛</span>
                  </div>

                  <h2 style="margin: 0 0 8px 0; color: #0F172A; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                    HALOO, ${displayName}! 👋
                  </h2>
                  <p style="margin: 0; color: #64748B; font-size: 15px; line-height: 1.6; padding: 0 20px;">
                    ${friendlyMessage}<br>Berikut adalah rincian transaksimu:
                  </p>
                </div>

                <!-- Kartu Struk (Receipt Card) -->
                <div style="background: #FFFFFF; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #E2E8F0;">
                  
                  <!-- Bagian Atas (Nominal) -->
                  <div style="padding: 40px 30px 35px; text-align: center; background-color: ${lightBg}; border-bottom: 2px dashed #CBD5E1;">
                    <div style="display: inline-block; padding: 8px 16px; background-color: #FFFFFF; border-radius: 20px; color: ${themeColor}; font-size: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                      ${iconSymbol}
                    </div>
                    <h1 style="margin: 0; color: ${themeColor}; font-size: 42px; font-weight: 900; letter-spacing: -1.5px;">
                      ${formattedAmount}
                    </h1>
                    <p style="margin: 12px 0 0 0; color: #64748B; font-size: 13px; font-weight: 600;">
                      ${date}
                    </p>
                  </div>

                  <!-- Bagian Bawah (Rincian Tabel) -->
                  <div style="padding: 30px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <tr>
                        <td style="padding: 0 0 16px 0; color: #64748B; font-weight: 500;">Keterangan</td>
                        <td style="padding: 0 0 16px 0; color: #0F172A; text-align: right; font-weight: 800;">${title}</td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0; color: #64748B; font-weight: 500; border-top: 1px solid #F1F5F9;">Kategori</td>
                        <td style="padding: 16px 0; color: #0F172A; text-align: right; font-weight: 800; border-top: 1px solid #F1F5F9;">${category}</td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0; color: #64748B; font-weight: 500; border-top: 1px solid #F1F5F9;">Sumber Dana</td>
                        <td style="padding: 16px 0; color: #3B82F6; text-align: right; font-weight: 800; border-top: 1px solid #F1F5F9;">${wallet}</td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0; color: #64748B; font-weight: 500; border-top: 1px solid #F1F5F9;">Status</td>
                        <td style="padding: 16px 0; color: #10B981; text-align: right; font-weight: 800; border-top: 1px solid #F1F5F9;">Sukses ✅</td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 0 0 0; color: #64748B; font-weight: 500; border-top: 1px solid #F1F5F9;">Ref ID</td>
                        <td style="padding: 20px 0 0 0; text-align: right; border-top: 1px solid #F1F5F9;">
                          <span style="font-family: 'Courier New', Courier, monospace; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 700; color: #475569; letter-spacing: 0.5px;">
                            ${refId}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </div>

                </div>

                <!-- Footer Pesan Semangat -->
                <div style="text-align: center; margin-top: 35px; color: #94A3B8; font-size: 13px; line-height: 1.6;">
                  <p style="margin: 0 0 10px 0;">Terus semangat pantau keuanganmu biar target impian cepat tercapai! 💪</p>
                  <p style="margin: 0;">Dikirim dengan ❤️ oleh <strong>My Dompet Digital</strong><br><a href="https://mydompetdigital.my.id" style="color: #3B82F6; text-decoration: none; font-weight: 600;">mydompetdigital.my.id</a></p>
                </div>

              </div>
              
            </body>
            </html>
          `,
    });

    if (error) {
      console.error("🔥 ERROR DARI RESEND:", error);
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Internal Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}