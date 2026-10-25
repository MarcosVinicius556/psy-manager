import type { AnimationEvent } from "react";

const skin = { base: "#e8c4a0", mid: "#d9ad84", shade: "#c9956a" };
const hair = { dark: "#3d2a20", mid: "#4a3326", light: "#5c4033" };
const tunic = { base: "#d4845c", deep: "#c47a5a", spot: "#5c3828", hem: "#b86a48" };
const stone = { light: "#e8ece6", mid: "#d0d8d0", shade: "#b8c4ba" };
const cable = "#1a1a1a";

type ArtProps = {
  onFigureAnimationEnd?: (event: AnimationEvent) => void;
};

export function Caveman404Art({ onFigureAnimationEnd }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id="c404-menhir" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={stone.shade} />
          <stop offset="40%" stopColor={stone.light} />
          <stop offset="100%" stopColor={stone.mid} />
        </linearGradient>
      </defs>

      <line x1="20" y1="300" x2="480" y2="300" stroke="var(--color-border-subtle)" strokeWidth="2.5" />

      <ellipse className="cave-404__shadow" cx="248" cy="304" rx="58" ry="11" fill="var(--color-teal)" opacity="0.2" />

      <g className="cave-404__ground-cable" aria-hidden="true">
        <path
          d="M68 300 C88 300 104 292 118 282 C132 272 146 264 162 256 C178 248 196 242 214 238 C228 234 240 232 248 230"
          fill="none"
          stroke={cable}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M248 230 C262 232 276 236 292 242 C308 248 324 256 340 266 C356 276 372 288 388 300"
          fill="none"
          stroke={cable}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M52 300 C64 290 76 276 86 262 C94 252 100 244 106 236"
          fill="none"
          stroke={cable}
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <path
          d="M404 300 C392 290 380 276 370 262 C362 252 356 244 350 236"
          fill="none"
          stroke={cable}
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <g transform="translate(48 288)">
          <rect x="0" y="8" width="18" height="12" rx="2" fill={cable} />
          <rect x="3" y="0" width="4.5" height="7" rx="1" fill={cable} />
          <rect x="10.5" y="0" width="4.5" height="7" rx="1" fill={cable} />
        </g>
      </g>

      <g aria-hidden="true">
        <ellipse cx="88" cy="296" rx="22" ry="7" fill="var(--color-sage-light)" opacity="0.95" />
        <ellipse cx="106" cy="294" rx="16" ry="6" fill="#9fc49a" opacity="0.85" />
        <ellipse cx="82" cy="290" rx="12" ry="9" fill="#8db48c" opacity="0.8" />
        <ellipse cx="102" cy="276" rx="44" ry="15" fill={stone.mid} />
        <ellipse cx="98" cy="256" rx="38" ry="14" fill={stone.light} />
        <ellipse cx="94" cy="236" rx="30" ry="13" fill={stone.light} />
        <path d="M84 236 Q94 228 104 236 Q98 244 88 244 Q80 242 84 236 Z" fill={stone.shade} opacity="0.35" />

        <ellipse cx="412" cy="296" rx="20" ry="7" fill="var(--color-sage-light)" opacity="0.95" />
        <ellipse cx="430" cy="294" rx="14" ry="6" fill="#9fc49a" opacity="0.85" />
        <ellipse cx="388" cy="290" rx="14" ry="12" fill={stone.mid} />
        <path
          d="M368 300 L368 72 Q368 48 404 48 Q440 48 440 72 L440 300 Z"
          fill="url(#c404-menhir)"
        />
        <path
          d="M382 300 L382 92 Q382 68 404 68 Q426 68 426 92 L426 300 Z"
          fill={stone.light}
          opacity="0.42"
        />
      </g>

      <g className="cave-404__figure" onAnimationEnd={onFigureAnimationEnd}>
        <g className="cave-404__leg-left">
          <path d="M228 214 L218 300 L242 300 L248 214 Z" fill={skin.mid} />
          <path d="M234 214 L228 268 L238 268 Z" fill={skin.shade} opacity="0.32" />
          <path d="M214 296 Q230 290 246 296 Q242 304 228 304 Q214 304 214 296 Z" fill={skin.base} />
        </g>
        <g className="cave-404__leg-right">
          <path d="M268 214 L278 300 L254 300 L248 214 Z" fill={skin.mid} />
          <path d="M262 214 L268 268 L258 268 Z" fill={skin.shade} opacity="0.32" />
          <path d="M250 296 Q266 290 282 296 Q278 304 264 304 Q250 304 250 296 Z" fill={skin.base} />
        </g>

        <path d="M210 168 L228 148 L242 144 L242 182 L224 200 L206 192 Z" fill={skin.base} />
        <path d="M218 148 L228 168 L236 180 L222 188 Z" fill={skin.shade} opacity="0.25" />

        <path
          d="M242 144 L268 138 L308 148 L318 166 L312 218 L298 232 L252 228 L232 212 L224 172 L242 144 Z"
          fill={tunic.base}
        />
        <path
          d="M246 144 L268 138 L308 148 L318 166 L308 204 L284 214 L256 208 L236 192 L242 144 Z"
          fill={tunic.deep}
          opacity="0.26"
        />
        <path
          d="M232 212 L248 228 L296 230 L312 218 L304 206 L284 214 L256 218 L238 212 Z"
          fill="none"
          stroke={tunic.hem}
          strokeWidth="2.5"
        />
        <path
          d="M238 212 L244 224 L254 218 L264 228 L274 218 L284 224 L304 206 L312 218 L296 232 L248 228 L232 212 Z"
          fill={tunic.base}
        />
        <ellipse cx="272" cy="178" rx="6" ry="4.5" fill={tunic.spot} />
        <ellipse cx="296" cy="192" rx="5.5" ry="4" fill={tunic.spot} opacity="0.92" />
        <ellipse cx="280" cy="206" rx="5" ry="3.8" fill={tunic.spot} opacity="0.88" />
        <ellipse cx="304" cy="168" rx="4.5" ry="3.5" fill={tunic.spot} opacity="0.85" />
        <ellipse cx="262" cy="198" rx="4" ry="3.2" fill={tunic.spot} opacity="0.8" />

        <path
          d="M208 92 C214 62 240 48 270 52 C298 56 318 76 322 104 C324 124 318 140 304 148 C286 156 262 154 246 142 C228 128 220 110 216 96 C214 92 208 92 208 92 Z"
          fill={hair.dark}
        />
        <path
          d="M214 100 C222 78 246 66 272 70 C294 74 310 92 312 116 C314 134 308 148 294 154 C276 160 256 158 242 148 C228 138 222 122 218 108 C216 104 214 100 214 100 Z"
          fill={hair.mid}
        />
        <ellipse cx="236" cy="88" rx="18" ry="14" fill={hair.light} opacity="0.45" />
        <ellipse cx="268" cy="78" rx="22" ry="16" fill={hair.light} opacity="0.4" />
        <ellipse cx="296" cy="92" rx="16" ry="13" fill={hair.light} opacity="0.42" />
        <path
          d="M204 112 C212 104 222 102 230 108 C222 114 216 122 214 130 C210 122 206 116 204 112 Z"
          fill={hair.mid}
        />
        <path
          d="M312 110 C320 102 330 102 336 110 C332 116 326 124 322 132 C320 122 316 116 312 110 Z"
          fill={hair.mid}
        />
        <path
          d="M222 118 C228 112 236 114 240 120 C234 126 228 132 224 138 C220 132 218 126 222 118 Z"
          fill={hair.light}
          opacity="0.55"
        />

        <ellipse cx="248" cy="108" rx="32" ry="28" fill={skin.base} />
        <path d="M234 100 L244 94 L252 94 L262 100" stroke={hair.dark} strokeWidth="6.5" fill="none" strokeLinecap="round" />
        <circle cx="240" cy="104" r="3.5" fill="#243028" />
        <circle cx="256" cy="104" r="3.5" fill="#243028" />
        <ellipse cx="248" cy="116" rx="10" ry="11" fill={skin.shade} opacity="0.5" />
        <path d="M236 112 Q248 108 260 112" stroke={hair.light} strokeWidth="3.2" fill="none" strokeLinecap="round" />

        <path
          d="M222 126 C212 152 210 182 218 208 C226 228 238 236 248 234 C258 232 268 220 274 194 C280 168 278 142 268 124 C260 112 248 110 236 114 C228 118 222 126 222 126 Z"
          fill={hair.mid}
        />
        <path
          d="M226 134 C218 156 218 180 224 202 C230 218 240 224 248 222 C256 220 264 208 268 186 C272 164 270 144 262 130 C256 122 246 120 238 124 C232 128 226 134 226 134 Z"
          fill={hair.dark}
          opacity="0.58"
        />
        <path
          d="M230 138 C224 158 224 178 228 196 C232 210 240 214 246 212 C252 210 258 200 260 182 C262 164 260 148 254 138 C250 132 244 130 238 132 C234 134 230 138 230 138 Z"
          fill={hair.light}
          opacity="0.35"
        />

        <g className="cave-404__arm-left">
          <path d="M230 162 L208 178 L202 196 L224 190 L234 172 Z" fill={skin.base} />
          <ellipse cx="200" cy="198" rx="12" ry="10" fill={skin.base} />
        </g>
        <g className="cave-404__arm-right">
          <path d="M286 160 L308 174 L314 192 L292 186 L282 168 Z" fill={skin.base} />
          <ellipse cx="316" cy="194" rx="12" ry="10" fill={skin.base} />
        </g>

        <path
          d="M248 230 C242 230 238 234 236 242 C234 250 236 258 242 264 C248 270 256 272 264 268 C272 264 276 256 276 246 C276 236 272 228 264 224 C258 222 252 222 248 230 Z"
          fill="none"
          stroke={cable}
          strokeWidth="5.5"
          strokeLinecap="round"
        />

        <path
          d="M236 206 L252 212 L282 208"
          fill="none"
          stroke={cable}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <ellipse cx="236" cy="206" rx="7" ry="6" fill={skin.base} />
        <ellipse cx="282" cy="208" rx="7" ry="6" fill={skin.base} />

        <g className="cave-404__lasso">
          <path
            d="M282 208 L318 220 C334 228 338 244 328 256 C318 266 300 262 292 248 C286 238 284 224 282 208 Z"
            fill="none"
            stroke={cable}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M282 208 L302 218 L312 234 L306 248"
            fill="none"
            stroke={cable}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
      </g>
    </>
  );
}
