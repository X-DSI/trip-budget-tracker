// Small shared form and layout pieces.
import { useEffect, useId, useRef, type ReactNode } from 'react';

export function Card({
  children,
  className = '',
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`rounded-2xl bg-white p-5 ring-1 ring-slate-200 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
  subtitle,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const buttonStyles = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800 disabled:bg-slate-300',
  secondary:
    'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 disabled:text-slate-400',
  danger: 'bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-50',
  ghost: 'text-teal-700 hover:bg-teal-50',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonStyles }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const describedBy = error || hint ? hintId : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children(id, describedBy)}
      {(error || hint) && (
        <p id={hintId} className={`text-xs ${error ? 'text-red-700' : 'text-slate-500'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  'block w-full rounded-xl border-0 bg-white px-3 py-2.5 text-base text-slate-900 ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-600 focus:outline-none aria-invalid:ring-red-400';

/** Bottom sheet on phones, centred dialog on wide screens. */
export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close?.();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-label={title}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-white p-0 backdrop:bg-slate-900/40 sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      {open && (
        <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}

export function NumberStepper({
  id,
  value,
  min,
  max,
  onChange,
  label,
}: {
  id?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Fewer ${label}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="h-10 w-10 rounded-xl text-lg ring-1 ring-slate-300 disabled:text-slate-300"
      >
        −
      </button>
      <input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/\D/g, ''));
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        className={`${inputClass.replace('w-full', 'w-14')} text-center`}
        aria-label={label}
      />
      <button
        type="button"
        aria-label={`More ${label}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="h-10 w-10 rounded-xl text-lg ring-1 ring-slate-300 disabled:text-slate-300"
      >
        +
      </button>
    </div>
  );
}
