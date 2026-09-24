import React from 'react';
import { Alert } from '@/components/ui/Alert';

export interface DisclaimerBannerProps {
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ className }) => {
  return (
    <Alert tier="attention" className={className}>
      <div>
        <span className="font-semibold">Lưu ý quan trọng: </span>
        SCS chỉ là kênh kết nối thông tin giữa các sinh viên. Mã lớp và lịch học là dữ liệu <strong>tự khai</strong>, hệ thống không xác minh với nhà trường. Trạng thái &quot;Đã kết nối&quot; <strong>không có giá trị đổi lớp chính thức</strong> — bạn phải tự làm thủ tục chuyển lớp với phòng đào tạo.
      </div>
    </Alert>
  );
};
