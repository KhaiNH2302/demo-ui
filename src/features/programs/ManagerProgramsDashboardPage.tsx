import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Settings, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PROGRAM_TYPE_LABELS } from '@/components/shared/ProgramCard';
import { apiClient } from '@/lib/apiClient';
import type { ProgramChannel, ProgramProposal } from '@/types/entities';
import { ProgramProposalsPage } from './ProgramProposalsPage';
import { programUnlimited } from './rules';
export default function ManagerProgramsDashboardPage() {
 const [params, setParams] = useSearchParams();
 const tab = params.get('tab') === 'review' ? 'review' : 'managing';
 const {data: myOrganized = [], isLoading, isError, refetch} = useQuery<ProgramChannel[]>({queryKey:['programs','mine'], queryFn:()=>apiClient.get('/programs?mine=true')});
 const {data: proposals = []} = useQuery<ProgramProposal[]>({queryKey:['program-proposals','review'],queryFn:()=>apiClient.get('/programs/proposals?review=true')});
 return <div className="space-y-5"><h1 className="text-2xl font-bold">Quản lý hoạt động</h1>
 <Tabs value={tab} onValueChange={value=>setParams({tab:value})}><TabsList><TabsTrigger value="managing">Quản lý hoạt động ({myOrganized.length})</TabsTrigger><TabsTrigger value="review">Duyệt đề xuất ({proposals.filter(p=>p.status === 'PendingReview').length})</TabsTrigger></TabsList>
 <TabsContent value="review"><ProgramProposalsPage review embedded /></TabsContent>
 {isLoading ? <Card className="h-48 animate-pulse"/> : isError ? <ErrorState onRetry={()=>refetch()}/> : <>
<TabsContent value="managing" className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-card-title text-neutral-900">
                  Chương trình do bạn phụ trách
                </h3>
              </div>
            </div>

            {myOrganized.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Bạn chưa tổ chức kênh chương trình nào"
                description="Khởi xướng một chiến dịch tình nguyện hoặc buổi workshop chia sẻ kiến thức cho cộng đồng."
              />
            ) : (
              <div className="space-y-3">
                {myOrganized.map((prog) => (
                  <Card
                    key={prog.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-caption font-semibold text-brand-600">
                          {PROGRAM_TYPE_LABELS[prog.type]}
                        </span>
                        <span className="text-neutral-300">·</span>
                        <span className="text-caption text-neutral-500">
                          Manager phụ trách
                        </span>
                      </div>
                      <Link
                        to={`/programs/${prog.id}`}
                        className="text-card-title text-neutral-900 hover:text-brand-600 block truncate"
                      >
                        {prog.title}
                      </Link>
                      <div className="text-caption text-neutral-500 flex items-center gap-3">
                        <span>
                          Đã xác nhận: <strong>{prog.confirmedCount}/{programUnlimited(prog) ? 'Không giới hạn online' : prog.quota}</strong>
                        </span>
                        <span>
                          Diễn ra: {new Date(prog.startAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      {prog.status === 'Rejected' && prog.rejectionReason && (
                        <p className="text-caption text-tier-danger-text mt-1">
                          Phản hồi từ Admin: {prog.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge group="programChannel" status={prog.status} />
                      <Link to={`/programs/${prog.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Chỉnh sửa
                        </Button>
                      </Link>
                      <Link to={`/programs/manage/${prog.id}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Settings className="h-3.5 w-3.5" />}
                        >
                          Quản lý kênh
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
 </>} </Tabs></div>;
}
