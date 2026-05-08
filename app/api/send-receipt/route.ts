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
        // Warna tema: Hijau (Emerald) untuk masuk, Merah (Rose) untuk keluar
        const themeColor = isIncome ? '#10B981' : '#F43F5E';
        const bgColor = isIncome ? '#ECFDF5' : '#FFF1F2'; // Warna super soft untuk icon
        const iconSymbol = isIncome ? '↓' : '↑';
        const typeText = isIncome ? 'Pemasukan' : 'Pengeluaran';

        const { data, error } = await resend.emails.send({
            from: 'Dompet Pintar <onboarding@resend.dev>', // Nanti ganti dengan domainmu jika ada
            to: ['kejarisoppengpembinaan@gmail.com'],
            subject: `Struk ${typeText}: ${title}`,
            html: `
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #F8FAFC;
              margin: 0;
              padding: 40px 20px;
              -webkit-font-smoothing: antialiased;
            }
            .wrapper {
              max-width: 420px;
              margin: 0 auto;
              background: #FFFFFF;
              border-radius: 24px;
              overflow: hidden;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
              border: 1px solid #F1F5F9;
            }
            .header-top {
              height: 6px;
              background: ${themeColor};
              width: 100%;
            }
            .content {
              padding: 40px 32px 32px 32px;
            }
            .icon-container {
              width: 60px;
              height: 60px;
              background-color: ${bgColor};
              border-radius: 20px;
              margin: 0 auto 24px;
            }
            .icon {
              color: ${themeColor};
              font-size: 28px;
              font-weight: 800;
              line-height: 60px;
              text-align: center;
              width: 100%;
            }
            .title-area {
              text-align: center;
              margin-bottom: 32px;
            }
            .title-text {
              margin: 0;
              color: #0F172A;
              font-size: 20px;
              font-weight: 800;
              letter-spacing: -0.5px;
            }
            .date-text {
              margin: 6px 0 0 0;
              color: #64748B;
              font-size: 13px;
              font-weight: 500;
            }
            .amount-area {
              text-align: center;
              padding: 24px 0;
              border-top: 1px dashed #CBD5E1;
              border-bottom: 1px dashed #CBD5E1;
              margin-bottom: 32px;
              background-color: #FAFAF9;
              border-radius: 16px;
            }
            .amount-label {
              font-size: 11px;
              color: #64748B;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              font-weight: 700;
              margin-bottom: 8px;
              display: block;
            }
            .amount-value {
              margin: 0;
              color: ${themeColor};
              font-size: 36px;
              font-weight: 900;
              letter-spacing: -1px;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
            }
            .details-table td {
              padding: 14px 0;
              border-bottom: 1px solid #F1F5F9;
            }
            .details-table tr:last-child td {
              border-bottom: none;
            }
            .td-label {
              color: #64748B;
              font-size: 14px;
              width: 40%;
              font-weight: 500;
            }
            .td-value {
              color: #0F172A;
              font-size: 14px;
              font-weight: 700;
              text-align: right;
            }
            .ref-box {
              background-color: #F1F5F9;
              padding: 6px 10px;
              border-radius: 8px;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: 12px;
              color: #334155;
              letter-spacing: 1px;
            }
            .footer {
              text-align: center;
              padding: 32px 20px;
              color: #94A3B8;
              font-size: 12px;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header-top"></div>
            
            <div class="content">
              <div class="icon-container">
                <div class="icon">${iconSymbol}</div>
              </div>

              <div class="title-area">
                <h2 class="title-text">Transaksi Berhasil</h2>
                <p class="date-text">${date}</p>
              </div>

              <div class="amount-area">
                <span class="amount-label">Total ${typeText}</span>
                <h1 class="amount-value">${isIncome ? '+' : '-'}${formattedAmount}</h1>
              </div>

              <table class="details-table">
                <tr>
                  <td class="td-label">Keterangan</td>
                  <td class="td-value">${title}</td>
                </tr>
                <tr>
                  <td class="td-label">Kategori</td>
                  <td class="td-value">${category}</td>
                </tr>
                <tr>
                  <td class="td-label">Sumber Dana</td>
                  <td class="td-value" style="color: #3B82F6;">${wallet}</td>
                </tr>
                <tr>
                  <td class="td-label">Status</td>
                  <td class="td-value" style="color: #10B981;">Berhasil ✓</td>
                </tr>
                <tr>
                  <td class="td-label" style="padding-top: 16px;">Ref ID</td>
                  <td class="td-value" style="padding-top: 16px;"><span class="ref-box">${refId}</span></td>
                </tr>
              </table>

            </div>
          </div>
          
          <div class="footer">
            Email ini dikirim otomatis oleh sistem <strong>Dompet Pintar</strong>.<br>
            Harap tidak membalas email ini.
          </div>
        </body>
        </html>
      `,
        });

        if (error) return NextResponse.json({ error }, { status: 400 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}