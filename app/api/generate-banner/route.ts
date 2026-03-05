import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAdminStorageInstance } from "@/lib/firebase-admin";
import { verifyApiAuth } from "@/lib/apiAuth";
import { sanitizeText, rateLimit, PROMPT_MAX_LENGTH } from "@/lib/security";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
  try {
    const auth = await verifyApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
    if (!rateLimit(`banner:${auth.uid}`) && !rateLimit(`banner:ip:${clientIp}`)) {
      return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
    }

    let body: { prompt?: string } = {};
    try {
      const raw = await req.text();
      if (raw?.trim()) body = JSON.parse(raw) as { prompt?: string };
    } catch {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }
    const rawPrompt = body?.prompt;
    if (!rawPrompt || typeof rawPrompt !== "string") {
      return NextResponse.json({ error: "Prompt gerekli" }, { status: 400 });
    }

    const prompt = sanitizeText(rawPrompt, PROMPT_MAX_LENGTH);
    if (!prompt) {
      return NextResponse.json({ error: "Geçerli bir prompt girin" }, { status: 400 });
    }

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY tanımlı değil. .env.local dosyasına ekleyin." },
        { status: 500 }
      );
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A high-resolution cinematic youtube channel banner about: ${prompt}. Wide landscape format, no text, artistic style.`,
      n: 1,
      size: "1792x1024",
    });

    const dallEUrl = response.data?.[0]?.url;
    if (!dallEUrl) {
      return NextResponse.json({ error: "Görsel üretilemedi" }, { status: 500 });
    }

    // Görseli indir
    const imageResponse = await fetch(dallEUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Görsel indirilemedi" },
        { status: 500 }
      );
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Firebase Storage'a yükle (kalıcı URL)
    const adminStorage = getAdminStorageInstance();
    const bucket = adminStorage.bucket();
    const fileName = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    const file = bucket.file(fileName);

    await file.save(imageBuffer, {
      metadata: { contentType: "image/png" },
    });

    await file.makePublic();

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return NextResponse.json({ imageUrl });
  } catch (error: unknown) {
    console.error("Generate banner error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Üretim hatası" },
      { status: 500 }
    );
  }
}
