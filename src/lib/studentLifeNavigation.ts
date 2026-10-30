import type { PostType } from "@/types/entities";
import { isCampusArea } from "./campusAreas";

export function lifePostReturnPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return "/knowledge";
  try {
    const url = new URL(value, "https://scs.local");
    const path = url.pathname;
    if (
      url.origin !== "https://scs.local" ||
      !(
        path === "/" ||
        path === "/knowledge" ||
        path === "/knowledge/me" ||
        /^\/knowledge\/[^/]+$/.test(path)
      ) ||
      path === "/knowledge/new"
    )
      return "/knowledge";
    url.searchParams.delete("compose");
    return path + url.search;
  } catch {
    return "/knowledge";
  }
}

export function lifePostCreateHref({
  topic,
  campus,
  area,
  type,
  returnTo,
}: {
  topic?: string;
  campus?: string;
  area?: string;
  type?: PostType;
  returnTo?: string;
} = {}) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (topic) params.set("topic", topic);
  if (campus) params.set("campus", campus);
  if (isCampusArea(campus || "", area)) params.set("area", area);
  if (returnTo) params.set("returnTo", lifePostReturnPath(returnTo));
  return "/knowledge/new" + (params.size ? "?" + params.toString() : "");
}
