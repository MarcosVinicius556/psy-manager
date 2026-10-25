import type { AnimationEvent } from "react";

const skin = { base: "#e8c4a0", mid: "#d9ad84", shade: "#c9956a" };
const hair = { dark: "#3d2a20", mid: "#4a3326", light: "#5c4033" };
const beard = { base: "#6b4e3a", mid: "#7a5a42", light: "#8a684c" };
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
          <stop offset="45%" stopColor={stone.light} />
          <stop offset="100%" stopColor={stone.mid} />
        </linearGradient>
      </defs>

      <line x1="20" y1="300" x2="480" y2="300" stroke="var(--color-border-subtle)" strokeWidth="2.5" />

      <ellipse className="cave-404__shadow" cx="250" cy="304" rx="58" ry="11" fill="var(--color-teal)" opacity="0.2" />

      <g className="cave-404__ground-cable" aria-hidden="true">
        <path
          d="M62 300 C82 300 98 292 112 282 C126 272 140 264 156 256 C172 248 190 242 208 236 C222 232 236 230 248 228"
          fill="none"
          stroke={cable}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M248 228 C262 230 276 234 292 240 C308 246 324 254 340 264 C356 274 372 286 388 300"
          fill="none"
          stroke={cable}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M46 300 C58 292 70 280 80 268 C88 258 94 250 100 244"
          fill="none"
          stroke={cable}
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <g transform="translate(54 297)">
          <rect x="0" y="3" width="14" height="10" rx="1.5" fill={cable} />
          <rect x="-7" y="1" width="5" height="6" rx="0.8" fill={cable} />
          <rect x="-7" y="9" width="5" height="6" rx="0.8" fill={cable} />
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
          d="M354 300 C354 300 350 210 362 148 C372 96 398 72 420 88 C442 104 452 148 448 210 C446 260 444 300 444 300 L354 300 Z"
          fill="url(#c404-menhir)"
        />
        <path
          d="M368 300 C368 300 366 220 374 158 C380 118 398 100 416 112 C434 124 440 168 438 220 C436 268 434 300 434 300 L368 300 Z"
          fill={stone.light}
          opacity="0.4"
        />
      </g>

      <g className="cave-404__figure" onAnimationEnd={onFigureAnimationEnd}>
        <g className="cave-404__leg-left">
          <path d="M230 214 L218 300 L242 300 L248 214 Z" fill={skin.mid} />
          <path d="M236 214 L230 268 L240 268 Z" fill={skin.shade} opacity="0.32" />
          <path d="M214 296 Q230 290 246 296 Q242 304 228 304 Q214 304 214 296 Z" fill={skin.base} />
        </g>
        <g className="cave-404__leg-right">
          <path d="M270 214 L282 300 L258 300 L252 214 Z" fill={skin.mid} />
          <path d="M264 214 L270 268 L260 268 Z" fill={skin.shade} opacity="0.32" />
          <path d="M254 296 Q270 290 286 296 Q282 304 268 304 Q254 304 254 296 Z" fill={skin.base} />
        </g>

        <path d="M208 168 L226 148 L240 144 L240 182 L222 200 L204 192 Z" fill={skin.base} />
        <path d="M216 148 L226 168 L234 180 L220 188 Z" fill={skin.shade} opacity="0.25" />

        <path
          d="M240 144 L266 138 L306 148 L316 166 L310 218 L296 232 L250 228 L230 212 L222 172 L240 144 Z"
          fill={tunic.base}
        />
        <path
          d="M244 144 L266 138 L306 148 L316 166 L306 204 L282 214 L254 208 L234 192 L240 144 Z"
          fill={tunic.deep}
          opacity="0.26"
        />
        <path
          d="M306 148 L316 166 L312 178 L298 168 L286 158 L276 150 Z"
          fill={tunic.deep}
          opacity="0.35"
        />
        <path
          d="M230 212 L246 228 L294 230 L310 218 L302 206 L282 214 L254 218 L236 212 Z"
          fill="none"
          stroke={tunic.hem}
          strokeWidth="2.5"
        />
        <path
          d="M236 212 L242 224 L252 218 L262 228 L272 218 L282 224 L302 206 L310 218 L294 232 L246 228 L230 212 Z"
          fill={tunic.base}
        />
        <ellipse cx="270" cy="178" rx="6" ry="4.5" fill={tunic.spot} />
        <ellipse cx="294" cy="192" rx="5.5" ry="4" fill={tunic.spot} opacity="0.92" />
        <ellipse cx="278" cy="206" rx="5" ry="3.8" fill={tunic.spot} opacity="0.88" />
        <ellipse cx="258" cy="188" rx="4.5" ry="3.5" fill={tunic.spot} opacity="0.85" />
        <ellipse cx="282" cy="168" rx="4" ry="3.2" fill={tunic.spot} opacity="0.8" />
        <ellipse cx="248" cy="200" rx="4" ry="3.2" fill={tunic.spot} opacity="0.78" />
        <ellipse cx="268" cy="214" rx="3.8" ry="3" fill={tunic.spot} opacity="0.75" />

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

        <ellipse cx="250" cy="108" rx="32" ry="28" fill={skin.base} />
        <path d="M236 100 L246 94 L254 94 L264 100" stroke={hair.dark} strokeWidth="6.5" fill="none" strokeLinecap="round" />
        <circle cx="242" cy="104" r="3.5" fill="#243028" />
        <circle cx="258" cy="104" r="3.5" fill="#243028" />
        <ellipse cx="250" cy="116" rx="10" ry="11" fill={skin.shade} opacity="0.5" />
        <path d="M238 112 Q250 108 262 112" stroke={beard.light} strokeWidth="3.2" fill="none" strokeLinecap="round" />

        <path
          d="M232 122 Q250 116 268 122 Q274 128 272 136 Q268 142 250 144 Q232 142 228 136 Q226 128 232 122 Z"
          fill={beard.mid}
        />
        <path
          d="M228 138 Q246 132 272 138 Q278 146 274 156 Q268 166 250 170 Q232 166 226 156 Q222 146 228 138 Z"
          fill={beard.base}
        />
        <path
          d="M226 156 L234 162 L242 158 L250 164 L258 158 L266 162 L274 156 L268 168 L258 172 L250 174 L242 172 L232 168 L226 156 Z"
          fill={beard.mid}
        />

        <g className="cave-404__arm-left">
          <path d="M228 168 L218 188 L224 202 L238 198 L244 178 Z" fill={skin.base} />
          <ellipse cx="222" cy="204" rx="10" ry="9" fill={skin.base} />
        </g>
        <g className="cave-404__arm-right">
          <path d="M272 166 L282 186 L276 202 L262 198 L256 176 Z" fill={skin.base} />
          <ellipse cx="278" cy="204" rx="10" ry="9" fill={skin.base} />
        </g>

        <path
          d="M248 228 C244 228 242 232 242 238 C242 244 246 248 252 248 C258 248 262 244 262 238 C262 232 260 228 256 228 C254 228 252 228 248 228 Z"
          fill="none"
          stroke={cable}
          strokeWidth="5.5"
          strokeLinecap="round"
        />

        <path
          d="M228 202 Q250 210 272 202"
          fill="none"
          stroke={cable}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <ellipse cx="228" cy="202" rx="7" ry="6" fill={skin.base} />
        <ellipse cx="272" cy="202" rx="7" ry="6" fill={skin.base} />

        <g className="cave-404__lasso">
          <path
            d="M272 202 L286 218"
            fill="none"
            stroke={cable}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <ellipse
            cx="312"
            cy="248"
            rx="34"
            ry="22"
            fill="none"
            stroke={cable}
            strokeWidth="6"
          />
        </g>
      </g>
    </>
  );
}
