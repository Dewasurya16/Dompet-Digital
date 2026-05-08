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

    const isIncome = type === 'pemasukan';
    // Tema Warna: Emerald untuk Pemasukan, Rose/Merah untuk Pengeluaran
    const themeColor = isIncome ? '#10B981' : '#F43F5E';
    const iconSymbol = isIncome ? '↓' : '↑';
    const typeText = isIncome ? 'Pemasukan' : 'Pengeluaran';

    const { data, error } = await resend.emails.send({
      // MENGGUNAKAN DOMAIN BARUMU YANG SUDAH VERIFIED
      from: 'My Dompet Digital <no-reply@mydompetdigital.my.id>',
      // Mengirim dinamis ke email user yang sedang login
      to: [email],
      subject: `[Berhasil] Struk ${typeText} - ${formattedAmount}`,
      html: `
            <!DOCTYPE html>
            <html lang="id">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F1F5F9; margin: 0; padding: 40px 15px; -webkit-font-smoothing: antialiased;">
              
              <div style="max-width: 420px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);">
                
                <!-- Header Berwarna -->
                <div style="background-color: ${themeColor}; padding: 35px 20px 25px; text-align: center;">
                  <div style="width: 54px; height: 54px; background-color: #FFFFFF; border-radius: 50%; margin: 0 auto 15px; display: inline-block; line-height: 54px;">
                    <span style="color: ${themeColor}; font-size: 26px; font-weight: 900;">${iconSymbol}</span>
                  </div>
                  <h2 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">Transaksi Sukses</h2>
                  <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 500;">${date}</p>
                </div>
                
                <div style="padding: 30px 25px;">
                  
                  <!-- Nominal -->
                  <div style="text-align: center; margin-bottom: 25px;">
                    <p style="margin: 0 0 5px 0; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Total ${typeText}</p>
                    <h1 style="margin: 0; color: #0F172A; font-size: 38px; font-weight: 900; letter-spacing: -1px;">${formattedAmount}</h1>
                  </div>

                  <!-- Kotak Rincian (Card in Card) -->
                  <div style="background-color: #F8FAFC; border-radius: 16px; padding: 20px; border: 1px solid #E2E8F0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <tr>
                        <td style="padding: 0 0 14px 0; color: #64748B; font-weight: 500; width: 40%;">Keterangan</td>
                        <td style="padding: 0 0 14px 0; color: #0F172A; text-align: right; font-weight: 700;">${title}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0; color: #64748B; font-weight: 500; border-top: 1px dashed #CBD5E1;">Kategori</td>
                        <td style="padding: 14px 0; color: #0F172A; text-align: right; font-weight: 700; border-top: 1px dashed #CBD5E1;">${category}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0; color: #64748B; font-weight: 500; border-top: 1px dashed #CBD5E1;">Sumber Dana</td>
                        <td style="padding: 14px 0; color: #3B82F6; text-align: right; font-weight: 700; border-top: 1px dashed #CBD5E1;">${wallet}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0; color: #64748B; font-weight: 500; border-top: 1px dashed #CBD5E1;">Status</td>
                        <td style="padding: 14px 0; color: #10B981; text-align: right; font-weight: 700; border-top: 1px dashed #CBD5E1;">Berhasil <span style="font-size: 12px;">✅</span></td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0 0 0; color: #64748B; font-weight: 500; border-top: 1px dashed #CBD5E1;">Ref ID</td>
                        <td style="padding: 14px 0 0 0; color: #0F172A; text-align: right; border-top: 1px dashed #CBD5E1;">
                          <span style="font-family: monospace; background: #E2E8F0; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; color: #334155;">${refId}</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                </div>
                
                <!-- Footer Aplikasi -->
                <div style="background-color: #F8FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
                  <p style="margin: 0; color: #334155; font-size: 13px; font-weight: 700;">
                    👛 My Dompet Digital
                  </p>
                  <p style="margin: 5px 0 0 0; color: #94A3B8; font-size: 11px;">
                    Simpan struk ini sebagai bukti transaksi yang sah.<br>Sistem otomatis oleh Resend.
                  </p>
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