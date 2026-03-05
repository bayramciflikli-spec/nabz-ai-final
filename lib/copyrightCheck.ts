/**
 * NABZ-AI Telif Kontrolü Modülü
 * ACRCloud (audio/video) ve TinEye (image) entegrasyonu
 *
 * Ortam değişkenleri (.env.local):
 * - TINEYE_API_KEY: TinEye API anahtarı (görsel tarama)
 * - ACR_CLOUD_HOST: ACRCloud host (örn: identify-eu-west-1.acrcloud.com)
 * - ACR_CLOUD_ACCESS_KEY: ACRCloud access key
 * - ACR_CLOUD_ACCESS_SECRET: ACRCloud access secret
 */

export type CopyrightReport = "Clean" | "Flagged" | "Review";
export type CopyrightResult = {
  passed: boolean;
  ai_report: CopyrightReport;
  provider?: string;
  detail?: string;
};

const MAX_FETCH_SIZE = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT = 15000;

/** Görsel telif kontrolü - TinEye reverse image search */
export async function checkImageCopyright(imageUrl: string): Promise<CopyrightResult> {
  const apiKey = process.env.TINEYE_API_KEY;
  if (!apiKey) {
    return { passed: true, ai_report: "Clean", provider: "none" };
  }

  try {
    const TinEye = require("tineye-api");
    const api = new TinEye("https://api.tineye.com/rest/", apiKey);
    const res = await api.searchUrl(imageUrl, { limit: 20 });
    const total = res?.results?.total_results ?? 0;
    const matches = res?.results?.matches ?? [];

    // Eşleşme yok → temiz
    if (total === 0) {
      return { passed: true, ai_report: "Clean", provider: "tineye" };
    }

    // Stock/collection etiketli eşleşmeler telif riski
    const hasStock = matches.some((m: { tags?: string[] }) =>
      (m.tags || []).some((t) => t?.toLowerCase().includes("stock") || t?.toLowerCase().includes("collection"))
    );

    // Çok sayıda eşleşme veya stock etiketi → flag
    if (total >= 10 || hasStock) {
      return {
        passed: false,
        ai_report: "Flagged",
        provider: "tineye",
        detail: total >= 10 ? `${total} eşleşme bulundu` : "Stock/collection eşleşmesi",
      };
    }

    // Az eşleşme → manuel inceleme
    return {
      passed: true,
      ai_report: "Review",
      provider: "tineye",
      detail: `${total} eşleşme`,
    };
  } catch (err) {
    console.error("[copyrightCheck] TinEye error:", err);
    return { passed: true, ai_report: "Clean", provider: "tineye_error" };
  }
}

/** Ses/video telif kontrolü - ACRCloud Identification API */
export async function checkAudioVideoCopyright(mediaUrl: string): Promise<CopyrightResult> {
  const host = process.env.ACR_CLOUD_HOST;
  const accessKey = process.env.ACR_CLOUD_ACCESS_KEY;
  const accessSecret = process.env.ACR_CLOUD_ACCESS_SECRET;

  if (!host || !accessKey || !accessSecret) {
    return { passed: true, ai_report: "Clean", provider: "none" };
  }

  try {
    const buffer = await fetchMediaBuffer(mediaUrl);
    if (!buffer || buffer.length === 0) {
      return { passed: true, ai_report: "Clean", provider: "acrcloud_fetch_failed" };
    }

    const result = await acrCloudIdentify(buffer, host, accessKey, accessSecret);
    return result;
  } catch (err) {
    console.error("[copyrightCheck] ACRCloud error:", err);
    return { passed: true, ai_report: "Clean", provider: "acrcloud_error" };
  }
}

async function fetchMediaBuffer(url: string): Promise<Buffer | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "NABZ-AI-Copyright-Check/1.0" },
    });
    if (!res.ok) return null;
    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_FETCH_SIZE) {
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_FETCH_SIZE) return null;
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeout);
  }
}

async function acrCloudIdentify(
  data: Buffer,
  host: string,
  accessKey: string,
  accessSecret: string
): Promise<CopyrightResult> {
  const crypto = await import("crypto");
  const FormData = require("form-data");
  const httpMethod = "POST";
  const httpUri = "/v1/identify";
  const dataType = "audio";
  const sigVersion = "1";
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const stringToSign = [httpMethod, httpUri, accessKey, dataType, sigVersion, timestamp].join("\n");
  const signature = crypto
    .createHmac("sha1", accessSecret)
    .update(stringToSign)
    .digest("base64");

  const form = new FormData();
  form.append("sample", data, { filename: "sample.bin", contentType: "application/octet-stream" });
  form.append("sample_bytes", data.length.toString());
  form.append("access_key", accessKey);
  form.append("data_type", dataType);
  form.append("signature_version", sigVersion);
  form.append("signature", signature);
  form.append("timestamp", timestamp);

  const res = await fetch(`https://${host}${httpUri}`, {
    method: "POST",
    body: form as unknown as BodyInit,
    headers: form.getHeaders(),
  });

  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { passed: true, ai_report: "Clean", provider: "acrcloud" };
  }

  const status = json.status as { code?: number; msg?: string } | undefined;
  const music = json.music as Array<{ score?: number }> | undefined;
  const code = status?.code ?? -1;

  // 1001 = no match, 3000/3001 = service error → temiz kabul et
  if (code === 1001 || code === 3000 || code === 3001 || code >= 3002) {
    return { passed: true, ai_report: "Clean", provider: "acrcloud" };
  }

  // code 0 = eşleşme bulundu, skora bak
  const topMatch = music?.[0];
  const score = typeof topMatch?.score === "number" ? topMatch.score : 0;

  if (score >= 80) {
    return {
      passed: false,
      ai_report: "Flagged",
      provider: "acrcloud",
      detail: `Eşleşme skoru: ${score}%`,
    };
  }

  if (score >= 50) {
    return {
      passed: true,
      ai_report: "Review",
      provider: "acrcloud",
      detail: `Eşleşme skoru: ${score}%`,
    };
  }

  return { passed: true, ai_report: "Clean", provider: "acrcloud" };
}
