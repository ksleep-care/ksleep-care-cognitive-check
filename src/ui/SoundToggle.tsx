import { setSoundOn, useSoundOn } from './sound';

/** 소리 켜기/끄기. 상태는 색만이 아니라 글자와 aria-pressed로도 알린다. */
export default function SoundToggle() {
  const on = useSoundOn();
  return (
    <button
      className={`sound-toggle${on ? ' is-on' : ''}`}
      type="button"
      aria-pressed={on}
      onClick={() => setSoundOn(!on)}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path d="M3 6.5h3l3.5-3v11l-3.5-3H3z" fill="currentColor" />
        {on ? (
          <>
            <path d="M12 6.2a3.6 3.6 0 0 1 0 5.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M13.8 4a6.5 6.5 0 0 1 0 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </>
        ) : (
          <path d="M11.5 6.5l4 5M15.5 6.5l-4 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        )}
      </svg>
      <span>{on ? '소리 켬' : '소리 꺼짐'}</span>
    </button>
  );
}
