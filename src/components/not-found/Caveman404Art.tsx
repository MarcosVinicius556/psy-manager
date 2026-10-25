import type { AnimationEvent } from "react";

/** Inline SVG artwork for the 404 caveman scene (original illustration). */

const skin = { base: "#e8c4a0", mid: "#d9ad84", shade: "#c9956a" };
const hair = { dark: "#3d2a20", mid: "#4f3628", light: "#5c4033" };
const tunic = { base: "#d4845c", deep: "#c47a5a", spot: "#5c3828", hem: "#b86a48" };
const stone = { light: "#e6ebe6", mid: "#cfd8d0", shade: "#b8c4ba" };
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

      <line x1="28" y1="268" x2="492" y2="268" stroke="var(--color-border-subtle)" strokeWidth="2.5" />

      <ellipse
        className="cave-404__shadow"
        cx="262"
        cy="272"
        rx="54"
        ry="10"
        fill="var(--color-teal)"
        opacity="0.2"
      />

      <g className="cave-404__ground-cable" aria-hidden="true">
        <path
          d="M96 268 C120 268 140 258 158 248 C176 238 196 232 216 226 C236 220 252 218 262 216"
          fill="none"
          stroke={cable}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M262 216 C272 218 288 220 308 226 C328 232 348 238 366 248 C384 258 404 268 428 268"
          fill="none"
          stroke={cable}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M82 268 C96 260 108 248 118 236 C126 226 132 220 138 214"
          fill="none"
          stroke={cable}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M442 268 C428 260 416 248 406 236 C398 226 392 220 386 214"
          fill="none"
          stroke={cable}
          strokeWidth="7"
          strokeLinecap="round"
        />
      </g>

      <g aria-hidden="true">
        <ellipse cx="92" cy="264" rx="20" ry="6" fill="var(--color-sage-light)" opacity="0.95" />
        <ellipse cx="108" cy="262" rx="14" ry="5" fill="#9fc49a" opacity="0.85" />
        <ellipse cx="86" cy="258" rx="11" ry="8" fill="#8db48c" opacity="0.75" />
        <ellipse cx="104" cy="248" rx="38" ry="13" fill={stone.mid} />
        <ellipse cx="100" cy="232" rx="32" ry="12" fill={stone.light} />
        <ellipse cx="96" cy="216" rx="26" ry="11" fill={stone.light} />
        <path d="M88 216 Q96 210 104 216 Q100 222 92 222 Q86 220 88 216 Z" fill={stone.shade} opacity="0.35" />

        <ellipse cx="418" cy="264" rx="18" ry="6" fill="var(--color-sage-light)" opacity="0.95" />
        <ellipse cx="434" cy="262" rx="12" ry="5" fill="#9fc49a" opacity="0.85" />
        <ellipse cx="392" cy="258" rx="16" ry="14" fill={stone.mid} />
        <path
          d="M378 268 L378 108 Q378 82 408 82 Q438 82 438 108 L438 268 Z"
          fill="url(#c404-menhir)"
        />
        <path
          d="M390 268 L390 122 Q390 100 408 100 Q426 100 426 122 L426 268 Z"
          fill={stone.light}
          opacity="0.45"
        />
      </g>

      <g className="cave-404__figure" onAnimationEnd={onFigureAnimationEnd}>
        <g className="cave-404__leg-left">
          <path d="M238 236 L222 268 L248 268 L254 236 Z" fill={skin.mid} />
          <path d="M244 236 L238 256 L248 256 Z" fill={skin.shade} opacity="0.35" />
          <path d="M220 266 Q236 260 252 266 Q248 272 234 272 Q220 272 220 266 Z" fill={skin.base} />
        </g>
        <g className="cave-404__leg-right">
          <path d="M286 236 L302 268 L276 268 L270 236 Z" fill={skin.mid} />
          <path d="M280 236 L286 256 L276 256 Z" fill={skin.shade} opacity="0.35" />
          <path d="M272 266 Q288 260 304 266 Q300 272 286 272 Q272 272 272 266 Z" fill={skin.base} />
        </g>

        <path d="M218 186 L234 168 L248 164 L248 198 L232 214 L216 206 Z" fill={skin.base} />
        <path d="M224 168 L234 186 L242 198 L228 206 Z" fill={skin.shade} opacity="0.28" />

        <path
          d="M248 164 L272 158 L312 168 L322 186 L314 248 L298 262 L252 260 L234 244 L226 204 L248 164 Z"
          fill={tunic.base}
        />
        <path
          d="M252 164 L272 158 L312 168 L322 186 L312 228 L286 238 L258 232 L238 214 L248 164 Z"
          fill={tunic.deep}
          opacity="0.28"
        />
        <path
          d="M234 244 L252 260 L298 262 L314 248 L306 236 L286 244 L258 248 L240 242 Z"
          fill="none"
          stroke={tunic.hem}
          strokeWidth="2.4"
        />
        <path
          d="M240 242 L246 254 L256 248 L266 258 L276 248 L286 254 L306 236 L314 248 L298 262 L252 260 L234 244 Z"
          fill={tunic.base}
        />
        <ellipse cx="268" cy="206" rx="5.5" ry="4.2" fill={tunic.spot} />
        <ellipse cx="292" cy="218" rx="4.8" ry="3.8" fill={tunic.spot} opacity="0.9" />
        <ellipse cx="276" cy="232" rx="4.2" ry="3.4" fill={tunic.spot} opacity="0.85" />
        <ellipse cx="302" cy="196" rx="4" ry="3.2" fill={tunic.spot} opacity="0.8" />
        <ellipse cx="258" cy="222" rx="3.6" ry="3" fill={tunic.spot} opacity="0.75" />

        <g className="cave-404__arm-left">
          <path d="M234 178 L206 194 L200 212 L226 206 L236 188 Z" fill={skin.base} />
          <path d="M214 198 L206 212 L218 208 Z" fill={skin.shade} opacity="0.32" />
          <ellipse cx="198" cy="214" rx="13" ry="11" fill={skin.base} />
        </g>
        <g className="cave-404__arm-right">
          <path d="M290 176 L318 190 L324 208 L298 202 L288 184 Z" fill={skin.base} />
          <path d="M310 194 L318 208 L306 204 Z" fill={skin.shade} opacity="0.32" />
          <ellipse cx="326" cy="210" rx="13" ry="11" fill={skin.base} />
        </g>

        <path
          d="M262 214 C252 214 246 220 244 230 C242 240 244 250 250 258 C256 266 266 268 276 264 C286 260 292 250 294 238 C296 226 292 216 284 210 C276 204 268 202 262 214 Z"
          fill="none"
          stroke={cable}
          strokeWidth="7"
          strokeLinecap="round"
        />

        <path
          d="M218 102 C228 72 256 58 288 62 C314 66 332 88 334 116 C336 138 328 158 310 168 C292 178 268 176 250 162 C234 148 226 126 222 108 C220 104 218 102 218 102 Z"
          fill={hair.dark}
        />
        <path
          d="M224 118 C230 86 254 72 284 76 C310 80 326 100 328 126 C330 148 322 166 304 174 C286 182 264 178 248 164 C236 152 230 136 224 118 Z"
          fill={hair.mid}
        />
        <path d="M214 92 L224 76 L232 92 L220 98 Z" fill={hair.light} />
        <path d="M244 74 L258 58 L266 76 L250 82 Z" fill={hair.light} />
        <path d="M278 70 L292 56 L298 74 L282 80 Z" fill={hair.light} />
        <path d="M306 84 L320 72 L324 90 L308 94 Z" fill={hair.light} />

        <ellipse cx="262" cy="132" rx="38" ry="34" fill={skin.base} />
        <path d="M230 104 L240 90 L246 104 Z" fill={hair.mid} />
        <path d="M298 100 L310 88 L316 104 Z" fill={hair.mid} />

        <path d="M240 124 L252 118 L272 118 L284 124" stroke={hair.dark} strokeWidth="7" fill="none" strokeLinecap="round" />
        <circle cx="248" cy="128" r="3.6" fill="#243028" />
        <circle cx="276" cy="128" r="3.6" fill="#243028" />
        <ellipse cx="262" cy="142" rx="11" ry="13" fill={skin.shade} opacity="0.55" />
        <path d="M246 144 Q262 140 278 144" stroke={hair.light} strokeWidth="3.4" fill="none" strokeLinecap="round" />

        <path
          d="M236 152 C228 172 226 196 232 218 C238 236 250 244 262 242 C274 240 284 228 288 208 C292 188 288 168 276 156 C268 148 256 146 246 150 C240 152 236 152 236 152 Z"
          fill={hair.mid}
        />
        <path
          d="M240 160 C234 180 234 202 240 222 C246 236 256 240 264 236 C272 232 278 220 280 202 C282 184 278 166 268 158 C260 152 250 152 244 156 C240 158 240 160 240 160 Z"
          fill={hair.dark}
          opacity="0.62"
        />

        <path
          d="M236 188 L246 198 L278 198 L288 188"
          fill="none"
          stroke={cable}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <ellipse cx="246" cy="198" rx="8" ry="7" fill={skin.base} />
        <ellipse cx="278" cy="198" rx="8" ry="7" fill={skin.base} />

        <g className="cave-404__lasso">
          <path
            d="M262 196 C246 208 234 224 242 240 C250 254 268 256 280 242 C290 230 288 212 276 202 C270 196 266 194 262 196 Z"
            fill="none"
            stroke={cable}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M262 196 L256 210 C252 224 258 236 268 240"
            fill="none"
            stroke={cable}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <g transform="translate(272 182)">
            <rect x="0" y="12" width="22" height="15" rx="2" fill={cable} />
            <rect x="4" y="0" width="5" height="11" rx="1.2" fill={cable} />
            <rect x="13" y="0" width="5" height="11" rx="1.2" fill={cable} />
          </g>
        </g>
      </g>
    </>
  );
}
