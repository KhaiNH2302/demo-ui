import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Các class chữ tự định nghĩa trong index.css. Nếu không khai báo, tailwind-merge coi `text-small`
// là màu chữ và xoá mất `text-white` của nút primary (chữ tối trên nền xanh ở light mode).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['small', 'body', 'caption', 'meta', 'card-title', 'section-title', 'page-title'] },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
