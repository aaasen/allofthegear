import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onSave: (value: string) => Promise<void>;
  validate?: (value: string) => string | null; // return error string or null
  className?: string;
  inputClassName?: string;
  align?: "left" | "right";
}

export function EditableCell({
  value,
  onSave,
  validate,
  className = "",
  inputClassName = "",
  align = "left",
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      setError(null);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, value]);

  const commit = async () => {
    const trimmed = draft.trim();
    if (trimmed === value) {
      setEditing(false);
      return;
    }
    const err = validate?.(trimmed) ?? null;
    if (err) {
      setError(err);
      inputRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(value);
    setError(null);
    setEditing(false);
  };

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        className={`cursor-pointer rounded px-1 -mx-1 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group ${className}`}
        title="Click to edit"
      >
        {value || <span className="text-gray-300 italic">—</span>}
        <span className="ml-1 opacity-0 group-hover:opacity-40 text-xs select-none">✎</span>
      </span>
    );
  }

  return (
    <span className="relative">
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => { setDraft(e.target.value); setError(null); }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { e.preventDefault(); cancel(); }
        }}
        disabled={saving}
        className={`border rounded px-1 py-0 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
          error ? "border-red-400" : "border-indigo-300"
        } ${align === "right" ? "text-right" : "text-left"} ${inputClassName}`}
      />
      {error && (
        <span className="absolute left-0 top-full mt-0.5 text-xs text-red-500 whitespace-nowrap z-10">
          {error}
        </span>
      )}
    </span>
  );
}
