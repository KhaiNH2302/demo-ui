import React from 'react';
import { Button, type ButtonProps } from './Button';
import { cn } from '@/lib/cn';

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'icon', children, ...props }, ref) => {
    return (
      <Button ref={ref} size={size} className={cn('p-0', className)} {...props}>
        {children}
      </Button>
    );
  }
);
IconButton.displayName = 'IconButton';
