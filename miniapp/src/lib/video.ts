/** Превращает ссылку на видео в источник для встраивания. Поддержка: YouTube, VK Видео, Kinescope, Rutube, .mp4 */
export type VideoSource = { kind: "iframe"; src: string } | { kind: "file"; src: string } | null;

export function toVideoSource(url: string): VideoSource {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\./, "");
  if (/\.(mp4|webm|m3u8)$/i.test(u.pathname)) return { kind: "file", src: u.href };
  if (host === "youtu.be") return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}?playsinline=1&rel=0` };
  if (host.endsWith("youtube.com")) {
    const id = u.searchParams.get("v") ?? u.pathname.split("/").pop();
    return id ? { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0` } : null;
  }
  if (host === "kinescope.io") return { kind: "iframe", src: u.pathname.startsWith("/embed/") ? u.href : `https://kinescope.io/embed${u.pathname}` };
  if (host === "rutube.ru") {
    const id = u.pathname.split("/").filter(Boolean).pop();
    return id ? { kind: "iframe", src: `https://rutube.ru/play/embed/${id}` } : null;
  }
  if (host === "vk.com" || host === "vkvideo.ru") {
    if (u.pathname === "/video_ext.php") return { kind: "iframe", src: u.href };
    const m = u.pathname.match(/video(-?\d+)_(\d+)/);
    return m ? { kind: "iframe", src: `https://vk.com/video_ext.php?oid=${m[1]}&id=${m[2]}&hd=2` } : null;
  }
  return null;
}
