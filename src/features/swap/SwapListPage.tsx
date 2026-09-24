import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Repeat2, ArrowRight, MoreVertical, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { formatRelativeTime } from '@/lib/format';
import type { SwapRequest } from '@/types/entities';

export default function SwapListPage() {
  const [activeTab, setActiveTab] = useState<string>('Open');
  const navigate = useNavigate();

  const swapListQuery = useQuery<SwapRequest[]>({
    queryKey: queryKeys.swap.list(activeTab),
    queryFn: () => apiClient.get('/swap-requests', { params: { status: activeTab } }),
  });

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <PageHeader
        title="Yêu cầu đổi lớp của tôi"
        description="Quản lý và theo dõi các bài đăng đổi mã lớp môn học bạn đã tạo"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/swap/connections">
              <Button variant="outline" size="sm">
                Lời mời kết nối
              </Button>
            </Link>
            <Link to="/swap/new">
              <Button size="sm" leftIcon={<Plus size={16} />}>
                Tạo yêu cầu mới
              </Button>
            </Link>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="Open">Đang mở (Open)</TabsTrigger>
          <TabsTrigger value="Connected">Đã kết nối (Connected)</TabsTrigger>
          <TabsTrigger value="Cancelled">Đã hủy (Cancelled)</TabsTrigger>
        </TabsList>
      </Tabs>

      <QueryBoundary
        query={swapListQuery}
        isEmpty={(data) => data.length === 0}
        empty={
          <EmptyState
            icon={Repeat2}
            title="Chưa có yêu cầu đổi lớp nào"
            description="Bạn chưa tạo bài đăng đổi lớp trong mục này. Hãy tạo yêu cầu để tìm đối tác phù hợp."
            actionLabel="Tạo bài đăng đổi lớp"
            onAction={() => navigate('/swap/new')}
          />
        }
      >
        {(items) => (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item) => (
              <Card
                key={item.id}
                className="flex flex-col justify-between hover:border-brand-300 transition-colors shadow-xs"
              >
                <CardHeader>
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <Badge tier="brand" size="sm" className="mb-2">
                        {item.offeringId.toUpperCase()}
                      </Badge>
                      <CardTitle className="text-base font-bold">
                        {item.currentClassCode}{' '}
                        <span className="text-brand-500 font-normal">➔</span>{' '}
                        {item.targetClassCode}
                      </CardTitle>
                    </div>
                    <StatusBadge group="swapRequest" value={item.status} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-md space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Lớp hiện tại:</span>
                      <span className="font-semibold text-neutral-800">{item.currentClassCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Lớp muốn đổi:</span>
                      <span className="font-semibold text-brand-700">{item.targetClassCode}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-neutral-400">
                    Cập nhật {formatRelativeTime(item.updatedAt)}
                  </div>
                </CardContent>

                <CardFooter className="justify-between border-t border-neutral-100 pt-3">
                  <Link to={`/swap/${item.id}`}>
                    <Button variant="outline" size="sm">
                      Chi tiết
                    </Button>
                  </Link>

                  {item.status === 'Open' && (
                    <Link to={`/swap/${item.id}/match`}>
                      <Button size="sm" leftIcon={<Sparkles size={14} />}>
                        Tìm đối tác
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
