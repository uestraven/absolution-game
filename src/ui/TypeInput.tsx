import { useEffect, useRef, useState } from 'react';

export interface TypeInputProps {
  onSubmit: (raw: string) => void;
  /** Shown as the input's hint. Changes with pending conversation/question. */
  placeholder: string;
  /** Visible label text, kept short. */
  label: string;
  disabled?: boolean;
}

export function TypeInput({ onSubmit, placeholder, label, disabled }: TypeInputProps) {
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // Focus once, when the field first appears. Never on every update: that
  // would snatch focus away from someone reading back through the transcript.
  useEffect(() => {
    input.current?.focus();
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const raw = value;
    if (raw.trim().length === 0) return;
    setHistory((h) => [...h.slice(-30), raw]);
    setCursor(null);
    setValue('');
    onSubmit(raw);
    // Keep the caret where the player left it, so they can keep typing.
    input.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (history.length === 0) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const next = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setValue(history[next] ?? '');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (cursor === null) return;
      const next = cursor + 1;
      if (next >= history.length) {
        setCursor(null);
        setValue('');
      } else {
        setCursor(next);
        setValue(history[next] ?? '');
      }
    }
  }

  return (
    <form className="type-input" onSubmit={submit}>
      <label className="sr-only" htmlFor="command-input">
        {label}
      </label>
      <div className="type-row">
        <input
          id="command-input"
          ref={input}
          className="command-field"
          type="text"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={(e) => {
            // On a phone the keyboard covers the page; bring the field back up.
            // Guarded: not every environment implements scrollIntoView.
            e.currentTarget.scrollIntoView?.({ block: 'nearest' });
          }}
        />
        <button className="btn" type="submit" disabled={disabled}>
          enter
        </button>
      </div>
      {value.length === 0 ? (
        <p className="type-hint">
          look · examine &lt;thing&gt; · go &lt;exit&gt; · talk to &lt;person&gt; · help · hint
        </p>
      ) : null}
    </form>
  );
}
