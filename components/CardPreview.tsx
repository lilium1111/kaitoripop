import type { CardItem } from "@/types/popup";

type CardPreviewProps = {
  card: CardItem;
  fontSize: number;
};

function formatPrice(price: number | "") {
  if (price === "") return "";
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(price);
}

function fitNameSize(name: string, base: number) {
  if (name.length > 22) return Math.max(base - 22, 34);
  if (name.length > 16) return Math.max(base - 14, 42);
  if (name.length > 10) return Math.max(base - 8, 48);
  return base;
}

function fitPriceSize(price: string, base: number) {
  if (price.length > 10) return Math.max(base - 12, 74);
  if (price.length > 8) return Math.max(base - 6, 78);
  return base;
}

export function CardPreview({ card, fontSize }: CardPreviewProps) {
  const price = formatPrice(card.price);
  const hasContent = card.name.trim() || price || card.image;
  const exportNameSize = fontSize * 2.15;
  const exportPriceSize = fontSize * 2.9;

  if (!hasContent) return null;

  return (
    <article className="flex h-[var(--card-height)] max-h-[var(--card-height)] w-full max-w-[540px] flex-col overflow-hidden rounded-[18px] bg-white p-[16px] shadow-[0_18px_34px_rgba(4,18,48,0.33)]">
      <div className="flex h-[var(--image-height)] shrink-0 items-center justify-center rounded-[12px] bg-slate-100">
        {card.image ? (
          <img
            alt={card.name || "Card image"}
            className="max-h-full max-w-full object-contain"
            src={card.image}
          />
        ) : (
          <div className="h-[92%] w-[72%] rounded-[14px] border-[6px] border-dashed border-slate-300 bg-white" />
        )}
      </div>

      <div className="mt-[14px] flex h-[var(--name-height)] shrink-0 items-center justify-center rounded-[10px] bg-black px-[10px] text-center">
        {card.name.trim() ? (
          <div
            className="name-stroke line-clamp-2 break-words font-black leading-[1.03] text-[#ffd51f]"
            style={{ fontSize: fitNameSize(card.name, exportNameSize) }}
          >
            {card.name}
          </div>
        ) : null}
      </div>

      <div className="mt-[12px] flex h-[var(--price-height)] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white px-[12px] pb-[8px] pt-[4px] text-center">
        {price ? (
          <div
            className="price-stroke origin-center whitespace-nowrap leading-none"
            style={{ fontSize: fitPriceSize(price, exportPriceSize) }}
          >
            {price}
          </div>
        ) : null}
      </div>
    </article>
  );
}
