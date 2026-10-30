// Campus addresses: https://daihoc.fpt.edu.vn/
// Source details and scope: CAMPUS_AREAS_SOURCES.md (checked 2026-10-30).
// These are nearby area suggestions, not a complete administrative directory.
export const CAMPUS_AREAS: Record<string, readonly string[]> = {
  "Hòa Lạc": ["Xã Hòa Lạc", "Xã Hạ Bằng", "Xã Phú Cát", "Xã Yên Xuân", "Xã Yên Bài", "Xã Đoài Phương", "Tân Xã (khu vực cũ)", "Thạch Hòa (khu vực cũ)", "Bình Yên (khu vực cũ)"],
  "TP. Hồ Chí Minh": ["Phường Tăng Nhơn Phú", "Phường Long Bình", "Phường Long Phước", "Phường Long Trường", "Phường Phước Long", "Phường Linh Xuân"],
  "Đà Nẵng": ["Phường Ngũ Hành Sơn", "Phường Hòa Xuân", "Phường Điện Bàn Đông", "Phường Cẩm Lệ", "Xã Hòa Tiến", "Phường Điện Bàn Bắc"],
  "Cần Thơ": ["Phường An Bình", "Phường Tân An", "Phường Long Tuyền", "Phường Cái Răng", "Phường Ninh Kiều", "Xã Phong Điền", "Xã Nhơn Ái"],
  "Quy Nhơn": ["Phường Quy Nhơn Đông", "Phường Quy Nhơn Bắc", "Phường Quy Nhơn", "Xã Tuy Phước", "Xã Tuy Phước Đông", "Phường Quy Nhơn Nam", "Phường Quy Nhơn Tây"],
};

export function getCampusAreas(campus: string) {
  return CAMPUS_AREAS[campus] || [];
}

export function isCampusArea(campus: string, area: unknown): area is string {
  return typeof area === "string" && getCampusAreas(campus).includes(area);
}
