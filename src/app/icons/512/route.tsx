import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0ea5e9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "42%",
            height: "42%",
            borderRadius: "50%",
            background: "white",
            display: "flex",
          }}
        />
      </div>
    ),
    { width: 512, height: 512 }
  );
}
