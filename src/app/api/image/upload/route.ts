import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    if (
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
      !process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json({ error: "Cloudinary não está configurado." }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const { searchParams } = new URL(req.url);
    const folder = (searchParams.get("folder") ?? "avatars").replace(/[^a-zA-Z0-9/_-]/g, "") || "avatars";
    const accept = searchParams.get("accept") === "documento" ? "documento" : searchParams.get("accept") === "foto" ? "foto" : "imagem";
    const isPdf = file instanceof File && (file.type === "application/pdf" || file.type === "application/x-pdf" || file.name.toLowerCase().endsWith(".pdf"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 400 });
    }
    if (accept === "documento") {
      if (!file.type.startsWith("image/") && !isPdf) {
        return NextResponse.json({ error: "Esse tipo de arquivo não é aceito. Envie uma imagem ou um PDF." }, { status: 400 });
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "O arquivo precisa ter no máximo 10 MB." }, { status: 400 });
      }
    } else if (accept === "foto") {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type === "image/jpg" ? "image/jpeg" : file.type)) {
        return NextResponse.json({ error: "Esse tipo de arquivo não é aceito. A foto precisa ser PNG, JPG ou WebP." }, { status: 400 });
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "A foto precisa ter no máximo 5 MB." }, { status: 400 });
      }
    } else {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Escolha uma imagem." }, { status: 400 });
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "A foto precisa ter no máximo 5 MB." }, { status: 400 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (isPdf && buffer.subarray(0, 5).toString() !== "%PDF-") {
      return NextResponse.json({ error: "O arquivo gerado não é um PDF válido." }, { status: 400 });
    }
    const pdfName = file.name.replace(/\.pdf$/i, "").replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-|-$/g, "") || "documento";
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        isPdf
          ? {
              folder,
              resource_type: "raw",
              type: "upload",
              public_id: `${pdfName}-${Date.now()}.pdf`,
              overwrite: false,
            }
          : {
              folder,
              resource_type: "image",
              transformation: [
                {
                  quality: "auto:good",
                  fetch_format: "auto",
                  width: accept === "documento" ? 2000 : 800,
                  crop: "limit",
                },
              ],
            },
        (error, uploaded) => {
          if (error || !uploaded) return reject(error ?? new Error("Não foi possível enviar o arquivo."));
          resolve({ secure_url: (uploaded as { secure_url?: string }).secure_url || "" });
        }
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });

    return NextResponse.json({ url: result.secure_url }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível enviar o arquivo.";
    console.error("Erro ao enviar imagem:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
