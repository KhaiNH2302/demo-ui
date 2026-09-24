import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { GraduationCap, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import type { User, StudentProfile } from '@/types/entities';

export default function PublicProfilePage() {
  const { id = 'usr_student_01' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const userQuery = useQuery({
    queryKey: queryKeys.profile.user(id),
    queryFn: () => apiClient.get(`/users/${id}`) as Promise<{ user: User; profile?: StudentProfile }>,
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader title="Hồ sơ sinh viên" backHref="-1" />

      <QueryBoundary query={userQuery}>
        {({ user, profile }) => {
          const isMentor = user.roles.includes('mentor');

          return (
            <div className="space-y-6">
              {/* Header profile card */}
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                  <Avatar src={user.avatarUrl} name={user.fullName} size="xl" className="h-20 w-20 text-xl shadow-md" />
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-xl font-bold text-neutral-900">{user.fullName}</h2>
                      {user.roles.map((r) => (
                        <Badge key={r} tier="brand" size="sm" className="capitalize">
                          {r.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-500">{user.school}</p>
                    {user.studentCode && <p className="text-[11px] text-neutral-400">MSSV: {user.studentCode}</p>}

                    {profile?.bio && (
                      <p className="text-xs text-neutral-700 mt-3 pt-3 border-t border-neutral-100 leading-relaxed max-w-2xl">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  {isMentor && (
                    <Link to={`/mentoring/mentors/${user.id}`}>
                      <Button size="sm" leftIcon={<Sparkles size={14} />}>
                        Trang Mentor
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>

              {/* Matching Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile?.skills && profile.skills.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Kỹ năng chuyên môn</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-1.5">
                      {profile.skills.map((s, idx) => (
                        <Badge key={idx} tier="neutral" size="sm">
                          {s}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {profile?.interests && profile.interests.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Sở thích & Lĩnh vực quan tâm</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-1.5">
                      {profile.interests.map((it, idx) => (
                        <Badge key={idx} tier="pending" size="sm">
                          {it}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
