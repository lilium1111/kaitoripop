"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { EventPosterData } from "@/types/eventPoster";

type EventPosterPreviewProps = {
  data: EventPosterData;
};

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getTitleSizeClass(title: string) {
  const length = title.trim().length;
  if (length <= 8) return "text-[92pt] leading-[0.9]";
  if (length <= 18) return "text-[76pt] leading-[0.94]";
  if (length <= 32) return "text-[60pt] leading-[1]";
  return "text-[48pt] leading-[1.05]";
}

export function EventPosterPreview({ data }: EventPosterPreviewProps) {
  const [qrCode, setQrCode] = useState("");
  const hasOfficialUrl = data.officialUrl.trim().length > 0;
  const url = normalizeUrl(data.officialUrl);
  const hasEventDate = data.eventDate.trim().length > 0;
  const hasStartTime = data.startTime.trim().length > 0;
  const hasCapacity = data.capacity.trim().length > 0;
  const hasSchedule = hasEventDate || hasStartTime || hasCapacity;
  const hasSummary = data.summary.trim().length > 0;
  const hasEntryFee = data.entryFee.trim().length > 0;
  const visiblePrizes = data.prizes.filter((prize) => prize.label.trim().length > 0 || prize.value.trim().length > 0);
  const hasPrizes = visiblePrizes.length > 0;
  const titleSizeClass = getTitleSizeClass(data.title.trim());

  useEffect(() => {
    let isMounted = true;

    if (!hasOfficialUrl || !url) {
      setQrCode("");
      return;
    }

    QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 260,
      color: {
        dark: "#07111f",
        light: "#ffffff"
      }
    })
      .then((src) => {
        if (isMounted) setQrCode(src);
      })
      .catch(() => {
        if (isMounted) setQrCode("");
      });

    return () => {
      isMounted = false;
    };
  }, [hasOfficialUrl, url]);

  return (
    <article className="event-poster relative h-[297mm] w-[210mm] overflow-hidden bg-[#111827] text-white">
      <div className="absolute inset-0 event-poster-fallback" />
      {data.backgroundImage ? (
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          src={data.backgroundImage}
          style={{
            objectPosition: `${50 + data.backgroundX}% ${50 + data.backgroundY}%`,
            transform: `scale(${data.backgroundScale / 100})`
          }}
        />
      ) : null}
      <div className="absolute inset-0 bg-black" style={{ opacity: data.overlayOpacity / 100 }} />
      <div className="absolute inset-0 event-poster-vignette" />

      <section className="relative z-10 flex h-full flex-col px-[12mm] py-[11mm]">
        <div className="flex items-start justify-between gap-[8mm]">
          <div className="min-w-0">
            <h1
              className={[
                "max-w-[168mm] break-words font-black tracking-normal event-poster-title",
                titleSizeClass,
                hasSchedule ? "max-w-[118mm]" : ""
              ].join(" ")}
            >
              {data.title}
            </h1>
          </div>
          {hasSchedule ? (
            <div className="shrink-0 rounded-[6px] border border-white/30 bg-white/12 px-[4.5mm] py-[3.5mm] text-center shadow-xl backdrop-blur">
              {hasEventDate ? (
                <div>
                  <p className="text-[10pt] font-bold text-cyan-100">開催日</p>
                  <p className="mt-[1mm] max-w-[42mm] break-words text-[19pt] font-black leading-tight">{data.eventDate}</p>
                </div>
              ) : null}
              {hasStartTime ? (
                <div className={hasEventDate ? "mt-[3mm] border-t border-white/25 pt-[3mm]" : ""}>
                  <p className="text-[10pt] font-bold text-cyan-100">開始</p>
                  <p className="mt-[1mm] text-[22pt] font-black leading-none">{data.startTime}</p>
                </div>
              ) : null}
              {hasCapacity ? (
                <div className={hasEventDate || hasStartTime ? "mt-[3mm] border-t border-white/25 pt-[3mm]" : ""}>
                  <p className="text-[10pt] font-bold text-cyan-100">定員</p>
                  <p className="mt-[1mm] max-w-[42mm] break-words text-[19pt] font-black leading-tight">{data.capacity}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="min-h-[4mm] flex-1" />

        <div
          className={[
            "rounded-[8px] border border-white/40 bg-slate-950/90 p-[6mm] shadow-2xl backdrop-blur-md event-poster-detail-panel",
            hasOfficialUrl ? "grid grid-cols-[1fr_42mm] gap-[7mm]" : "grid grid-cols-1"
          ].join(" ")}
        >
          <div className="min-w-0">
            {hasSummary ? (
              <div className="rounded-[7px] border border-amber-200/30 bg-amber-300/14 px-[5mm] py-[4mm] event-poster-main-detail">
                <p className="text-[12pt] font-black text-amber-200">大会詳細</p>
                <p className="event-poster-copy event-poster-body-text mt-[2mm] text-[16pt] font-bold leading-[1.38]">
                  {data.summary}
                </p>
              </div>
            ) : null}

            {hasEntryFee || hasPrizes ? (
              <div className={["event-poster-value-group", hasSummary ? "mt-[3mm]" : ""].join(" ")}>
                {hasEntryFee ? (
                  <div className="event-poster-entry-fee">
                    <span>参加費</span>
                    <strong>{data.entryFee}</strong>
                  </div>
                ) : null}
                {hasPrizes ? (
                  <div className={hasEntryFee ? "event-poster-prizes border-t border-white/25 pt-[3mm]" : "event-poster-prizes"}>
                    <p className="event-poster-prizes-heading">景品</p>
                    <div className="mt-[2mm] grid gap-[1.8mm]">
                      {visiblePrizes.map((prize, index) => (
                        <div className="event-poster-prize-row" key={`${prize.label}-${prize.value}-${index}`}>
                          <span>{prize.label}</span>
                          <strong>{prize.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

          </div>

          {hasOfficialUrl ? (
            <div className="flex flex-col items-center justify-end">
              {qrCode ? (
                <>
                  <div className="flex h-[34mm] w-[34mm] items-center justify-center rounded-[5px] bg-white p-[2mm]">
                    <img alt="公式サイトQRコード" className="h-full w-full" src={qrCode} />
                  </div>
                  <p className="mt-[2mm] text-center text-[8pt] font-bold leading-tight text-slate-200">公式サイトはこちら</p>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </article>
  );
}
