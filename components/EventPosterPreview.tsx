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

function getTitleBaseTypography(title: string) {
  const length = title.trim().length;
  if (length <= 8) return { fontSize: 92, lineHeight: 0.9 };
  if (length <= 18) return { fontSize: 76, lineHeight: 0.94 };
  if (length <= 32) return { fontSize: 60, lineHeight: 1 };
  return { fontSize: 48, lineHeight: 1.05 };
}

function clampTitleScale(value: number) {
  if (!Number.isFinite(value)) return 100;
  return Math.min(150, Math.max(50, value));
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
  const visibleTopWelcomeMessages = data.topWelcomeMessages.filter((message) => message.trim().length > 0);
  const visibleSupportMessages = data.supportMessages.filter((message) => message.trim().length > 0);
  const prizeDensityClass = visiblePrizes.length >= 8 ? "prize-count-dense" : visiblePrizes.length >= 5 ? "prize-count-compact" : "prize-count-normal";
  const titleBaseTypography = getTitleBaseTypography(data.title.trim());
  const eventTitleScale = clampTitleScale(data.eventTitleScale ?? 100);
  const titleScaleClass = eventTitleScale >= 130 ? "event-title-scale-large" : eventTitleScale <= 75 ? "event-title-scale-small" : "event-title-scale-normal";

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
    <article className={["event-poster relative h-[297mm] w-[210mm] overflow-hidden bg-[#fff7ed] text-slate-900", prizeDensityClass, titleScaleClass].join(" ")}>
      <div className="absolute inset-0 event-poster-fallback" />
      <div className="absolute left-[10mm] top-[14mm] h-[28mm] w-[28mm] rounded-full bg-white/35 blur-xl" />
      <div className="absolute right-[18mm] top-[76mm] h-[18mm] w-[18mm] rounded-full bg-emerald-200/45 blur-lg" />
      <div className="absolute bottom-[36mm] left-[18mm] h-[22mm] w-[22mm] rounded-full bg-amber-200/50 blur-xl" />
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
      <div className="absolute inset-0 event-poster-image-soften" style={{ opacity: data.overlayOpacity / 100 }} />
      <div className="absolute inset-0 event-poster-vignette" />

      <section className="relative z-10 flex h-full flex-col px-[12mm] py-[11mm]">
        <div className="flex items-start justify-between gap-[8mm]">
          <div className="min-w-0">
            {visibleTopWelcomeMessages.length > 0 ? (
              <div className="event-poster-welcome-badges">
                {visibleTopWelcomeMessages.map((message, index) => (
                  <span className="event-poster-welcome-badge" key={`${message}-${index}`}>
                    {message}
                  </span>
                ))}
              </div>
            ) : null}
            <h1
              className={[
                "max-w-[168mm] break-words font-black tracking-normal event-poster-title",
                visibleTopWelcomeMessages.length > 0 ? "mt-[3mm]" : "",
                hasSchedule ? "max-w-[118mm]" : ""
              ].join(" ")}
              style={{
                fontSize: `${titleBaseTypography.fontSize * (eventTitleScale / 100)}pt`,
                lineHeight: titleBaseTypography.lineHeight
              }}
            >
              {data.title}
            </h1>
            {visibleSupportMessages.length > 0 ? (
              <div className="mt-[5mm] flex max-w-[124mm] flex-wrap gap-[2mm] event-poster-support-chips">
                {visibleSupportMessages.map((message, index) => (
                  <span key={`${message}-${index}`}>{message}</span>
                ))}
              </div>
            ) : null}
          </div>
          {hasSchedule ? (
            <div className="event-poster-schedule-card shrink-0 rounded-[6px] px-[4.5mm] py-[3.5mm] text-center shadow-xl">
              {hasEventDate ? (
                <div>
                  <p className="text-[10pt] font-bold">開催日</p>
                  <p className="mt-[1mm] max-w-[42mm] break-words text-[19pt] font-black leading-tight text-slate-900">{data.eventDate}</p>
                </div>
              ) : null}
              {hasStartTime ? (
                <div className={hasEventDate ? "mt-[3mm] border-t border-white/25 pt-[3mm]" : ""}>
                  <p className="text-[10pt] font-bold">開始</p>
                  <p className="mt-[1mm] text-[22pt] font-black leading-none text-slate-900">{data.startTime}</p>
                </div>
              ) : null}
              {hasCapacity ? (
                <div className={hasEventDate || hasStartTime ? "mt-[3mm] border-t border-white/25 pt-[3mm]" : ""}>
                  <p className="text-[10pt] font-bold">定員</p>
                  <p className="mt-[1mm] max-w-[42mm] break-words text-[19pt] font-black leading-tight text-slate-900">{data.capacity}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="min-h-[4mm] flex-1" />

        <div
          className={[
            "rounded-[8px] p-[6mm] shadow-2xl event-poster-detail-panel",
            hasOfficialUrl ? "grid grid-cols-[1fr_42mm] gap-[7mm]" : "grid grid-cols-1"
          ].join(" ")}
        >
          <div className="min-w-0">
            {hasSummary ? (
              <div className="rounded-[7px] px-[5mm] py-[4mm] event-poster-main-detail">
                <p className="text-[12pt] font-black">大会詳細</p>
                <p className="event-poster-copy event-poster-body-text mt-[2mm] text-[16pt] font-bold leading-[1.42]">
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
                    <div className="event-poster-prize-list mt-[2mm] grid gap-[1.8mm]">
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
                  <div className="event-poster-qr-box flex h-[34mm] w-[34mm] items-center justify-center rounded-[5px] bg-white p-[2mm]">
                    <img alt="公式サイトQRコード" className="h-full w-full" src={qrCode} />
                  </div>
                  <p className="mt-[2mm] text-center text-[8pt] font-bold leading-tight text-slate-700">申込・詳細はこちら</p>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </article>
  );
}
