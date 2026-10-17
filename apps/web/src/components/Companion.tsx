export default function Companion({
  state = 'welcome',
}: {
  state?: 'welcome' | 'focus' | 'pause' | 'complete';
}) {
  return (
    <div className={`companion companion-${state}`} aria-hidden="true">
      <svg viewBox="0 0 320 380" fill="none">
        <ellipse cx="157" cy="353" rx="90" ry="10" className="companion-shadow" />
        <path
          className="companion-thread"
          d="M4 307C77 264 43 229 93 228S148 262 203 213 268 179 300 202"
        />
        {state === 'welcome' && (
          <g className="companion-figure companion-pose-welcome">
            <path
              className="companion-body"
              d="M119 104c-5 45-18 102-30 173 31 15 75 15 107 0-13-68-25-129-30-173Z"
            />
            <path
              className="companion-face"
              d="M122 106c0-30 11-55 28-55s28 25 28 55c-10 9-45 9-56 0Z"
            />
            <circle cx="155" cy="78" r="2.8" fill="currentColor" stroke="none" />
            <path d="M111 137c-18 20-25 42-35 65m-1 0-13 9m13-9-3 15m3-15 8 8" />
            <path d="M178 137c18-15 28-29 34-44m0 0-1-14m1 14 12-8" />
            <path d="M118 277c-4 25-5 41-2 58m55-58c4 24 5 40 2 58m-57 0c-13 2-21 5-27 11m82-11c13 2 21 5 27 11" />
          </g>
        )}
        {state === 'focus' && (
          <g className="companion-figure companion-pose-focus">
            <path
              className="companion-body"
              d="M109 135c5-34 21-55 43-55 25 0 43 25 47 68l-20 94-91-4Z"
            />
            <path
              className="companion-face"
              d="M124 88c1-27 12-47 29-47s27 22 25 50c-12 8-42 7-54-3Z"
            />
            <path d="m145 67 7 2 7-2" />
            <path d="M108 150c-16 17-22 38-26 61m116-58c15 16 22 34 27 55" />
            <path d="m72 210 76 12 70-14-12 47-62 8-62-10Z" className="companion-paper" />
            <path d="m143 222 1 41M117 279c-24 7-39 24-47 48m102-49c28 6 46 21 57 44M70 327l-20 5m179-10 21 5" />
          </g>
        )}
        {state === 'pause' && (
          <g className="companion-figure companion-pose-pause">
            <path
              className="companion-body"
              d="M103 181c4-42 24-70 50-70s47 29 51 73c-19 22-81 23-101-3Z"
            />
            <path
              className="companion-face"
              d="M124 118c0-28 12-49 29-49s29 21 29 49c-13 10-45 10-58 0Z"
            />
            <path d="m141 96 8 2 7-2m7 1 7 2 6-3" />
            <path d="M113 168c-19 22-29 45-33 70m113-70c20 20 30 42 35 68" />
            <path d="M80 238c12 36 40 57 73 58 34 1 62-19 75-60M153 296c-32 4-52 20-66 42m66-42c35 3 57 18 72 40M87 338l-22 3m160-5 22 4" />
          </g>
        )}
        {state === 'complete' && (
          <g className="companion-figure companion-pose-complete">
            <path
              className="companion-body"
              d="M117 113c-4 45-13 96-22 153 30 14 74 14 105-1-12-58-20-108-24-152Z"
            />
            <path
              className="companion-face"
              d="M124 111c0-29 11-52 28-52s29 23 29 52c-12 10-45 10-57 0Z"
            />
            <path d="m143 86 9 5 9-5" />
            <path d="M119 137c-21-17-34-37-39-60m0 0-10-9m10 9 1-15m93 75c23-17 36-37 42-60m0 0 10-9m-10 9-1-15" />
            <path d="M120 266c-12 25-19 45-20 64m73-64c13 24 20 43 21 62m-94 2-19 9m113-11 20 8" />
          </g>
        )}
        <path className="companion-spark" d="m253 62 5 14 14 5-14 5-5 14-5-14-14-5 14-5Z" />
        {state === 'complete' && (
          <path className="companion-spark" d="m75 73 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
        )}
      </svg>
    </div>
  );
}
