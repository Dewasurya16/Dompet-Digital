// app/api/scan-receipt/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const { imageBase64 } = await req.json();
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        // Menggunakan model Flash yang super cepat
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Kamu adalah asisten keuangan pintar. Analisis struk belanja ini. 
        Ekstrak informasi dan kembalikan HANYA dalam format JSON persis seperti ini:
        {
          "title": "Nama Toko / Barang",
          "amount": 150000,
          "category": "Makanan" 
        }
        Kategori wajib pilih salah satu: Makanan, Transportasi, Tagihan, Belanja, Hiburan, Lainnya.
        Jangan tulis penjelasan apa pun, hanya output JSON murni.`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
        ]);

        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return NextResponse.json(JSON.parse(jsonMatch[0]));
        } else {
            return NextResponse.json({ error: "Gagal memparsing struk" }, { status: 400 });
        }
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}