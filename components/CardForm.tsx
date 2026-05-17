"use client";

import { useDropzone } from "react-dropzone";
import type { CardItem } from "@/types/popup";

type CardFormProps = {
  card: CardItem;
  isExpanded: boolean;
  index: number;
  total: number;
  onChange: (card: CardItem) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onImageUpload: (file: File) => void;
  onToggle: () => void;
};

export function CardForm({
  card,
  isExpanded,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onImageUpload,
  onToggle
}: CardFormProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: async (files) => {
      const file = files[0];
      if (!file) return;
      onImageUpload(file);
    }
  });
  const formattedPrice =
    card.price === ""
      ? ""
      : new Intl.NumberFormat("ja-JP", {
          style: "currency",
          currency: "JPY",
          maximumFractionDigits: 0
        }).format(card.price);
  const displayName = card.name.trim() || "\u30ab\u30fc\u30c9\u540d\u672a\u5165\u529b";

  return (
    <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <button
          className="min-w-0 text-left text-sm font-bold text-slate-700"
          onClick={onToggle}
          type="button"
        >
          {"\u30ab\u30fc\u30c9"} {index + 1}
        </button>
        <div className="flex gap-1">
          <button
            className="h-8 rounded border border-slate-200 px-2 text-xs font-bold disabled:opacity-35"
            disabled={index === 0}
            onClick={onMoveUp}
            type="button"
          >
            {"\u4e0a\u3078"}
          </button>
          <button
            className="h-8 rounded border border-slate-200 px-2 text-xs font-bold disabled:opacity-35"
            disabled={index === total - 1}
            onClick={onMoveDown}
            type="button"
          >
            {"\u4e0b\u3078"}
          </button>
          <button
            className="h-8 rounded bg-rose-50 px-2 text-xs font-bold text-rose-700"
            onClick={onDelete}
            type="button"
          >
            {"\u524a\u9664"}
          </button>
        </div>
      </div>

      {!isExpanded ? (
        <button
          className="grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-left transition hover:bg-slate-50"
          onClick={onToggle}
          type="button"
        >
          <span className="flex h-14 w-11 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
            {card.image ? (
              <img alt="" className="h-full w-full object-contain" src={card.image} />
            ) : (
              <span className="text-[10px] font-bold text-slate-400">No image</span>
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-800">{displayName}</span>
            <span className="mt-0.5 block text-sm font-black text-rose-700">
              {formattedPrice || "\u4fa1\u683c\u672a\u5165\u529b"}
            </span>
          </span>
          <span className="rounded bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
            {"\u7de8\u96c6"}
          </span>
        </button>
      ) : null}

      {isExpanded ? (
      <div className="grid gap-2 px-3 py-3">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          {"\u30ab\u30fc\u30c9\u540d"}
          <input
            className="h-10 rounded border border-slate-300 px-3 font-normal"
            onChange={(event) => onChange({ ...card, name: event.target.value })}
            placeholder="Shock Charmer"
            value={card.name}
          />
        </label>

        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          {"\u8cb7\u53d6\u4fa1\u683c"}
          <input
            className="h-10 rounded border border-slate-300 px-3 font-normal"
            inputMode="numeric"
            onChange={(event) => {
              const raw = event.target.value.replace(/[^\d]/g, "");
              onChange({ ...card, price: raw ? Number(raw) : "" });
            }}
            placeholder="13000"
            value={card.price === "" ? "" : card.price}
          />
        </label>

        <div className="flex items-center gap-3 rounded border border-slate-200 bg-slate-50 p-2">
          <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-white ring-1 ring-slate-200">
            {card.image ? (
              <img alt="" className="h-full w-full object-contain" src={card.image} />
            ) : (
              <span className="px-1 text-center text-[10px] font-bold leading-tight text-slate-400">
                No image
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <button
              {...getRootProps()}
              className={[
                "h-10 w-full rounded bg-blue-700 px-3 text-sm font-bold text-white transition",
                isDragActive ? "bg-blue-800 ring-2 ring-blue-200" : ""
              ].join(" ")}
              type="button"
            >
              <input {...getInputProps()} />
              {"\u753b\u50cf\u3092\u5909\u66f4"}
            </button>
            <p className="mt-1 text-xs text-slate-500">
              {"\u30bf\u30c3\u30d7\u307e\u305f\u306f\u30c9\u30ed\u30c3\u30d7"}
            </p>
          </div>
        </div>
      </div>
      ) : null}
    </section>
  );
}
