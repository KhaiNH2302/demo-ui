import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { FieldContext } from '@/components/ui/FieldContext';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

type ControlProps = { id?: string; children?: React.ReactNode };

// Keep traversal local and return the binding instead of mutating a render closure.
function bindFirstControl(nodes: React.ReactNode, fallbackId: string): { content: React.ReactNode; controlId?: string } {
  const content: React.ReactNode[] = [];
  let controlId: string | undefined;
  for (const child of React.Children.toArray(nodes)) {
    if (controlId || !React.isValidElement<ControlProps>(child)) {
      content.push(child);
      continue;
    }
    const type = child.type;
    const name = typeof type === 'string' ? type : (type as { displayName?: string }).displayName;
    if (['input', 'textarea', 'select', 'Input', 'Textarea', 'Select', 'Combobox'].includes(name ?? '')) {
      controlId = child.props.id ?? fallbackId;
      content.push(React.cloneElement(child, { id: controlId }));
    } else if ((typeof type === 'string' || type === React.Fragment) && child.props.children) {
      const nested = bindFirstControl(child.props.children, fallbackId);
      controlId = nested.controlId;
      content.push(React.cloneElement(child, { children: nested.content }));
    } else {
      content.push(child);
    }
  }
  return { content, controlId };
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helperText,
  children,
  className,
  htmlFor,
}) => {
  const generatedId = React.useId();
  const labelId = `${generatedId}-label`;
  const descriptionId = error || helperText ? `${generatedId}-description` : undefined;
  // Bind the label to the first control, including controls inside layout wrappers.
  // Other controls retain their own IDs and share the field's accessible label.
  const { content, controlId } = htmlFor
    ? { content: children, controlId: htmlFor }
    : bindFirstControl(children, `${generatedId}-control`);
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      <label id={labelId} htmlFor={controlId} className="text-sm font-semibold text-neutral-700 flex items-center gap-1">
        {label}
        {required && <span className="text-[#dc3c33]">*</span>}
      </label>

      <FieldContext.Provider value={{ labelId, descriptionId, invalid: Boolean(error) }}>
        {content}
      </FieldContext.Provider>

      {error ? (
        <div id={descriptionId} role="alert" className="flex items-center gap-1 text-xs text-[#b3261e] mt-0.5">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p id={descriptionId} className="text-xs text-neutral-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};
