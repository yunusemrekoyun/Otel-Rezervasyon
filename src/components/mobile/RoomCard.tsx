// Room card used in the Rooms list and Home "Öne Çıkan Odalar" carousel
// (design-refs/refs.pdf): top image, then name (serif) + subtitle + meta on the
// left, price (peach) + "İncele" (beige) on the right.
export function RoomCard({
  image,
  name,
  subtitle,
  priceText,
  perNight,
  meta,
  ctaLabel,
  onSelect,
  className,
}: {
  image: string;
  name: string;
  subtitle?: string;
  priceText: string;
  perNight: string;
  meta: string;
  ctaLabel: string;
  onSelect?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-hotel-border bg-hotel-surface ${className ?? ''}`}
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-hotel-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={name} className="h-full w-full object-cover" />
      </div>

      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="font-serif text-lg font-bold leading-snug text-hotel-text-primary">
            {name}
          </h3>
          {subtitle && (
            <p className="mt-0.5 font-hotel text-sm text-hotel-text-muted">{subtitle}</p>
          )}
          <p className="mt-1 font-hotel text-sm text-hotel-text-muted">{meta}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <p className="whitespace-nowrap font-hotel text-sm">
            <span className="font-bold text-hotel-peach">{priceText}</span>{' '}
            <span className="text-hotel-text-muted">{perNight}</span>
          </p>
          <button
            type="button"
            onClick={onSelect}
            className="btn-hotel-secondary h-9 px-4 text-sm"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
