export default function Avatar({
  name,
  src,
  size = 40,
  light = false,
}: {
  name: string;
  src?: string | null;
  size?: number;
  light?: boolean;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

  const frame = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: "50%",
  };

  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="block shrink-0 object-cover"
        style={frame}
      />
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center font-sans text-sm font-semibold ${light ? "bg-white/15 text-white" : "bg-teal text-white"}`}
      style={frame}
    >
      {initials}
    </span>
  );
}
