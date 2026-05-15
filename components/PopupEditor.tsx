"use client";

import { useMemo, useRef, useState } from "react";
import { CardForm } from "@/components/CardForm";
import { PopupPreview } from "@/components/PopupPreview";
import { useLocalStorage } from "@/components/useLocalStorage";
import { copyPosterToClipboard, exportToPng } from "@/lib/exportToPng";
import type { CardItem, PopupData } from "@/types/popup";

const STORAGE_KEY = "kaitori-pop-template-v1";

function makeId() {
  return crypto.randomUUID();
}

function getTodayLabel() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function createEmptyCard(): CardItem {
  return {
    id: makeId(),
    name: "",
    price: ""
  };
}

function createInitialData(): PopupData {
  return {
    title: "\u9ad8\u4fa1\u8cb7\u53d6\uff01",
    updateDate: getTodayLabel(),
    columns: 4,
    gap: 18,
    fontSize: 30,
    cards: Array.from({ length: 12 }, createEmptyCard)
  };
}

function normalizeTemplate(data: Partial<PopupData>): PopupData {
  return {
    ...createInitialData(),
    ...data,
    cards: (data.cards || []).map((card) => ({
      id: card.id || makeId(),
      name: card.name || "",
      price: card.price === "" || card.price == null ? "" : Number(card.price),
      image: card.image
    }))
  };
}

export function PopupEditor() {
  const [data, setData] = useState<PopupData>(() => createInitialData());
  const [expandedCardId, setExpandedCardId] = useState(() => data.cards[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const previewRef = useRef<HTMLCanvasElement>(null);
  const { save, load } = useLocalStorage<PopupData>(STORAGE_KEY);

  const visibleCardCount = useMemo(
    () => data.cards.filter((card) => card.name.trim() || card.price !== "" || card.image).length,
    [data.cards]
  );

  function updateCard(index: number, card: CardItem) {
    setExpandedCardId(card.id);
    setData((current) => ({
      ...current,
      cards: current.cards.map((item, itemIndex) => (itemIndex === index ? card : item))
    }));
  }

  function moveCard(index: number, direction: -1 | 1) {
    const movingCardId = data.cards[index]?.id;
    if (movingCardId) {
      setExpandedCardId(movingCardId);
    }
    setData((current) => {
      const next = [...current.cards];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return current;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return { ...current, cards: next };
    });
  }

  async function downloadPng() {
    if (!previewRef.current) return;
    await exportToPng(previewRef.current, `kaitori-pop-${data.updateDate.replaceAll("/", "-")}.png`);
  }

  async function copyImage() {
    if (!previewRef.current) return;

    try {
      await copyPosterToClipboard(previewRef.current);
      setMessage("\u753b\u50cf\u3092\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f");
    } catch {
      setMessage(
        "\u30d6\u30e9\u30a6\u30b6\u306e\u5236\u9650\u306b\u3088\u308a\u30b3\u30d4\u30fc\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002PNG\u30c0\u30a6\u30f3\u30ed\u30fc\u30c9\u3092\u4f7f\u7528\u3057\u3066\u304f\u3060\u3055\u3044"
      );
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef4ff] px-4 py-6 text-slate-900 lg:px-8 xl:h-screen xl:overflow-hidden">
      <div className="mx-auto grid max-w-[1680px] gap-6 xl:h-full xl:grid-cols-[520px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-5 xl:h-full xl:overflow-y-auto xl:overflow-x-hidden xl:pr-2">
          <div>
            <h1 className="text-2xl font-black tracking-normal">
              {"\u8cb7\u53d6\u30dd\u30c3\u30d7\u753b\u50cf\u30b8\u30a7\u30cd\u30ec\u30fc\u30bf\u30fc"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {"\u5370\u5237\u5411\u3051 A4 \u7e26\u30b5\u30a4\u30ba\u3068 X \u6295\u7a3f\u5411\u3051\u306e\u9ad8\u89e3\u50cf\u5ea6 PNG \u3092\u4f5c\u6210\u3057\u307e\u3059\u3002"}
            </p>
          </div>

          <section className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-0 xl:z-20 xl:shadow-lg">
            <h2 className="mb-4 text-base font-black">{"\u5168\u4f53\u8a2d\u5b9a"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
                {"\u30bf\u30a4\u30c8\u30eb"}
                <input
                  className="h-10 min-w-0 rounded border border-slate-300 px-3 font-normal"
                  onChange={(event) => setData({ ...data, title: event.target.value })}
                  value={data.title}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                {"\u66f4\u65b0\u65e5"}
                <input
                  className="h-10 min-w-0 rounded border border-slate-300 px-3 font-normal"
                  onChange={(event) => setData({ ...data, updateDate: event.target.value })}
                  placeholder="2026/05/15"
                  value={data.updateDate}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                {"\u5217\u6570"}
                <select
                  className="h-10 min-w-0 rounded border border-slate-300 px-3 font-normal"
                  onChange={(event) => setData({ ...data, columns: Number(event.target.value) })}
                  value={data.columns}
                >
                  <option value={2}>{"2\u5217"}</option>
                  <option value={3}>{"3\u5217"}</option>
                  <option value={4}>{"4\u5217"}</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                {"\u30ab\u30fc\u30c9\u9593\u306e\u4f59\u767d"}
                <input
                  className="h-10 min-w-0 rounded border border-slate-300 px-3 font-normal"
                  max={36}
                  min={8}
                  onChange={(event) => setData({ ...data, gap: Number(event.target.value) })}
                  type="number"
                  value={data.gap}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
                {"\u30d5\u30a9\u30f3\u30c8\u30b5\u30a4\u30ba"}
                <input
                  className="w-full min-w-0"
                  max={42}
                  min={20}
                  onChange={(event) => setData({ ...data, fontSize: Number(event.target.value) })}
                  type="range"
                  value={data.fontSize}
                />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button
                className="h-10 rounded bg-slate-900 px-3 text-sm font-bold text-white"
                onClick={() => {
                  save(data);
                  setMessage("\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3092\u4fdd\u5b58\u3057\u307e\u3057\u305f\u3002");
                }}
                type="button"
              >
                {"\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u4fdd\u5b58"}
              </button>
              <button
                className="h-10 rounded bg-white px-3 text-sm font-bold ring-1 ring-slate-300"
                onClick={() => {
                  const saved = load();
                  if (saved) {
                    const nextData = normalizeTemplate(saved);
                    setData(nextData);
                    setExpandedCardId(nextData.cards[0]?.id ?? "");
                    setMessage("\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3092\u8aad\u307f\u8fbc\u307f\u307e\u3057\u305f\u3002");
                  } else {
                    setMessage("\u4fdd\u5b58\u6e08\u307f\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u304c\u3042\u308a\u307e\u305b\u3093\u3002");
                  }
                }}
                type="button"
              >
                {"\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u8aad\u8fbc"}
              </button>
              <button
                className="h-10 rounded bg-blue-700 px-3 text-sm font-black text-white"
                onClick={copyImage}
                type="button"
              >
                {"\u753b\u50cf\u3092\u30b3\u30d4\u30fc"}
              </button>
              <button
                className="h-10 rounded bg-red-600 px-3 text-sm font-black text-white"
                onClick={downloadPng}
                type="button"
              >
                PNG{"\u30c0\u30a6\u30f3\u30ed\u30fc\u30c9"}
              </button>
            </div>
            {message ? <p className="mt-3 text-sm font-semibold text-blue-700">{message}</p> : null}
          </section>

          <section className="space-y-3 pb-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-black">{"\u30ab\u30fc\u30c9\u5165\u529b"}</h2>
              <button
                className="h-10 shrink-0 rounded bg-blue-700 px-4 text-sm font-bold text-white"
                onClick={() => {
                  const card = createEmptyCard();
                  setData({ ...data, cards: [...data.cards, card] });
                  setExpandedCardId(card.id);
                }}
                type="button"
              >
                {"\u30ab\u30fc\u30c9\u8ffd\u52a0"}
              </button>
            </div>
            <div className="space-y-3">
              {data.cards.map((card, index) => (
                <CardForm
                  card={card}
                  isExpanded={expandedCardId === card.id}
                  index={index}
                  key={card.id}
                  onChange={(nextCard) => updateCard(index, nextCard)}
                  onDelete={() => {
                    const nextCards = data.cards.filter((item) => item.id !== card.id);
                    if (expandedCardId === card.id) {
                      setExpandedCardId(nextCards[index]?.id ?? nextCards[index - 1]?.id ?? "");
                    }
                    setData({
                      ...data,
                      cards: nextCards
                    });
                  }}
                  onMoveDown={() => moveCard(index, 1)}
                  onMoveUp={() => moveCard(index, -1)}
                  onToggle={() => setExpandedCardId(expandedCardId === card.id ? "" : card.id)}
                  total={data.cards.length}
                />
              ))}
            </div>
          </section>
        </aside>

        <section className="min-w-0 space-y-3 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)] xl:overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{"\u30ea\u30a2\u30eb\u30bf\u30a4\u30e0\u30d7\u30ec\u30d3\u30e5\u30fc"}</h2>
              <p className="text-sm text-slate-600">
                {"\u51fa\u529b\u30b5\u30a4\u30ba"} 2480 x 3508px / {"\u8868\u793a\u30ab\u30fc\u30c9"} {visibleCardCount} {"\u679a"}
              </p>
            </div>
          </div>
          <PopupPreview data={data} previewRef={previewRef} />
        </section>
      </div>
    </main>
  );
}
