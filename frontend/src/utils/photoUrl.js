import { API_BASE } from "../services/api";

export function getPhotoUrl(photoPath) {
  if (!photoPath) return "";
  if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
    return photoPath;
  }
  return `${API_BASE}${photoPath.startsWith("/") ? "" : "/"}${photoPath}`;
}
