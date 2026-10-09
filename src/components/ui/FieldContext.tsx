import { createContext, useContext } from 'react';

export const FieldContext = createContext<{ labelId: string; descriptionId?: string; invalid?: boolean } | null>(null);

export function useFieldAccessibility(props: {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
}, error?: boolean) {
  const field = useContext(FieldContext);
  return {
    'aria-labelledby': props['aria-labelledby'] ?? (props['aria-label'] ? undefined : field?.labelId),
    'aria-describedby': [props['aria-describedby'], field?.descriptionId].filter(Boolean).join(' ') || undefined,
    'aria-invalid': props['aria-invalid'] ?? (error || field?.invalid || undefined),
  };
}
