type CharacterStateProps = { smaller: boolean; scenario: number };

export default function CharacterState({ smaller, scenario }: CharacterStateProps) {
  const state = smaller ? 'tiny' : scenario === 1 ? 'return' : 'start';

  return (
    <span className={`character-state character-state--${state}`} aria-hidden="true">
      <svg viewBox="0 0 120 150" role="presentation">
        <path className="character-state__body" d="M42 45 25 128c20 9 49 9 70 0L78 45Z" />
        <path
          className="character-state__head"
          d="M42 47c0-18 7-31 18-31s18 13 18 31c-9 7-27 7-36 0Z"
        />
        <circle className="character-state__eye" cx="60" cy="31" r="2" />
        <path
          className="character-state__limb"
          d="M38 61 18 82m64-21 18 18M48 128l-2 17m26-17 2 17"
        />
        <path className="character-state__thread" d="M18 82c23 10 38-5 53 5s24-4 31-26" />
        {state === 'tiny' && (
          <path className="character-state__spark" d="m93 34 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
        )}
      </svg>
    </span>
  );
}
