import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

// GET /api/qr?text=... -> a PNG QR code image encoding "text".
// Used both for the public RSVP-link QR (poster/WhatsApp) and for each
// attendee's individual check-in QR code.
export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text");
  if (!text) {
    return NextResponse.json({ error: "Missing 'text' query param." }, { status: 400 });
  }

  const buffer = await QRCode.toBuffer(text, {
    type: "png",
    width: 320,
    margin: 1,
    color: { dark: "#231a14", light: "#f3ead9" },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
