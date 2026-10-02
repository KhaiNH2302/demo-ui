import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Users, Calendar, Video, MapPin, CheckCircle, Settings } from 'lucide-react';
import type { MentorCourse } from '@/types/entities';

interface MentorCourseCardProps {
  course: MentorCourse;
  isOwner?: boolean;
  onEnroll?: (courseId: string) => void;
  isEnrolling?: boolean;
  hasEnrolled?: boolean;
}

export const MentorCourseCard: React.FC<MentorCourseCardProps> = ({
  course,
  isOwner = false,
  onEnroll,
  isEnrolling = false,
  hasEnrolled = false,
}) => {
  const isFull = course.enrolled >= course.slots;
  const isClosed = !course.open;

  const getModeBadge = () => {
    switch (course.mode) {
      case 'online':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-brand-600 font-medium bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded">
            <Video className="w-3.5 h-3.5" /> Online
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
            <MapPin className="w-3.5 h-3.5" /> Offline
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
            Linh hoạt
          </span>
        );
    }
  };

  return (
    <Card className="flex flex-col justify-between hover:shadow-sm transition-shadow">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="truncate max-w-[200px]">
            {course.subjectOrField}
          </Badge>

          {isClosed ? (
            <Badge variant="neutral">Đã đóng</Badge>
          ) : isFull ? (
            <Badge variant="attention">Đã đủ chỗ</Badge>
          ) : (
            <Badge variant="success">Đang mở đăng ký</Badge>
          )}
        </div>

        <CardTitle className="text-base font-semibold leading-snug line-clamp-2">
          {course.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 flex-1 pb-4">
        {course.description && (
          <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        )}

        <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-600">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Hình thức:</span>
            {getModeBadge()}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-neutral-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Lịch học:
            </span>
            <span className="font-medium text-neutral-800 text-right truncate max-w-[180px]">
              {course.schedule}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-neutral-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Sĩ số:
            </span>
            <span className="font-semibold text-neutral-900 tabular-nums">
              {course.enrolled} / {course.slots} học viên
            </span>
          </div>

          {/* Sĩ số progress bar */}
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isFull ? 'bg-amber-500' : 'bg-brand-500'
              }`}
              style={{ width: `${Math.min(100, Math.round((course.enrolled / course.slots) * 100))}%` }}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end">
        {isOwner ? (
          <Link to="/mentor/posts?tab=courses">
            <Button variant="outline" size="sm" leftIcon={<Settings className="w-3.5 h-3.5" />}>
              Quản lý khóa học
            </Button>
          </Link>
        ) : hasEnrolled ? (
          <Button variant="outline" size="sm" disabled leftIcon={<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}>
            Đã đăng ký
          </Button>
        ) : isClosed ? (
          <Button variant="outline" size="sm" disabled>
            Đã đóng
          </Button>
        ) : isFull ? (
          <Button variant="outline" size="sm" disabled>
            Đã đủ chỗ ({course.slots}/{course.slots})
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => onEnroll?.(course.id)}
            loading={isEnrolling}
          >
            Đăng ký tham gia
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
