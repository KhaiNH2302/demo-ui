import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, BellPlus, Check, FlaskConical, ListFilter, Pause, Pencil, Play, Trash2, X } from "lucide-react";
import { apiClient, type ApiError } from "@/lib/apiClient";
import { isDemoMode } from "@/lib/demoMode";
import { lifeSearchDraft, lifeSearchExpired, lifeSearchLabels, lifeSearchSignature, normalizeLifeSearchFilters, type LifeSavedSearch, type LifeSearchFilters } from "@/lib/lifeSearches";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";

export function LifeSearchCriteria({ filters }: { filters: LifeSearchFilters }) {
  return <div className="flex flex-wrap gap-1.5" aria-label="Điều kiện tìm kiếm">
    {lifeSearchLabels(filters).map((label) => <span key={label} className="max-w-full break-words rounded-md border border-neutral-200 bg-surface px-2 py-1 text-xs leading-relaxed text-neutral-700">{label}</span>)}
  </div>;
}

export function LifeSearchWatch({ params, nearby, onApply, onEditFilters }: {
  params: URLSearchParams;
  nearby: boolean;
  onApply: (filters: LifeSearchFilters, searchId?: string) => void;
  onEditFilters: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const client = useQueryClient(), navigate = useNavigate(), { toast } = useToast();
  const [manageOpen, setManageOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [editing, setEditing] = useState<LifeSavedSearch | null>(null);
  const [name, setName] = useState("");
  const [confirmationFilters, setConfirmationFilters] = useState<LifeSearchFilters>({});
  const [deleteId, setDeleteId] = useState("");
  const [saveError, setSaveError] = useState("");
  const watches = useQuery<LifeSavedSearch[]>({
    queryKey: ["life-searches", user?.id], queryFn: () => apiClient.get("/community/searches"),
    enabled: Boolean(user), refetchInterval: 15000, refetchOnWindowFocus: true,
  });
  const searches = watches.data || [];
  const draft = lifeSearchDraft(params);
  let disabledReason = "";
  if (nearby) disabledReason = "Bỏ bộ lọc Gần tôi để theo dõi. Vị trí hiện tại không được lưu vào tìm kiếm.";
  else if (params.get("tab") && params.get("tab") !== "discover") disabledReason = "Chuyển sang Bảng tin để theo dõi tìm kiếm theo bộ lọc.";
  else {
    try { normalizeLifeSearchFilters({ ...draft, ...(draft.maxRent && !draft.priceUnit ? { priceUnit: "person" } : {}) }); }
    catch (error) { disabledReason = error instanceof Error ? error.message : "Chọn chủ đề và cơ sở để theo dõi."; }
  }
  let confirmed: LifeSearchFilters | null = null, validation = "";
  try { confirmed = normalizeLifeSearchFilters(confirmationFilters); }
  catch (error) { validation = error instanceof Error ? error.message : "Kiểm tra các điều kiện tìm kiếm."; }
  const existing = searches.find((item) => lifeSearchSignature(item.filters) === lifeSearchSignature(draft));
  const refresh = () => Promise.all([["life-searches"], ["notifications"], ["knowledge"], ["nav"]].map((queryKey) => client.invalidateQueries({ queryKey })));
  const save = useMutation({
    mutationFn: (filters: LifeSearchFilters) => editing
      ? apiClient.patch<LifeSavedSearch>(`/community/searches/${editing.id}`, { name, filters })
      : apiClient.post<LifeSavedSearch>("/community/searches", { name, filters }),
    onSuccess: async (result) => {
      setSaveOpen(false); setEditing(null); setSaveError("");
      onApply(result.filters, result.id);
      await refresh();
      toast({ variant: "success", title: "Đã lưu tìm kiếm", description: "Bạn sẽ nhận thông báo trong ứng dụng khi có bài mới khớp điều kiện. Các bài đang có không tạo thông báo." });
    },
    onError: (error: ApiError) => setSaveError(error.message || "Chưa lưu được. Điều kiện của bạn vẫn được giữ lại."),
  });
  const action = useMutation({
    mutationFn: ({ item, kind }: { item: LifeSavedSearch; kind: "toggle" | "delete" | "demo" }) => kind === "delete"
      ? apiClient.delete(`/community/searches/${item.id}`)
      : kind === "demo" ? apiClient.post(`/community/searches/${item.id}/demo`)
      : apiClient.patch(`/community/searches/${item.id}`, { enabled: !item.enabled }),
    onSuccess: async (_, variables) => {
      setDeleteId("");
      if (variables.kind === "delete" && editing?.id === variables.item.id) setEditing(null);
      await refresh();
      toast({ variant: "success", title: variables.kind === "demo" ? "Đã tạo bài minh họa và kiểm tra thông báo" : variables.kind === "delete" ? "Đã xóa tìm kiếm" : variables.item.enabled ? "Đã tạm dừng thông báo" : "Đã bật lại thông báo", ...(variables.kind === "demo" ? { description: "Mở chuông thông báo để xem bài phù hợp vừa xuất hiện.", action: { label: "Xem thông báo", onClick: () => { setManageOpen(false); navigate("/notifications"); } } } : {}) });
    },
    onError: (error: ApiError) => toast({ variant: "error", title: error.message || "Chưa thực hiện được. Bạn thử lại nhé." }),
  });
  const openSave = () => {
    setConfirmationFilters(draft);
    setName(editing?.name || lifeSearchLabels(draft).slice(0, 3).join(" · ").slice(0, 80));
    setSaveError(""); setSaveOpen(true);
  };
  if (!user || params.get("tab") === "mine") return null;

  return <div className="space-y-3">
    {editing && <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3 text-xs text-brand-800">
      <p className="min-w-0 break-words">Đang sửa <strong>{editing.name}</strong>. Chỉnh bộ lọc rồi lưu thay đổi.</p>
      <button type="button" onClick={() => setEditing(null)} className="shrink-0 rounded-md p-2 hover:bg-brand-100" aria-label="Hủy sửa tìm kiếm"><X size={15} /></button>
    </div>}
    <div role="group" aria-label="Theo dõi tìm kiếm" className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 sm:p-4">
      <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2 sm:gap-3">
        <Button type="button" size="sm" variant={existing && !editing ? "secondary" : "outline"} leftIcon={existing && !editing ? <Check size={14} /> : <BellPlus size={14} />} disabled={Boolean(disabledReason) || watches.isLoading || watches.isError} onClick={existing && !editing ? () => setManageOpen(true) : openSave}>
          {editing ? "Lưu thay đổi tìm kiếm" : existing ? existing.enabled && !lifeSearchExpired(existing) ? "Đã theo dõi tìm kiếm này" : "Tìm kiếm này đã lưu" : "Theo dõi tìm kiếm này"}
        </Button>
        <button type="button" onClick={() => setManageOpen(true)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-surface hover:text-brand-700"><ListFilter size={14} />Tìm kiếm đã lưu{searches.length > 0 ? ` (${searches.length})` : ""}</button>
      </div>
      <p className="min-w-0 flex-1 basis-64 text-xs leading-relaxed text-neutral-500">{disabledReason || "Nhận thông báo về bài mới khớp bộ lọc, không cần tìm lại mỗi ngày."}</p>
      {watches.isError && <p role="alert" className="w-full text-xs text-red-600">Chưa tải được tìm kiếm đã lưu. <button type="button" className="underline" onClick={() => watches.refetch()}>Thử lại</button></p>}
    </div>

    <Dialog open={saveOpen} onOpenChange={(open) => { if (!save.isPending) setSaveOpen(open); }}>
      <DialogContent size="lg" className="max-h-[90dvh] max-w-[calc(100vw-1.5rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{editing ? "Cập nhật tìm kiếm" : "Theo dõi tìm kiếm này"}</DialogTitle><DialogDescription>Kiểm tra điều kiện trước khi bật thông báo.</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (confirmed && name.trim() && !save.isPending) save.mutate(confirmed); }}>
          <label className="block space-y-1.5 text-xs font-medium text-neutral-600"><span>Tên tìm kiếm</span><input autoFocus required maxLength={80} value={name} onChange={(event) => { setName(event.target.value); setSaveError(""); }} className="w-full rounded-lg border border-neutral-200 bg-surface px-3 py-2.5 text-sm text-neutral-900 outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15" /></label>
          <div className="space-y-2 rounded-xl bg-neutral-50 p-3"><p className="text-xs font-semibold text-neutral-700">Điều kiện đang theo dõi</p><LifeSearchCriteria filters={confirmationFilters} /></div>
          {confirmationFilters.maxRent && <fieldset className="space-y-2"><legend className="text-xs font-medium text-neutral-700">Mức giá trọ này tính theo đâu? *</legend><div className="flex flex-wrap gap-2">{[{ value: "person", label: "Theo người / tháng" }, { value: "room", label: "Theo phòng / tháng" }].map((unit) => <label key={unit.value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs has-checked:border-brand-300 has-checked:bg-brand-50"><input type="radio" name="watch-price-unit" required checked={confirmationFilters.priceUnit === unit.value} onChange={() => { setConfirmationFilters((current) => ({ ...current, priceUnit: unit.value })); setSaveError(""); }} />{unit.label}</label>)}</div><p className="text-[11px] text-neutral-500">Chỉ báo tin cùng đơn vị giá để tránh nhầm chi phí một người với cả phòng.</p></fieldset>}
          <div className="space-y-1.5 text-xs leading-relaxed text-neutral-500"><p>Chỉ báo bài mới xuất bản sau khi bật theo dõi, khớp tất cả điều kiện đã chọn.</p><p>Bỏ qua bài của bạn, bài đã ẩn hoặc chưa được duyệt. Thứ tự sắp xếp không được lưu.</p>{editing && <p>Đổi điều kiện sẽ bắt đầu theo dõi bài mới từ thời điểm lưu lại.</p>}</div>
          {(saveError || validation) && <p role="alert" className="text-xs text-red-600">{saveError || validation}</p>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-neutral-100 pt-3"><Button type="button" variant="ghost" size="sm" disabled={save.isPending} onClick={() => setSaveOpen(false)}>Quay lại</Button><Button type="submit" size="sm" loading={save.isPending} disabled={!confirmed || !name.trim()} leftIcon={<Bell size={14} />}>{editing ? "Lưu thay đổi" : "Bật thông báo"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={manageOpen} onOpenChange={setManageOpen}>
      <DialogContent size="xl" className="max-h-[90dvh] max-w-[calc(100vw-1.5rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Tìm kiếm đã lưu</DialogTitle><DialogDescription>Lưu bộ lọc để chờ bài mới. Mục Đã lưu trên bảng tin giữ những bài viết bạn đã chọn.</DialogDescription></DialogHeader>
        {watches.isLoading ? <p role="status" className="py-5 text-sm text-neutral-500">Đang tải…</p> : watches.isError ? <p role="alert" className="text-sm text-red-600">Chưa tải được dữ liệu. <button type="button" onClick={() => watches.refetch()} className="underline">Thử lại</button></p> : searches.length === 0 ? <div className="space-y-2 rounded-xl border border-dashed border-neutral-200 p-6 text-center"><BellPlus className="mx-auto text-brand-500" size={24} /><p className="text-sm font-medium">Bạn chưa theo dõi tìm kiếm nào</p><p className="text-xs leading-relaxed text-neutral-500">Chọn chủ đề và cơ sở, thêm điều kiện bạn cần rồi bấm “Theo dõi tìm kiếm này”.</p></div> : <div className="space-y-3">{searches.map((item) => {
          const expired = lifeSearchExpired(item);
          return <article key={item.id} className="space-y-3 rounded-xl border border-neutral-200 p-3 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 flex-1 break-words text-sm font-semibold text-neutral-900">{item.name}</h3><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${expired || !item.enabled ? "bg-neutral-100 text-neutral-500" : "bg-teal-50 text-teal-700"}`}>{expired ? "Đã qua thời gian" : item.enabled ? "Đang nhận thông báo" : "Đã tạm dừng"}</span></div>
            <LifeSearchCriteria filters={item.filters} />
            <p className="text-[11px] text-neutral-500">{item.matchCount} bài mới phù hợp đã ghi nhận{item.expiresAt ? ` · Theo dõi đến ${new Date(Date.parse(item.expiresAt) - 1).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}` : ""}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button type="button" size="sm" variant="outline" disabled={expired} onClick={() => { onApply(item.filters, item.id); setEditing(null); setManageOpen(false); }}>Mở kết quả</Button>
              <Button type="button" size="sm" variant="ghost" leftIcon={<Pencil size={13} />} onClick={() => { setEditing(item); onApply(item.filters); onEditFilters(); setManageOpen(false); }}>Sửa điều kiện</Button>
              <Button type="button" size="sm" variant="ghost" disabled={action.isPending || expired} leftIcon={item.enabled ? <Pause size={13} /> : <Play size={13} />} onClick={() => action.mutate({ item, kind: "toggle" })}>{item.enabled ? "Tạm dừng" : "Bật lại"}</Button>
              <button type="button" aria-label={`Xóa tìm kiếm ${item.name}`} disabled={action.isPending} onClick={() => setDeleteId(item.id)} className="ml-auto rounded-md p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
            {deleteId === item.id && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-700"><span>Xóa tìm kiếm và dừng nhận tin mới?</span><div className="flex gap-1"><Button type="button" size="sm" variant="ghost" disabled={action.isPending} onClick={() => setDeleteId("")}>Giữ lại</Button><Button type="button" size="sm" variant="destructive" loading={action.isPending} onClick={() => action.mutate({ item, kind: "delete" })}>Xóa</Button></div></div>}
            {isDemoMode && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-2"><p className="max-w-sm text-[11px] leading-relaxed text-neutral-400">Bản demo: tạo một bài mô phỏng khớp điều kiện để thử chuông thông báo.</p><Button type="button" size="sm" variant="ghost" disabled={action.isPending || !item.enabled || expired} leftIcon={<FlaskConical size={13} />} onClick={() => action.mutate({ item, kind: "demo" })}>Thử thông báo</Button></div>}
          </article>;
        })}</div>}
        <p className="text-[11px] leading-relaxed text-neutral-500">Tối đa 10 tìm kiếm. Bật lại sau khi tạm dừng chỉ nhận bài mới từ lúc bật lại.{isDemoMode ? " Tìm kiếm được lưu trên trình duyệt này; bản demo kiểm tra thông báo khi ứng dụng đang mở." : ""}</p>
      </DialogContent>
    </Dialog>
  </div>;
}
