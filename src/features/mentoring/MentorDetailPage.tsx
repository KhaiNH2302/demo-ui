import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { Sparkles, BookOpen, Clock, Send, Award, ArrowLeft } from 'lucide-react';
import { SendMentoringRequestDialog } from './SendMentoringRequestDialog';
import type { Mentor, MentoringPost } from '@/types/entities';

interface MentorDetailResponse {
  mentor: Mentor;
  posts: MentoringPost[];
}

export const MentorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isSendOpen, setIsSendOpen] = useState(false);

  const mentorQuery = useQuery({
    queryKey: ['mentoring', 'mentors', id],
    queryFn: () => apiClient.get<MentorDetailResponse>(`/mentoring/mentors/${id}`),
    enabled: !!id,
  });

  const data = mentorQuery.data;
  const mentor = data?.mentor;
  const posts = data?.posts || [];

  return (
    <QueryBoundary queries={[mentorQuery]}>
      {mentor && (
        <div className="max-w-4xl mx-auto space-y-6">
          <PageHeader
            title="Hồ sơ Mentor"
            description="Thông tin năng lực chuyên môn, môn học phụ trách và lịch rảnh hỗ trợ"
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Mentoring', href: '/mentoring' },
              { label: 'Hồ sơ Mentor' },
            ]}
            actions={
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại
              </Button>
            }
          />

          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <UserMiniCard userId={mentor.userId} showMajor />
              <div className="flex items-center gap-2">
                <Badge variant={mentor.acceptingRequests ? 'success' : 'neutral'}>
                  {mentor.acceptingRequests ? 'Đang nhận yêu cầu' : 'Tạm ngưng nhận yêu cầu'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fields & Subjects */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-primary" /> Môn học & Lĩnh vực phụ trách:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {mentor.subjects.map((sub, i) => (
                    <Badge key={i} variant="secondary">
                      {sub}
                    </Badge>
                  ))}
                  {mentor.fields.map((field, i) => (
                    <Badge key={i} variant="outline">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Experience */}
              {mentor.experience && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-primary" /> Kinh nghiệm & Thành tích:
                  </h4>
                  <p className="text-sm text-[var(--text-muted)] bg-[var(--surface-muted)] p-3 rounded-lg whitespace-pre-line">
                    {mentor.experience}
                  </p>
                </div>
              )}

              {/* Availability */}
              {mentor.availability && mentor.availability.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" /> Khung giờ rảnh có thể hỗ trợ:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {mentor.availability.map((slot: any, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs rounded bg-[var(--surface-sunken)] font-mono text-[var(--text-muted)]">
                        {typeof slot === 'string' ? slot : `${slot.day}: ${slot.start}-${slot.end}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Support Modes */}
              <div>
                <span className="text-xs text-[var(--text-muted)]">
                  Hình thức hỗ trợ: <strong className="text-[var(--text-main)] capitalize">{mentor.supportModes.join(', ')}</strong>
                </span>
              </div>
            </CardContent>

            <CardFooter className="border-t border-[var(--border-subtle)] pt-4 flex justify-end">
              {mentor.acceptingRequests ? (
                <Button onClick={() => setIsSendOpen(true)}>
                  <Send className="w-4 h-4 mr-1.5" /> Gửi Mentoring Request
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button disabled>
                        <Send className="w-4 h-4 mr-1.5" /> Mentor hiện không nhận request mới
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Mentor đang bận hoặc đã đủ học viên trong kỳ này.
                  </TooltipContent>
                </Tooltip>
              )}
            </CardFooter>
          </Card>

          {/* Posts by Mentor */}
          {posts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Các bài chia sẻ & Lớp học của Mentor ({posts.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((p) => (
                  <Card key={p.id} className="p-4 space-y-2 hover:border-primary transition-colors cursor-pointer" onClick={() => navigate(`/mentoring/posts/${p.id}`)}>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{p.field}</Badge>
                      <span className="text-xs text-[var(--text-muted)]">{p.slots} slot</span>
                    </div>
                    <h4 className="font-semibold text-sm">{p.title}</h4>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">{p.content}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Send Request Dialog */}
          <SendMentoringRequestDialog
            open={isSendOpen}
            onOpenChange={setIsSendOpen}
            mentorId={mentor.userId}
          />
        </div>
      )}
    </QueryBoundary>
  );
};

export default MentorDetailPage;
