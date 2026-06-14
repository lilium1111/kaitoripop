"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { EventPosterPreview } from "@/components/EventPosterPreview";
import { SiteNav } from "@/components/SiteNav";
import { useLocalStorage } from "@/components/useLocalStorage";
import { readFileAsDataUrl } from "@/lib/readFileAsDataUrl";
import type { EventPosterData, EventPrize } from "@/types/eventPoster";

const STORAGE_KEY = "kaitori-event-poster-v1";
const EVENT_POSTER_WIDTH_PX = (210 / 25.4) * 96;
const EVENT_POSTER_HEIGHT_PX = (297 / 25.4) * 96;

type LegacyEventPosterData = Partial<EventPosterData> & {
  details?: string;
  venue?: string;
  weekday?: string;
};

const initialData: EventPosterData = {
  title: "スペシャルトーナメント《未知なる彼方へ！シーズン》",
  eventDate: "6月27日（土）",
  startTime: "11:00",
  capacity: "40名",
  entryFee: "1000円",
  prizes: [{ label: "参加賞", value: "1000円" }],
  summary: "スイスドロー形式で開催します。初心者の方もお気軽にご参加ください。",
  officialUrl: "",
  backgroundScale: 115,
  backgroundX: 0,
  backgroundY: 0,
  overlayOpacity: 42
};

function normalizeData(data: LegacyEventPosterData): EventPosterData {
  const rest = { ...data };
  delete rest.backgroundImage;
  delete rest.details;
  delete rest.venue;
  delete rest.weekday;
  const prizes = Array.isArray(data.prizes)
    ? data.prizes.map((prize) => ({
        label: typeof prize?.label === "string" ? prize.label : "",
        value: typeof prize?.value === "string" ? prize.value : ""
      }))
    : initialData.prizes;
  return { ...initialData, ...rest, prizes: prizes.length > 0 ? prizes : [{ label: "", value: "" }], backgroundImage: undefined };
}

type FieldName = keyof Pick<
  EventPosterData,
  | "title"
  | "eventDate"
  | "startTime"
  | "capacity"
  | "entryFee"
  | "summary"
  | "officialUrl"
>;

type FormSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function FormSection({ title, defaultOpen = true, children }: FormSectionProps) {
  return (
    <details className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm" open={defaultOpen}>
      <summary className="cursor-pointer select-none text-base font-black text-slate-800">{title}</summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function getPosterContentWeight(data: EventPosterData) {
  const prizeWeight = data.prizes.reduce((total, prize) => total + prize.label.length + prize.value.length + 22, 0);
  return data.summary.length + prizeWeight + (data.summary.match(/\n/g) || []).length * 18;
}

export function EventPosterEditor() {
  const [data, setData] = useState<EventPosterData>(initialData);
  const [posterScale, setPosterScale] = useState(0.62);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const { save, load } = useLocalStorage<EventPosterData>(STORAGE_KEY);
  const mayOverflowPoster = getPosterContentWeight(data) > 820;

  useEffect(() => {
    const saved = load();
    if (saved) setData(normalizeData(saved));
  }, [load]);

  useEffect(() => {
    const { backgroundImage, ...serializableData } = data;
    save(serializableData as EventPosterData);
  }, [data, save]);

  useEffect(() => {
    const frame = previewFrameRef.current;
    if (!frame) return;
    const targetFrame = frame;

    function updateScale() {
      const rect = targetFrame.getBoundingClientRect();
      const availableWidth = Math.max(targetFrame.clientWidth - 24, 1);
      const availableHeight = Math.max(window.innerHeight - rect.top - 24, 1);
      const nextScale = Math.min(availableWidth / EVENT_POSTER_WIDTH_PX, availableHeight / EVENT_POSTER_HEIGHT_PX, 1);
      setPosterScale(Number(Math.max(nextScale, 0.3).toFixed(4)));
    }

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(targetFrame);
    window.addEventListener("resize", updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  const updateField = (field: FieldName, value: string) => {
    setData((current) => ({ ...current, [field]: value }));
  };

  const updateNumber = (field: "backgroundScale" | "backgroundX" | "backgroundY" | "overlayOpacity", value: number) => {
    setData((current) => ({ ...current, [field]: value }));
  };

  const updatePrize = (index: number, field: keyof EventPrize, value: string) => {
    setData((current) => ({
      ...current,
      prizes: current.prizes.map((prize, prizeIndex) => (prizeIndex === index ? { ...prize, [field]: value } : prize))
    }));
  };

  const addPrize = () => {
    setData((current) => ({ ...current, prizes: [...current.prizes, { label: "", value: "" }] }));
  };

  const removePrize = (index: number) => {
    setData((current) => {
      const prizes = current.prizes.filter((_, prizeIndex) => prizeIndex !== index);
      return { ...current, prizes: prizes.length > 0 ? prizes : [{ label: "", value: "" }] };
    });
  };

  const movePrize = (index: number, direction: -1 | 1) => {
    setData((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.prizes.length) return current;
      const prizes = [...current.prizes];
      const [target] = prizes.splice(index, 1);
      prizes.splice(nextIndex, 0, target);
      return { ...current, prizes };
    });
  };

  const handleBackgroundUpload = useCallback(async (file: File) => {
    const image = await readFileAsDataUrl(file);
    setData((current) => ({ ...current, backgroundImage: image }));
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    noClick: true,
    onDrop: (files) => {
      const file = files[0];
      if (file) void handleBackgroundUpload(file);
    }
  });

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      const file = imageItem?.getAsFile();
      if (!file) return;
      event.preventDefault();
      void handleBackgroundUpload(file);
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleBackgroundUpload]);

  return (
    <main className="event-poster-page min-h-screen bg-[#edf2fb] px-4 py-6 text-slate-900 lg:px-8 xl:h-screen xl:overflow-hidden">
      <div className="mx-auto grid max-w-[1680px] gap-6 xl:h-full xl:grid-cols-[480px_minmax(0,1fr)]">
        <aside className="event-poster-ui min-w-0 space-y-5 xl:h-full xl:overflow-y-auto xl:overflow-x-hidden xl:pr-2">
          <div className="space-y-3">
            <SiteNav />
            <div>
              <h1 className="text-2xl font-black tracking-normal">大会ポスター作成</h1>
              <p className="mt-1 text-sm text-slate-600">A4縦ポスターの試作品です。入力内容は自動保存されます。</p>
            </div>
          </div>

          <FormSection title="大会情報">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
                大会タイトル
                <textarea className="min-h-20 resize-y rounded border border-slate-300 px-3 py-2 font-normal" rows={2} value={data.title} onChange={(event) => updateField("title", event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                開催日
                <input className="h-10 rounded border border-slate-300 px-3 font-normal" placeholder="6月27日（土） / 毎週土曜日" value={data.eventDate} onChange={(event) => updateField("eventDate", event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                開始時刻
                <input className="h-10 rounded border border-slate-300 px-3 font-normal" value={data.startTime} onChange={(event) => updateField("startTime", event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                定員
                <input className="h-10 rounded border border-slate-300 px-3 font-normal" value={data.capacity} onChange={(event) => updateField("capacity", event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                参加費
                <input className="h-10 rounded border border-slate-300 px-3 font-normal" value={data.entryFee} onChange={(event) => updateField("entryFee", event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
                大会詳細
                <textarea className="min-h-32 resize-y rounded border border-slate-300 px-3 py-2 font-normal" rows={5} value={data.summary} onChange={(event) => updateField("summary", event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
                公式サイトURL
                <input className="h-10 rounded border border-slate-300 px-3 font-normal" placeholder="https://example.com" value={data.officialUrl} onChange={(event) => updateField("officialUrl", event.target.value)} />
              </label>
            </div>
          </FormSection>

          <FormSection title="景品">
            <div className="event-prize-editor-list space-y-3">
              {data.prizes.map((prize, index) => (
                <div className="event-prize-editor-card rounded-[8px] border border-slate-200 bg-slate-50 p-3" key={index}>
                  <div className="event-prize-fields">
                    <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                      景品区分・条件
                      <input className="h-10 min-w-0 rounded border border-slate-300 bg-white px-3 font-normal" placeholder="参加賞 / 優勝" value={prize.label} onChange={(event) => updatePrize(index, "label", event.target.value)} />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
                      景品内容
                      <input className="h-10 min-w-0 rounded border border-slate-300 bg-white px-3 font-normal" placeholder="1000円 / 100万円" value={prize.value} onChange={(event) => updatePrize(index, "value", event.target.value)} />
                    </label>
                  </div>
                  <div className="event-prize-actions">
                    <button aria-label="この景品を上へ移動" className="h-10 rounded border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 disabled:opacity-40" disabled={index === 0} onClick={() => movePrize(index, -1)} type="button">
                      ↑
                    </button>
                    <button aria-label="この景品を下へ移動" className="h-10 rounded border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 disabled:opacity-40" disabled={index === data.prizes.length - 1} onClick={() => movePrize(index, 1)} type="button">
                      ↓
                    </button>
                    <button aria-label="この景品を削除" className="h-10 rounded border border-red-200 bg-white px-3 text-sm font-bold text-red-700" onClick={() => removePrize(index)} type="button">
                      削除
                    </button>
                  </div>
                </div>
              ))}
              <button className="h-10 rounded bg-blue-700 px-4 text-sm font-bold text-white" onClick={addPrize} type="button">
                景品行を追加
              </button>
            </div>
          </FormSection>

          {mayOverflowPoster ? (
            <div className="rounded-[8px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold leading-relaxed text-amber-900">
              大会詳細が長すぎるため、A4用紙内に収まらない可能性があります
            </div>
          ) : null}

          <FormSection title="背景画像">
            <div
              {...getRootProps()}
              className={[
                "rounded-[8px] border border-dashed border-slate-300 bg-slate-50 p-4",
                isDragActive ? "border-blue-500 bg-blue-50" : ""
              ].join(" ")}
            >
              <input {...getInputProps()} />
              <div className="flex flex-wrap items-center gap-3">
                <button className="h-10 rounded bg-blue-700 px-4 text-sm font-bold text-white" onClick={open} type="button">
                  背景画像を選択
                </button>
                <p className="text-sm text-slate-600">ドラッグ＆ドロップ、または画像を貼り付けても設定できます。</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                画像の拡大率 {data.backgroundScale}%
                <input min={100} max={180} type="range" value={data.backgroundScale} onChange={(event) => updateNumber("backgroundScale", Number(event.target.value))} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                横位置 {data.backgroundX}
                <input min={-50} max={50} type="range" value={data.backgroundX} onChange={(event) => updateNumber("backgroundX", Number(event.target.value))} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                縦位置 {data.backgroundY}
                <input min={-50} max={50} type="range" value={data.backgroundY} onChange={(event) => updateNumber("backgroundY", Number(event.target.value))} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                背景オーバーレイ {data.overlayOpacity}%
                <input min={15} max={75} type="range" value={data.overlayOpacity} onChange={(event) => updateNumber("overlayOpacity", Number(event.target.value))} />
              </label>
            </div>
          </FormSection>

        </aside>

        <section className="min-w-0 space-y-3 xl:h-full xl:overflow-hidden">
          <div className="event-poster-ui preview-heading-row flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">リアルタイムプレビュー</h2>
              <p className="text-sm text-slate-600">ポスター本体は 210mm × 297mm の同一DOMです。</p>
            </div>
            <button className="preview-print-button" onClick={() => window.print()} type="button">
              印刷
            </button>
          </div>
          <div
            className="event-poster-print-area rounded-[8px] border border-slate-200 bg-slate-100 p-3"
            ref={previewFrameRef}
          >
            <div
              className="event-poster-scale-shell"
              style={{
                height: EVENT_POSTER_HEIGHT_PX * posterScale,
                width: EVENT_POSTER_WIDTH_PX * posterScale
              }}
            >
              <div className="event-poster-scale" style={{ transform: `scale(${posterScale})` }}>
                <EventPosterPreview data={data} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
