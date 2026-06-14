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
const EVENT_POSTER_EXPORT_WIDTH = 1240;
const EVENT_POSTER_EXPORT_HEIGHT = 1754;
const EVENT_TITLE_SCALE_MIN = 50;
const EVENT_TITLE_SCALE_MAX = 150;
const DEFAULT_TOP_WELCOME_MESSAGES = ["初心者歓迎/競技大会"];
const DEFAULT_SUPPORT_MESSAGES = ["ルールが不安でも大丈夫", "見学もお気軽に", "とかそういうメッセージ"];

type LegacyEventPosterData = Partial<EventPosterData> & {
  details?: string;
  venue?: string;
  weekday?: string;
};

const initialData: EventPosterData = {
  title: "大会名",
  eventTitleScale: 81,
  topWelcomeMessages: DEFAULT_TOP_WELCOME_MESSAGES,
  supportMessages: DEFAULT_SUPPORT_MESSAGES,
  eventDate: "6月27日（土）",
  startTime: "11:00",
  capacity: "40名",
  entryFee: "1000円",
  prizes: [
    { label: "参加賞", value: "1000円" },
    { label: "優勝", value: "3000円分の商品券" }
  ],
  summary: "スイスドロー形式で開催します。\n初心者の方もお気軽にご参加ください。",
  officialUrl: "",
  backgroundScale: 115,
  backgroundX: 0,
  backgroundY: 0,
  overlayOpacity: 42
};

function clampEventTitleScale(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) return initialData.eventTitleScale;
  return Math.min(EVENT_TITLE_SCALE_MAX, Math.max(EVENT_TITLE_SCALE_MIN, Math.round(numericValue)));
}

function normalizeData(data: LegacyEventPosterData): EventPosterData {
  const rest = { ...data };
  delete rest.backgroundImage;
  delete rest.details;
  delete rest.venue;
  delete rest.weekday;
  delete rest.eventTitleScale;
  delete rest.topWelcomeMessages;
  delete rest.supportMessages;
  const prizes = Array.isArray(data.prizes)
    ? data.prizes.map((prize) => ({
        label: typeof prize?.label === "string" ? prize.label : "",
        value: typeof prize?.value === "string" ? prize.value : ""
      }))
    : initialData.prizes;
  const topWelcomeMessages = Array.isArray(data.topWelcomeMessages)
    ? data.topWelcomeMessages.map((message) => (typeof message === "string" ? message : ""))
    : initialData.topWelcomeMessages;
  const supportMessages = Array.isArray(data.supportMessages)
    ? data.supportMessages.map((message) => (typeof message === "string" ? message : ""))
    : initialData.supportMessages;
  return {
    ...initialData,
    ...rest,
    eventTitleScale: data.eventTitleScale === undefined ? initialData.eventTitleScale : clampEventTitleScale(data.eventTitleScale),
    topWelcomeMessages,
    supportMessages,
    prizes: prizes.length > 0 ? prizes : [{ label: "", value: "" }],
    backgroundImage: undefined
  };
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

type ImageGenerationAction = "copy" | "download" | "share";

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

type MessageListEditorProps = {
  addLabel: string;
  messages: string[];
  placeholder: string;
  onAdd: () => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, value: string) => void;
};

function MessageListEditor({
  addLabel,
  messages,
  placeholder,
  onAdd,
  onMove,
  onRemove,
  onUpdate
}: MessageListEditorProps) {
  return (
    <div className="space-y-3">
      {messages.map((message, index) => (
        <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-3" key={index}>
          <label className="grid min-w-0 gap-1 text-sm font-semibold text-slate-700">
            メッセージ {index + 1}
            <input
              className="h-10 min-w-0 rounded border border-slate-300 bg-white px-3 font-normal"
              placeholder={placeholder}
              value={message}
              onChange={(event) => onUpdate(index, event.target.value)}
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button aria-label="このメッセージを上へ移動" className="h-10 rounded border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 disabled:opacity-40" disabled={index === 0} onClick={() => onMove(index, -1)} type="button">
              ↑
            </button>
            <button aria-label="このメッセージを下へ移動" className="h-10 rounded border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 disabled:opacity-40" disabled={index === messages.length - 1} onClick={() => onMove(index, 1)} type="button">
              ↓
            </button>
            <button aria-label="このメッセージを削除" className="h-10 rounded border border-red-200 bg-white px-3 text-sm font-bold text-red-700" onClick={() => onRemove(index)} type="button">
              削除
            </button>
          </div>
        </div>
      ))}
      <button className="h-10 rounded bg-blue-700 px-4 text-sm font-bold text-white" onClick={onAdd} type="button">
        {addLabel}
      </button>
    </div>
  );
}

function getPosterContentWeight(data: EventPosterData) {
  const prizeWeight = data.prizes.reduce((total, prize) => total + prize.label.length + prize.value.length + 22, 0);
  return data.summary.length + prizeWeight + (data.summary.match(/\n/g) || []).length * 18;
}

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

async function waitForPosterImages(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) return;
      if (typeof image.decode === "function") {
        await image.decode();
      }
      if (!image.complete || image.naturalWidth === 0) {
        throw new Error("Poster image failed to load.");
      }
    })
  );
}

async function waitForQrCode(element: HTMLElement, officialUrl: string) {
  if (!officialUrl.trim()) return;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const qrImage = element.querySelector<HTMLImageElement>('img[alt="公式サイトQRコード"]');
    if (qrImage?.complete && qrImage.naturalWidth > 0) return;
    await waitForAnimationFrame();
  }

  throw new Error("QR code is not ready.");
}

function getPosterFileName(title: string) {
  const safeTitle = title
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return safeTitle ? `${safeTitle}-event-poster.png` : "event-poster.png";
}

export function EventPosterEditor() {
  const [data, setData] = useState<EventPosterData>(initialData);
  const [posterScale, setPosterScale] = useState(0.62);
  const [imageGenerationAction, setImageGenerationAction] = useState<ImageGenerationAction | null>(null);
  const [imageExportMessage, setImageExportMessage] = useState("");
  const [canCopyImage, setCanCopyImage] = useState(false);
  const [canShareImage, setCanShareImage] = useState(false);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const exportPosterRef = useRef<HTMLDivElement>(null);
  const { save, load } = useLocalStorage<EventPosterData>(STORAGE_KEY);
  const mayOverflowPoster = getPosterContentWeight(data) > 820;
  const visiblePrizeCount = data.prizes.filter((prize) => prize.label.trim().length > 0 || prize.value.trim().length > 0).length;
  const hasManyPrizes = visiblePrizeCount > 10;
  const mayTitleOverflow = data.eventTitleScale > 130 && data.title.trim().length > 18;

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

  useEffect(() => {
    setCanCopyImage("ClipboardItem" in window && Boolean(navigator.clipboard?.write));

    if (typeof navigator.canShare !== "function" || typeof File === "undefined") {
      setCanShareImage(false);
      return;
    }

    const testFile = new File([""], "event-poster.png", { type: "image/png" });
    setCanShareImage(navigator.canShare({ files: [testFile] }));
  }, []);

  useEffect(() => {
    if (!imageExportMessage) return;

    const timer = window.setTimeout(() => {
      setImageExportMessage("");
    }, imageExportMessage.includes("しました") || imageExportMessage.includes("開きました") ? 3000 : 5000);

    return () => window.clearTimeout(timer);
  }, [imageExportMessage]);

  const updateField = (field: FieldName, value: string) => {
    setData((current) => ({ ...current, [field]: value }));
  };

  const updateNumber = (field: "eventTitleScale" | "backgroundScale" | "backgroundX" | "backgroundY" | "overlayOpacity", value: number) => {
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

  const updateMessage = (field: "topWelcomeMessages" | "supportMessages", index: number, value: string) => {
    setData((current) => ({
      ...current,
      [field]: current[field].map((message, messageIndex) => (messageIndex === index ? value : message))
    }));
  };

  const addMessage = (field: "topWelcomeMessages" | "supportMessages") => {
    setData((current) => ({ ...current, [field]: [...current[field], ""] }));
  };

  const removeMessage = (field: "topWelcomeMessages" | "supportMessages", index: number) => {
    setData((current) => ({ ...current, [field]: current[field].filter((_, messageIndex) => messageIndex !== index) }));
  };

  const moveMessage = (field: "topWelcomeMessages" | "supportMessages", index: number, direction: -1 | 1) => {
    setData((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current[field].length) return current;
      const messages = [...current[field]];
      const [target] = messages.splice(index, 1);
      messages.splice(nextIndex, 0, target);
      return { ...current, [field]: messages };
    });
  };

  const createPosterPngBlob = async () => {
    const host = exportPosterRef.current;
    const posterElement = host?.querySelector<HTMLElement>(".event-poster");
    if (!posterElement) throw new Error("Poster export element is not ready.");

    await waitForAnimationFrame();
    await waitForAnimationFrame();
    await document.fonts.ready;
    await waitForQrCode(posterElement, data.officialUrl);
    await waitForPosterImages(posterElement);

    const { toBlob } = await import("html-to-image");
    const blob = await toBlob(posterElement, {
      backgroundColor: "#fff7ed",
      cacheBust: true,
      canvasHeight: EVENT_POSTER_EXPORT_HEIGHT,
      canvasWidth: EVENT_POSTER_EXPORT_WIDTH,
      height: posterElement.getBoundingClientRect().height,
      pixelRatio: 1,
      width: posterElement.getBoundingClientRect().width
    });

    if (!blob) throw new Error("Failed to create poster image.");
    return blob;
  };

  const handleCopyPosterImage = async () => {
    if (imageGenerationAction) return;

    setImageGenerationAction("copy");
    setImageExportMessage("");

    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        throw new Error("このブラウザーは画像コピーに対応していません。");
      }

      if (!document.hasFocus()) {
        throw new DOMException("ページ内をクリックしてから、もう一度画像コピーを実行してください。", "NotAllowedError");
      }

      const blobPromise = createPosterPngBlob().then((blob) => {
        if (!blob) {
          throw new Error("PNG画像を生成できませんでした。");
        }
        return blob;
      });

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blobPromise
        })
      ]);
      setImageExportMessage("ポスター画像をコピーしました。");
    } catch (error) {
      console.error("Failed to copy poster image:", error);

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setImageExportMessage(
          document.hasFocus()
            ? "ブラウザーに画像コピーを拒否されました。PNG保存をご利用ください。"
            : "ページ内をクリックしてから、もう一度画像コピーを実行してください。"
        );
      } else if (error instanceof TypeError) {
        setImageExportMessage("このブラウザーでは直接画像をコピーできません。PNG保存をご利用ください。");
      } else {
        setImageExportMessage("画像をコピーできませんでした。PNG保存をご利用ください。");
      }
    } finally {
      setImageGenerationAction(null);
    }
  };

  const runImageGeneration = async (action: Exclude<ImageGenerationAction, "copy">) => {
    if (imageGenerationAction) return;

    setImageGenerationAction(action);
    setImageExportMessage("");

    try {
      const blob = await createPosterPngBlob();
      const fileName = getPosterFileName(data.title);

      if (action === "download") {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setImageExportMessage("PNG画像を保存しました。");
        return;
      }

      const file = new File([blob], fileName, { type: "image/png" });
      if (typeof navigator.canShare !== "function" || !navigator.canShare({ files: [file] }) || typeof navigator.share !== "function") {
        throw new Error("File sharing is not supported.");
      }
      await navigator.share({
        files: [file],
        title: "大会ポスター"
      });
      setImageExportMessage("共有メニューを開きました。");
    } catch (error) {
      console.error(error);
      setImageExportMessage("画像を生成できませんでした。背景画像やQRコードの読み込み後にもう一度お試しください。");
    } finally {
      setImageGenerationAction(null);
    }
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
    <main className="event-poster-page min-h-screen bg-[#edf2fb] px-4 py-6 text-slate-900 lg:px-8 xl:h-dvh xl:min-h-0 xl:overflow-hidden">
      <div className="event-poster-workspace mx-auto grid max-w-[1680px] gap-6 xl:h-full xl:min-h-0 xl:grid-cols-[480px_minmax(0,1fr)]">
        <aside className="event-poster-ui event-poster-editor-column min-w-0 space-y-5 xl:min-h-0 xl:overflow-y-auto xl:overflow-x-hidden xl:pr-2">
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
              <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
                大会名の文字サイズ {data.eventTitleScale}%
                <input min={EVENT_TITLE_SCALE_MIN} max={EVENT_TITLE_SCALE_MAX} step={1} type="range" value={data.eventTitleScale} onChange={(event) => updateNumber("eventTitleScale", Number(event.target.value))} />
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
                詳細
                <textarea className="min-h-32 resize-y rounded border border-slate-300 px-3 py-2 font-normal" rows={5} value={data.summary} onChange={(event) => updateField("summary", event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
                公式サイトURL
                <input className="h-10 rounded border border-slate-300 px-3 font-normal" placeholder="https://example.com" value={data.officialUrl} onChange={(event) => updateField("officialUrl", event.target.value)} />
              </label>
            </div>
          </FormSection>

          <FormSection title="上部の歓迎メッセージ">
            <MessageListEditor
              addLabel="歓迎メッセージを追加"
              messages={data.topWelcomeMessages}
              placeholder="初心者歓迎！"
              onAdd={() => addMessage("topWelcomeMessages")}
              onMove={(index, direction) => moveMessage("topWelcomeMessages", index, direction)}
              onRemove={(index) => removeMessage("topWelcomeMessages", index)}
              onUpdate={(index, value) => updateMessage("topWelcomeMessages", index, value)}
            />
          </FormSection>

          <FormSection title="タイトル下の案内メッセージ">
            <MessageListEditor
              addLabel="案内メッセージを追加"
              messages={data.supportMessages}
              placeholder="ルールが不安でも大丈夫"
              onAdd={() => addMessage("supportMessages")}
              onMove={(index, direction) => moveMessage("supportMessages", index, direction)}
              onRemove={(index) => removeMessage("supportMessages", index)}
              onUpdate={(index, value) => updateMessage("supportMessages", index, value)}
            />
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

          {mayOverflowPoster || hasManyPrizes || mayTitleOverflow ? (
            <div className="rounded-[8px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold leading-relaxed text-amber-900">
              大会名の文字サイズ・詳細・景品行の量により、A4用紙内に収まらない可能性があります
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

        <section className="event-poster-preview-column relative min-w-0 space-y-3 xl:h-full xl:min-h-0 xl:overflow-hidden">
          <div className="event-poster-ui preview-heading-row flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">リアルタイムプレビュー</h2>
              <p className="text-sm text-slate-600">ポスター本体は 210mm × 297mm の同一DOMです。</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button className="preview-print-button" onClick={() => window.print()} type="button">
                印刷
              </button>
              {canCopyImage ? (
                <button className="preview-print-button" disabled={Boolean(imageGenerationAction)} onClick={() => void handleCopyPosterImage()} type="button">
                  {imageGenerationAction === "copy" ? "画像を生成中…" : "画像をコピー"}
                </button>
              ) : null}
              <button className="preview-print-button" disabled={Boolean(imageGenerationAction)} onClick={() => void runImageGeneration("download")} type="button">
                {imageGenerationAction === "download" ? "画像を生成中…" : "PNGを保存"}
              </button>
              {canShareImage ? (
                <button className="preview-print-button" disabled={Boolean(imageGenerationAction)} onClick={() => void runImageGeneration("share")} type="button">
                  {imageGenerationAction === "share" ? "画像を生成中…" : "画像を共有"}
                </button>
              ) : null}
            </div>
          </div>
          {imageExportMessage ? (
            <div className="event-poster-ui event-poster-toast" role="status" aria-live="polite">
              {imageExportMessage}
            </div>
          ) : null}
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
      <div aria-hidden="true" className="event-poster-export-host" ref={exportPosterRef}>
        <EventPosterPreview data={data} />
      </div>
    </main>
  );
}
