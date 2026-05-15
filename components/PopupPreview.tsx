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
    let cancelled = false;

    async function render() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      await drawPoster(canvas, data);
      if (cancelled) return;
    }

    void render();

    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <div className="w-full overflow-hidden rounded-[8px] border border-slate-200 bg-slate-100 p-3 xl:h-[calc(100vh-7.5rem)]">
      <div className="flex h-full w-full items-start justify-center overflow-hidden">
        <canvas
          className="block origin-top scale-[0.18] rounded-[2px] shadow-lg sm:scale-[0.24] lg:scale-[0.28] xl:scale-[0.22] 2xl:scale-[0.26]"
          height={POSTER_HEIGHT}
          ref={canvasRef}
          style={{
            height: POSTER_HEIGHT,
            width: POSTER_WIDTH
          }}
          width={POSTER_WIDTH}
        />
      </div>
    </div>
  );
}
