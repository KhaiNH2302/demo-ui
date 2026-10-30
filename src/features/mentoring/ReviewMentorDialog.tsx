import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { FormField } from '@/components/shared/FormField';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import type { MentoringRequest, MentorReview } from '@/types/entities';
import { RATING_HINTS, REVIEW_TAGS } from './reviews';

interface ReviewMentorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: string;
  mentorName: string;
  // Yêu cầu đã kết nối dùng làm căn cứ đánh giá
  request: MentoringRequest;
}

const COMMENT_MAX = 300;

export const ReviewMentorDialog: React.FC<ReviewMentorDialogProps> = ({ open, onOpenChange, mentorId, mentorName, request }) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const submit = useMutation({
    mutationFn: () =>
      apiClient.post<MentorReview>(`/mentors/${mentorId}/reviews`, {
        requestId: request.id,
        rating,
        tags,
        comment: comment.trim(),
      }),
    onSuccess: () => {
      toast.success(`Đã gửi đánh giá cho ${mentorName}`);
      queryClient.invalidateQueries({ queryKey: ['mentor-reviews', mentorId] });
      setRating(0);
      setTags([]);
      setComment('');
      onOpenChange(false);
    },
    onError: (error: any) => toast.error(error?.message || 'Chưa gửi được đánh giá, thử lại sau ít phút.'),
  });

  const toggleTag = (tag: string) => setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đánh giá {mentorName}</DialogTitle>
          <DialogDescription>Về yêu cầu “{request.topic}”. Đánh giá hiển thị ẩn danh, mỗi lần kết nối được đánh giá một lần.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <FormField label="Bạn thấy thế nào?" required>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Số sao">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} sao`}
                    onClick={() => setRating(star)}
                    className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <Star className={cn('h-8 w-8', star <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300')} />
                  </button>
                ))}
              </div>
              <span className="text-sm font-medium text-amber-700">{rating ? RATING_HINTS[rating] : 'Chọn số sao'}</span>
            </div>
          </FormField>

          <FormField label="Điểm nổi bật" helperText="Chọn các điều đúng với Mentor này.">
            <div className="flex flex-wrap gap-2">
              {REVIEW_TAGS.map((tag) => (
                <Chip key={tag} selected={tags.includes(tag)} onClick={() => toggleTag(tag)}>
                  {tag}
                </Chip>
              ))}
            </div>
          </FormField>

          <FormField label="Nhận xét" helperText={`${comment.length}/${COMMENT_MAX}`}>
            <Textarea
              rows={3}
              maxLength={COMMENT_MAX}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Một vài dòng giúp bạn khóa sau chọn đúng người kèm."
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button disabled={rating === 0} loading={submit.isPending} onClick={() => submit.mutate()}>
            Gửi đánh giá
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
