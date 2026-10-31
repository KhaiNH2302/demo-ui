import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { ImageLightbox, type MediaImageItem } from '@/components/shared/ImageLightbox';

export function ActivityImageSlider({ images, title, compact = false }: { images: MediaImageItem[]; title: string; compact?: boolean }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  if (!images.length) return null;
  const current = Math.min(index, images.length - 1);
  const image = images[current];
  const move = (delta: number) => setIndex((current + delta + images.length) % images.length);
  return <section aria-label="Hình ảnh chương trình" aria-roledescription="carousel" className="space-y-3" onKeyDown={e => { if (open) return; if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); } if (e.key === 'ArrowRight') { e.preventDefault(); move(1); } }}>
    <div className={`relative overflow-hidden bg-neutral-100 ${compact ? "" : "rounded-2xl border border-neutral-200"}`}>
      <button type="button" aria-label={`Mở ảnh ${current + 1}: ${image.alt || title}`} className={`${compact ? "aspect-video" : "h-64 sm:h-96"} block w-full focus-visible:outline-2 focus-visible:outline-brand-500`} onClick={() => setOpen(true)}>
        {failed[image.url] ? <ImageOff className="mx-auto text-neutral-400" size={40}/> : <img src={image.url} alt={image.alt || image.caption || title} className={`h-full w-full ${compact ? "object-cover" : "object-contain"}`} onError={() => setFailed(f => ({...f, [image.url]: true}))}/>}
      </button>
      {images.length > 1 && <><button type="button" aria-label="Ảnh trước" onClick={() => move(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-3 text-white focus-visible:outline-2"><ChevronLeft size={22}/></button><button type="button" aria-label="Ảnh tiếp theo" onClick={() => move(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-3 text-white focus-visible:outline-2"><ChevronRight size={22}/></button></>}
      <span aria-live="polite" className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-sm text-white">{current + 1} / {images.length}</span>
    </div>
    {!compact && image.caption && <p className="text-sm text-neutral-600">{image.caption}</p>}
    {!compact && images.length > 1 && <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Chọn ảnh">{images.map((img,i) => <button type="button" key={img.id || img.url} aria-label={`Xem ảnh ${i+1}`} aria-pressed={i===current} onClick={() => setIndex(i)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${i===current ? 'border-brand-500' : 'border-transparent'}`}><img src={img.thumbnailUrl || img.url} alt={img.alt || `Ảnh ${i+1}`} className="h-full w-full object-cover"/></button>)}</div>}
    <ImageLightbox images={images} index={open ? current : null} onClose={() => setOpen(false)} onChangeIndex={setIndex}/>
  </section>;
}
