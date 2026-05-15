"use client";

import { useDropzone } from "react-dropzone";
import type { CardItem } from "@/types/popup";

type CardFormProps = {
  card: CardItem;
  index: number;
  total: number;
  onChange: (card: CardItem) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CardForm({
  card,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown
}: CardFormProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: async (files) => {
      const file = files[0];
      if (!file) return;
      onChange({ ...card, image: await readFileAsDataUrl(file) });
    }
  });

  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-700">
          {"\u30ab\u30fc\u30c9"} {index + 1}
        </h3>
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

      <div className="grid gap-3">
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

        <div
          {...getRootProps()}
          className={[
            "flex min-h-24 cursor-pointer items-center justify-center rounded border border-dashed px-3 py-4 text-center text-sm transition",
            isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"
          ].join(" ")}
        >
          <input {...getInputProps()} />
          {card.image ? (
            <div className="flex items-center gap-3">
              <img alt="" className="h-16 w-12 object-contain" src={card.image} />
              <span className="font-semibold text-slate-600">{"\u753b\u50cf\u3092\u5909\u66f4"}</span>
            </div>
          ) : (
            <span className="text-slate-500">{"\u753b\u50cf\u3092\u30c9\u30e9\u30c3\u30b0\u307e\u305f\u306f\u30af\u30ea\u30c3\u30af"}</span>
          )}
        </div>
      </div>
    </section>
  );
}
