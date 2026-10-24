import { ImageResponse } from "next/og";

export const alt = "Psy Manager — Gestão para psicólogos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(145deg, #f4f7f4 0%, #e8efe9 45%, #d4e4d6 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#3d5240",
            }}
          />
          <span style={{ fontSize: 36, fontWeight: 600, color: "#3d5240" }}>Psy Manager</span>
        </div>
        <p style={{ fontSize: 52, fontWeight: 600, color: "#2a3a2c", lineHeight: 1.15, maxWidth: 900 }}>
          Agenda, pacientes e financeiro para o consultório de psicologia
        </p>
        <p style={{ marginTop: 28, fontSize: 26, color: "#5c6b5e", maxWidth: 820 }}>
          Um painel profissional para quem atende — com conta própria e dados do seu trabalho.
        </p>
      </div>
    ),
    { ...size }
  );
}
