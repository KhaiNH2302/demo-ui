import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Stepper } from '@/components/ui/Stepper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export interface WizardStepItem {
  id: string;
  label: string;
  description?: string;
}

export interface WizardPageProps {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel?: string;
  steps: WizardStepItem[];
  currentStep: number;
  onStepChange: (stepIndex: number) => void;
  onSaveDraft?: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitting?: boolean;
  children: React.ReactNode;
}

/**
 * Khung biểu mẫu nhiều bước (C4, M3, CL7, CL8, PG5)
 * theo 04-reuse-plan.md § 2.3.4
 */
export const WizardPage: React.FC<WizardPageProps> = ({
  title,
  subtitle,
  backHref,
  backLabel = 'Quay lại',
  steps,
  currentStep,
  onStepChange,
  onSaveDraft,
  onSubmit,
  submitLabel = 'Gửi',
  submitting = false,
  children,
}) => {
  const isLastStep = currentStep >= steps.length - 1;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <Link
          to={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{backLabel}</span>
        </Link>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>}
      </div>

      <Stepper
        steps={steps.map((s) => ({ label: s.label, description: s.description }))}
        current={currentStep}
      />

      <Card className="p-6 space-y-5">{children}</Card>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          {currentStep > 0 && (
            <Button
              variant="secondary"
              onClick={() => onStepChange(currentStep - 1)}
            >
              Quay lại bước trước
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onSaveDraft && (
            <Button variant="outline" onClick={onSaveDraft}>
              Lưu nháp
            </Button>
          )}
          <Button
            variant="primary"
            loading={submitting}
            onClick={() => {
              if (isLastStep) {
                onSubmit();
              } else {
                onStepChange(currentStep + 1);
              }
            }}
          >
            {isLastStep ? submitLabel : 'Tiếp tục'}
          </Button>
        </div>
      </div>
    </div>
  );
};
