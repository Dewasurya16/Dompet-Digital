// app/api/scan-receipt/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const { imageBase64 } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "API Key belum dikonfigurasi" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Menggunakan model terbaru yang tersedia dari hasil debug kita
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const prompt = `Kamu adalah asisten keuangan pintar. Analisis struk belanja ini. 
        Ekstrak informasi dengan skema JSON berikut:
        {
          "title": "Nama Toko / Barang",
          "amount": 150000,
          "category": "Makanan" 
        }
        Catatan: Kategori WAJIB pilih salah satu: Makanan, Transportasi, Tagihan, Belanja, Hiburan, Lainnya.
        Pastikan amount berupa angka murni tanpa titik atau koma.`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
        ]);

        const jsonText = result.response.text();

        return NextResponse.json(JSON.parse(jsonText));

    } catch (e) {
        console.error("Gemini API Error:", e);
        return NextResponse.json({ error: "Gagal memproses gambar struk" }, { status: 500 });
    }
}