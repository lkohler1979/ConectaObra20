export function FormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-grafite">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-vermelho">{error}</p>}
    </div>
  );
}
