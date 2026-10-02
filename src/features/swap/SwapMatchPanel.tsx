import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  Sparkles,
  Send,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Info,
} from 'lucide-react';
import type { SwapRequest, SwapConnection, CourseOffering, User } from '@/types/entities';

interface SwapMatchPanelProps {
  partnerRequest: SwapRequest;
  partnerUser: Partial<User>;
  offering?: CourseOffering;
  myRequestInSameOffering?: SwapRequest;
  connection?: SwapConnection;
  onOpenSendInvite: () => void;
  onOpenCreateReverse: () => void;
  onOpenReviewInvite?: () => void;
}

export const SwapMatchPanel: React.FC<SwapMatchPanelProps> = ({
  partnerRequest,
  partnerUser,
  offering,
  myRequestInSameOffering,
  connection,
  onOpenSendInvite,
  onOpenCreateReverse,
  onOpenReviewInvite,
}) => {
  const navigate = useNavigate();

  const isClosed = partnerRequest.status !== 'Open';
  const hasMyRequest = Boolean(myRequestInSameOffering);
  const isPendingSent = connection?.status === 'Pending' && connection.initiatorId !== partnerRequest.studentId;
  const isPendingReceived = connection?.status === 'Pending' && connection.recipientId !== partnerRequest.studentId;

  const isPerfectMatch =
    myRequestInSameOffering &&
    myRequestInSameOffering.currentClassCode === partnerRequest.targetClassCode &&
    myRequestInSameOffering.targetClassCode === partnerRequest.currentClassCode;

  return (
    <Card className="border-neutral-200 dark:border-neutral-800">
      <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>Mức độ phù hợp</span>
          {hasMyRequest && (
            <Badge variant="brand" className="text-[11px] font-normal">
              Cùng môn {offering?.courseCode}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Tình huống 5: Yêu cầu đã đóng */}
        {isClosed ? (
          <div className="space-y-3">
            <Alert variant="neutral" icon={<AlertCircle className="w-4 h-4 text-neutral-500" />}>
              Yêu cầu đổi lớp này đã được kết nối hoặc đã đóng. Bạn không thể gửi thêm lời mời kết nối.
            </Alert>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate(`/chats?user=${partnerRequest.studentId}`)}
              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
            >
              Nhắn tin hỏi đối tác
            </Button>
          </div>
        ) : isPendingSent ? (
          /* Tình huống 2: Đã gửi lời mời đang Pending */
          <div className="space-y-3">
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-800 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Đã gửi lời mời · Chờ phản hồi</span>
              </div>
              <p className="text-amber-800 dark:text-amber-300">
                Bạn đã gửi lời mời kết nối tới {partnerUser.fullName || 'bạn này'}. Mã lớp và lịch học đang được giữ nguyên cho tới khi có phản hồi.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/swap/connections')}
            >
              Xem danh sách lời mời đã gửi
            </Button>
          </div>
        ) : isPendingReceived ? (
          /* Tình huống 3: Đối tác đã gửi lời mời tới tôi */
          <div className="space-y-3">
            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-800 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{partnerUser.fullName || 'Đối tác'} đã mời bạn kết nối!</span>
              </div>
              <p className="text-emerald-800 dark:text-emerald-300">
                Yêu cầu của hai bạn tương thích. Hãy xem xét và phản hồi để hoàn tất việc kết nối.
              </p>
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={onOpenReviewInvite || (() => navigate('/swap/connections'))}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Xem &amp; Phản hồi lời mời
            </Button>
          </div>
        ) : hasMyRequest ? (
          /* Tình huống 1: Có yêu cầu cùng môn -> Đối chiếu & Gửi lời mời */
          <div className="space-y-4">
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/80 dark:bg-neutral-900/40 dark:border-neutral-800 text-xs space-y-2">
              <span className="text-neutral-500 font-medium block">Yêu cầu của bạn:</span>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {offering?.courseCode}
                </span>
                <span className="font-mono font-bold text-brand-700 dark:text-brand-300">
                  {myRequestInSameOffering!.currentClassCode} → {myRequestInSameOffering!.targetClassCode}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Đánh giá khớp:</span>
              {isPerfectMatch ? (
                <Badge variant="success" className="text-xs">
                  ★ Đối ứng hoàn hảo
                </Badge>
              ) : (
                <Badge variant="brand" className="text-xs">
                  ◐ Khớp một chiều
                </Badge>
              )}
            </div>

            <div className="p-3 rounded-lg border border-brand-100 bg-brand-50/50 dark:bg-brand-950/20 dark:border-brand-900 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-brand-800 dark:text-brand-200">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>AI 92% · Tương thích lịch học</span>
              </div>
              <ul className="text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1 list-disc list-inside">
                <li>Lịch học gần như không bị trùng lặp</li>
                <li>Cùng cơ sở ĐH FPT Hà Nội</li>
                {isPerfectMatch && <li>Đúng lớp đối ứng cả 2 chiều</li>}
              </ul>
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={onOpenSendInvite}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Gửi lời mời kết nối
            </Button>
          </div>
        ) : (
          /* Tình huống 4: Chưa có yêu cầu cùng môn -> Tạo yêu cầu ngược */
          <div className="space-y-3.5">
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 dark:bg-neutral-900/40 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                Bạn chưa có yêu cầu cho môn {offering?.courseCode || 'này'}
              </span>
              <p className="text-[11px] text-neutral-500">
                Tạo yêu cầu đổi lớp ngược lại để hệ thống tự động kết nối bạn với {partnerUser.fullName || 'bạn này'}.
              </p>
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={onOpenCreateReverse}
              leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
            >
              Tạo yêu cầu ngược
            </Button>
          </div>
        )}

        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            SCS hỗ trợ kết nối sinh viên. Sau khi kết nối, hãy tự làm thủ tục chuyển lớp với phòng đào tạo.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
