"use client";

import { useEffect, useRef } from "react";
import { drawPoster, POSTER_HEIGHT, POSTER_WIDTH } from "@/lib/drawPoster";
import type { PopupData } from "@/types/popup";

type PopupPreviewProps = {
  data: PopupData;
  previewRef?: React.Ref<HTMLCanvasElement>;
};

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  ref.current = value;
}

export function PopupPreview({ data, previewRef }: PopupPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    assignRef(previewRef, canvasRef.current);
    return () => assignRef(previewRef, null);
  }, [previewRef]);

  useEffect(() => {
    const controller = new AbortController();
    let frameId: number | undefined;

    const timeoutId = window.setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      frameId = window.requestAnimationFrame(() => {
        void drawPoster(canvas, data, { signal: controller.signal });
      });
    }, 150);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [data]);

  return (
    <div className="w-full rounded-[8px] border border-slate-200 bg-slate-100 p-3 xl:h-[calc(100vh-7.5rem)]">
      <div className="flex h-full min-h-[420px] w-full items-center justify-center overflow-auto xl:min-h-0">
        <canvas
          className="block h-auto max-h-full max-w-full rounded-[2px] shadow-lg"
          height={POSTER_HEIGHT}
          ref={canvasRef}
          style={{
            aspectRatio: `${POSTER_WIDTH} / ${POSTER_HEIGHT}`,
            width: `min(100%, calc((100vh - 9rem) * ${POSTER_WIDTH / POSTER_HEIGHT}))`
          }}
          width={POSTER_WIDTH}
        />
      </div>
    </div>
  );
}
