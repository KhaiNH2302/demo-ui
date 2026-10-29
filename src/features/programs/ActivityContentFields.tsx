import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/shared/FormField';

/** Shared content controls; each workflow owns permissions, state and submission. */
export function ActivityContentField({ label, value, onChange, multiline = false, rows = 4, error, placeholder }: {
  label: string; value: string; onChange: (value: string) => void; multiline?: boolean; rows?: number; error?: string; placeholder?: string;
}) {
  return <FormField label={label} required error={error}>{multiline
    ? <Textarea aria-label={label} value={value} rows={rows} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>
    : <Input aria-label={label} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>
  }</FormField>;
}
