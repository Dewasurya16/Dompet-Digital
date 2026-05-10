import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, title, amount, type, category, wallet, refId, date, latitude, longitude } = body;

    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    const usernameRaw = email.split('@')[0];
    const displayName = usernameRaw.charAt(0).toUpperCase() + usernameRaw.slice(1);
    const isIncome = type === 'pemasukan';

    const darkTeal = '#0B3E3A';
    const mainBg = isIncome ? '#A7F3D0' : '#FECDD3';
    const amountColor = isIncome ? '#10B981' : '#F43F5E';
    const iconSymbol = isIncome ? '↙ PEMASUKAN' : '↗ PENGELUARAN';

    const friendlyMessage = isIncome
      ? 'Wah, alhamdulillah ada dana masuk nih! Asik, saldo nambah makin tebal. 🎉'
      : 'Catatan pengeluaranmu sudah kami simpan. Tetap bijak berbelanja ya! 💸';

    const locationRow = (latitude && longitude) ? `
      <tr>
        <td style="padding: 16px 0; color: ${darkTeal}; font-weight: 800; border-top: 3px dashed ${darkTeal}40; text-transform: uppercase;">Lokasi</td>
        <td style="padding: 16px 0; text-align: right; border-top: 3px dashed ${darkTeal}40;">
          <a href="https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}" style="background-color: #BAE6FD; color: ${darkTeal}; text-decoration: none; padding: 6px 12px; border: 3px solid ${darkTeal}; border-radius: 8px; font-weight: 900; font-size: 12px; box-shadow: 2px 2px 0 0 ${darkTeal}; display: inline-block;">📍 BUKA PETA</a>
        </td>
      </tr>
    ` : '';

    const { data, error } = await resend.emails.send({
      from: 'Dompet Digital <no-reply@mydompetdigital.my.id>',
      to: [email],
      subject: `[STRUK] ${title} - ${formattedAmount}`,
      html: `
            <!DOCTYPE html>
            <html lang="id">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Arial Black', Impact, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FDFBF7; margin: 0; padding: 40px 15px; color: ${darkTeal};">
              
              <div style="max-width: 400px; margin: 0 auto;">
                
                <!-- LOGO HEADER -->
                <div style="text-align: center; margin-bottom: 20px;">
                  <div style="display:inline-block; background:#FFFFFF; border: 3px solid ${darkTeal}; border-radius: 16px; box-shadow: 4px 4px 0 0 ${darkTeal}; padding: 10px 14px; margin-bottom:6px;">
                    <span style="font-size: 36px; line-height: 1;">💳</span>
                  </div>
                  <div style="font-size: 22px; font-weight: 900; color: ${darkTeal}; letter-spacing: -0.5px;">Dompet<span style="color: #10B981;">.</span></div>
                </div>

                <div style="text-align: center; margin-bottom: 24px;">
                  <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">
                    HALOO, ${displayName}! 👋
                  </h2>
                  <p style="margin: 0; font-family: sans-serif; font-size: 14px; font-weight: bold; line-height: 1.6; opacity: 0.8;">
                    ${friendlyMessage}
                  </p>
                </div>

                <div style="background: #FFFFFF; border-radius: 16px; border: 4px solid ${darkTeal}; box-shadow: 8px 8px 0 0 ${darkTeal}; overflow: hidden;">
                  
                  <div style="padding: 30px 20px; text-align: center; background-color: ${mainBg}; border-bottom: 4px solid ${darkTeal};">
                    
                    <div style="display: inline-block; padding: 6px 12px; background-color: #FFFFFF; border: 3px solid ${darkTeal}; border-radius: 12px; color: ${darkTeal}; font-size: 12px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; box-shadow: 2px 2px 0 0 ${darkTeal};">
                      ${iconSymbol}
                    </div>
                    
                    <h1 style="margin: 0; color: ${amountColor}; font-size: 38px; font-weight: 900; letter-spacing: -1px; text-shadow: 2px 2px 0px ${darkTeal};">
                      ${formattedAmount}
                    </h1>
                    
                    <p style="margin: 12px 0 0 0; color: ${darkTeal}; font-family: sans-serif; font-size: 13px; font-weight: 800;">
                      ${date}
                    </p>
                  </div>

                  <div style="padding: 24px; background-color: #FFFFFF; font-family: sans-serif;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                      <tr>
                        <td style="padding: 0 0 16px 0; color: ${darkTeal}; font-weight: 800; text-transform: uppercase; opacity: 0.7;">Keterangan</td>
                        <td style="padding: 0 0 16px 0; color: ${darkTeal}; text-align: right; font-weight: 900; text-transform: uppercase;">${title}</td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0; color: ${darkTeal}; font-weight: 800; border-top: 3px dashed ${darkTeal}40; text-transform: uppercase; opacity: 0.7;">Kategori</td>
                        <td style="padding: 16px 0; color: ${darkTeal}; text-align: right; font-weight: 900; border-top: 3px dashed ${darkTeal}40; text-transform: uppercase;">
                          <span style="background-color: #FDE68A; padding: 4px 8px; border: 2px solid ${darkTeal}; border-radius: 6px;">${category}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0; color: ${darkTeal}; font-weight: 800; border-top: 3px dashed ${darkTeal}40; text-transform: uppercase; opacity: 0.7;">Sumber Dana</td>
                        <td style="padding: 16px 0; color: ${darkTeal}; text-align: right; font-weight: 900; border-top: 3px dashed ${darkTeal}40; text-transform: uppercase;">${wallet}</td>
                      </tr>
                      
                      ${locationRow}

                      <tr>
                        <td style="padding: 20px 0 0 0; color: ${darkTeal}; font-weight: 800; border-top: 3px dashed ${darkTeal}40; text-transform: uppercase; opacity: 0.7;">Ref ID</td>
                        <td style="padding: 20px 0 0 0; text-align: right; border-top: 3px dashed ${darkTeal}40;">
                          <span style="font-family: 'Courier New', Courier, monospace; background: #F0EEE4; border: 2px solid ${darkTeal}; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 900; color: ${darkTeal};">
                            ${refId.split('-')[0].toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </div>

                </div>

                <div style="text-align: center; margin-top: 30px; font-family: sans-serif; font-size: 12px; font-weight: bold; color: ${darkTeal}; opacity: 0.7;">
                  <p style="margin: 0 0 8px 0;">TERUS PANTAU KEUANGANMU BIAR MAKIN SULTAN! 👑</p>
                  <p style="margin: 0;">Dikirim dengan ⚡ oleh <a href="https://mydompetdigital.my.id" style="color: ${darkTeal}; text-decoration: underline; font-weight: 900;">Dompet Digital</a></p>
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