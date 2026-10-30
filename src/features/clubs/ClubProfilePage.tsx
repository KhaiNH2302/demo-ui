import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit3,
  ExternalLink,
  Flag,
  Globe,
  Mail,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { CoverHeader } from '@/components/shared/CoverHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { OpportunityCard } from '@/components/shared/OpportunityCard';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { CoverImagePicker } from '@/components/shared/CoverImagePicker';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { EntityRow } from '@/components/shared/EntityRow';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useViewer } from '@/lib/viewer';
import { useGuardedAction } from '@/lib/guestGate';
import { ClubFollowButton } from './ClubRecruitmentActions';
import { isRecruitment, isRecruitmentOpen } from './recruitment';
import { toast } from '@/components/ui/Toast';
import type { Club, ClubOpportunity, MediaImageItem } from '@/types/entities';

interface ClubDetailResponse extends Club {
  opportunities?: ClubOpportunity[];
}

const DEFAULT_CLUB_GALLERY: MediaImageItem[] = [
  {
    id: 'clb-g1',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80',
    caption: 'Buổi sinh hoạt chuyên đề thuật toán & hệ thống hàng tuần',
  },
  {
    id: 'clb-g2',
    url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=900&q=80',
    caption: 'Đội ngũ thành viên trong sự kiện Hackathon nội bộ trường',
  },
  {
    id: 'clb-g3',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80',
    caption: 'Mentor khóa trên hướng dẫn đồ án cho thành viên khóa mới',
  },
];

export const ClubProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { isRepresentativeOf } = useAuthStore();
  const viewer = useViewer();
  const canOpenProfile = viewer.can('profile.open');
  const guard = useGuardedAction();

  const [activeTab, setActiveTab] = useState<'about' | 'open' | 'past'>('about');
  const [editOpen, setEditOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<MediaImageItem[]>(DEFAULT_CLUB_GALLERY);

  const { data: club, isLoading } = useQuery<ClubDetailResponse>({
    queryKey: ['club', id],
    queryFn: () => apiClient.get(`/clubs/${id}`),
    enabled: !!id,
  });

  const isRep = id ? isRepresentativeOf(id) : false;

  const updateMutation = useMutation({
    mutationFn: () =>
      apiClient.put(`/clubs/${id}`, {
        tagline,
        description,
        contactEmail,
        coverUrl,
        gallery,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club', id] });
      setEditOpen(false);
      toast.success('Đã cập nhật hồ sơ Câu lạc bộ');
    },
  });

  if (isLoading) {
    return <Card className="h-72 animate-pulse bg-neutral-100" />;
  }

  if (!club) {
    return (
      <Card className="p-8 text-center space-y-3">
        <p className="text-sm font-medium text-neutral-700">
          Không tìm thấy thông tin Câu lạc bộ này.
        </p>
        <Link to="/clubs?tab=directory">
          <Button variant="secondary" size="sm">
            Quay lại Danh sách CLB
          </Button>
        </Link>
      </Card>
    );
  }

  const openOpps = (club.opportunities || []).filter((o) => isRecruitmentOpen(o));
  const closedOpps = (club.opportunities || []).filter((o) => isRecruitment(o) && !isRecruitmentOpen(o) && o.status !== 'Draft');
  const clubGallery =
    club.gallery && club.gallery.length > 0 ? club.gallery : gallery;

  const handleOpenEdit = () => {
    setTagline(club.tagline || '');
    setDescription(club.description || '');
    setContactEmail(club.contactEmail || '');
    setCoverUrl(club.coverImageUrl || club.coverUrl || null);
    setGallery(club.gallery && club.gallery.length > 0 ? club.gallery : DEFAULT_CLUB_GALLERY);
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/clubs?tab=directory"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Danh sách CLB</span>
        </Link>
      </div>

      {/* CoverHeader giữ cho Trang CLB (CL2) theo 05-social-patterns.md #4 & #7 */}
      <CoverHeader
        coverUrl={club.coverImageUrl || club.coverUrl}
        avatarUrl={club.logoUrl}
        title={club.name}
        subtitle={`${club.field} · ${openOpps.length} cơ hội đang mở · ${
          (club.representatives || []).length
        } đại diện xác thực`}
        badge={<StatusBadge group="club" status={club.status || 'Active'} />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <ClubFollowButton clubId={club.id}/>
            {isRep && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleOpenEdit}
                  leftIcon={<Edit3 className="h-4 w-4" />}
                >
                  Sửa hồ sơ CLB
                </Button>
                <Link to={`/clubs/manage/new?clubId=${club.id}`}>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Tạo đợt tuyển
                  </Button>
                </Link>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={guard('report', () => setReportOpen(true))}
              leftIcon={<Flag className="h-4 w-4" />}
            >
              Báo cáo
            </Button>
          </div>
        }
      />

      <p className="text-sm text-neutral-600">Theo dõi CLB để nhận thông báo khi có đợt tuyển mới. <Link to="/programs" className="text-brand-700 underline">Xem sự kiện tại Hoạt động</Link>.</p>

      {/* Underline Tabs: Giới thiệu · Đợt tuyển đang mở · Các đợt tuyển trước (05-social-patterns.md #7) */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'about' | 'open' | 'past')}>
        <TabsList>
          <TabsTrigger value="about">Giới thiệu</TabsTrigger>
          <TabsTrigger value="open">
            Đợt tuyển đang mở ({openOpps.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Các đợt tuyển trước ({closedOpps.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-5">
              <Card className="p-5 space-y-4">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Giới thiệu Câu lạc bộ
                </h2>
                <p className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed">
                  {club.description}
                </p>

                {clubGallery.length > 0 && (
                  <div className="pt-3 border-t border-neutral-100">
                    <ImageGallery
                      title="Hình ảnh hoạt động"
                      images={clubGallery}
                    />
                  </div>
                )}
              </Card>

              {openOpps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Đợt tuyển đang mở ({openOpps.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('open')}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      Xem tất cả →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {openOpps.slice(0, 2).map((opp) => (
                      <OpportunityCard key={opp.id} opportunity={opp} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Người đại diện xác thực */}
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Người đại diện xác thực
                  </h3>
                </div>
                <p className="text-xs text-neutral-500">
                  Sinh viên được Admin xác minh quyền đăng cơ hội cho CLB
                </p>

                <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-lg overflow-hidden">
                  {(club.representatives || []).map((rep) => (
                    <EntityRow
                      key={rep.userId}
                      dense
                      href={canOpenProfile ? `/users/${rep.userId}` : undefined}
                      leading={
                        <UserAvatar
                          user={{
                            id: rep.userId,
                            fullName: rep.fullName,
                            avatarUrl: rep.avatarUrl,
                          }}
                          size="sm"
                        />
                      }
                      title={rep.fullName}
                      subtitle={`${rep.studentCode} · ${rep.roleNote}`}
                    />
                  ))}
                </div>
              </Card>

              {/* Liên hệ */}
              <Card className="p-5 space-y-2.5 text-xs text-neutral-600">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Thông tin liên hệ
                </h3>
                {club.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-neutral-400 shrink-0" />
                    <span>{club.contactEmail}</span>
                  </div>
                )}
                {club.socialLinks?.facebook && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-neutral-400 shrink-0" />
                    <a
                      href={club.socialLinks.facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Trang truyền thông chính thức</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="open" className="pt-4">
          {openOpps.length === 0 ? (
            <EmptyState
              title="Hiện chưa có cơ hội nào đang mở"
              description="Theo dõi trang CLB để cập nhật các đợt tuyển thành viên hoặc sự kiện sắp tới."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openOpps.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="pt-4">
          {closedOpps.length === 0 ? (
            <EmptyState
              title="Chưa có cơ hội đã kết thúc"
              description="Các đợt tuyển và sự kiện đã diễn ra của CLB sẽ được lưu trữ tại đây."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {closedOpps.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Club Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hồ sơ CLB</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin giới thiệu, ảnh bìa và bộ ảnh hoạt động của {club.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Ảnh bìa CLB (tỉ lệ 4:1)
              </label>
              <CoverImagePicker
                value={coverUrl}
                onChange={setCoverUrl}
                aspect="4/1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Khẩu hiệu / Mô tả ngắn (Tagline)
              </label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Giới thiệu chi tiết
              </label>
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Email liên hệ
              </label>
              <Input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Bộ ảnh hoạt động (tối đa 6 ảnh)
              </label>
              <ImageUploader
                value={gallery}
                onChange={setGallery}
                maxImages={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              loading={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="opportunity"
        targetId={club.id}
        targetTitle={`Hồ sơ CLB: ${club.name}`}
        targetAuthorName={club.name}
      />
    </div>
  );
};

export default ClubProfilePage;
