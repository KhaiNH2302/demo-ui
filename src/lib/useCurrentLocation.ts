import { useEffect, useRef, useState } from "react";

export function useCurrentLocation() {
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  const clear = () => { generation.current++; setCoordinates(null); setLoading(false); setError(""); };
  const request = (onSuccess?: (point: { latitude: number; longitude: number }) => void) => {
    const current = ++generation.current;
    setError("");
    if (!navigator.geolocation || !window.isSecureContext) {
      setError("Thiết bị chưa hỗ trợ định vị tại đây. Bạn có thể chọn cơ sở hoặc nhập khu vực.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { if (current === generation.current) { const point = { latitude: coords.latitude, longitude: coords.longitude }; setCoordinates(point); setLoading(false); onSuccess?.(point); } },
      (failure) => { if (current === generation.current) { setLoading(false); setError(failure.code === 1 ? "Bạn chưa cho phép vị trí. Hãy chọn cơ sở hoặc nhập khu vực thay thế." : "Chưa lấy được vị trí. Bạn thử lại hoặc chọn khu vực nhé."); } },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false },
    );
  };
  return { coordinates, loading, error, request, clear };
}
