"use client";

import type { CardItem, PopupData } from "@/types/popup";

export const POSTER_WIDTH = 2480;
export const POSTER_HEIGHT = 3508;

type CardMetrics = {
  cardHeight: number;
  imageHeight: number;
  nameHeight: number;
  priceHeight: number;
};

type LoadedCard = CardItem & {
  imageElement?: HTMLImageElement;
};

function formatPrice(price: number | "") {
  if (price === "") return "";
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(price);
}

function formatUpdateDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.replace(/^\u66f4\u65b0\s*/, "");
}

function getCardMetrics(columns: number): CardMetrics {
  if (columns >= 4) {
    return { cardHeight: 760, imageHeight: 510, nameHeight: 68, priceHeight: 126 };
  }
  if (columns === 3) {
    return { cardHeight: 790, imageHeight: 530, nameHeight: 72, priceHeight: 132 };
  }
  return { cardHeight: 830, imageHeight: 550, nameHeight: 76, priceHeight: 138 };
}

function loadImage(src?: string) {
  return new Promise<HTMLImageElement | undefined>((resolve) => {
    if (!src) {
      resolve(undefined);
      return;
    }

    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(undefined);
    image.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string | CanvasGradient
) {
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

function strokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  stroke: string,
  lineWidth: number
) {
  roundedRect(ctx, x, y, width, height, radius);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawBackground(ctx: CanvasRenderingContext2D, backgroundColor: string) {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  const gradient = ctx.createLinearGradient(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  gradient.addColorStop(0, "#121d7a");
  gradient.addColorStop(0.48, "#118ad1");
  gradient.addColorStop(1, "#11206f");
  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.92;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  ctx.globalAlpha = 1;

  const glow = ctx.createRadialGradient(480, 420, 0, 480, 420, 760);
  glow.addColorStop(0, "rgba(95, 210, 255, 0.5)");
  glow.addColorStop(1, "rgba(95, 210, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  ctx.save();
  ctx.translate(-POSTER_WIDTH * 0.4, 0);
  ctx.rotate((-18 * Math.PI) / 180);
  for (let x = -POSTER_WIDTH; x < POSTER_WIDTH * 2; x += 160) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.13)";
    ctx.fillRect(x, -POSTER_HEIGHT, 44, POSTER_HEIGHT * 3);
  }
  ctx.restore();
}

function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  initialSize: number,
  minSize: number,
  fontFamily: string,
  fill: string,
  align: CanvasTextAlign,
  stroke?: { color: string; width: number }
) {
  let fontSize = initialSize;
  const lines = [text];
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";

  while (fontSize > minSize) {
    ctx.font = `900 ${fontSize}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth && fontSize <= maxHeight) break;
    fontSize -= 2;
  }

  ctx.font = `900 ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = fill;
  const drawX = align === "center" ? x + maxWidth / 2 : x;
  const drawY = y + maxHeight / 2;

  lines.forEach((line) => {
    if (stroke) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.strokeText(line, drawX, drawY, maxWidth);
    }
    ctx.fillText(line, drawX, drawY, maxWidth);
  });
}

function drawShadow(ctx: CanvasRenderingContext2D, color: string, blur: number, x: number, y: number) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = x;
  ctx.shadowOffsetY = y;
}

function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawHeader(ctx: CanvasRenderingContext2D, data: PopupData) {
  const padding = 120;
  const titleX = padding;
  const titleY = padding;
  const titleMaxWidth = 1510;
  const titleHeight = 204;
  const titleGradient = ctx.createLinearGradient(titleX, titleY, titleX + titleMaxWidth, titleY + titleHeight);
  titleGradient.addColorStop(0, "#f20d16");
  titleGradient.addColorStop(0.48, "#ff5a12");
  titleGradient.addColorStop(1, "#ffb000");

  ctx.save();
  drawShadow(ctx, "rgba(0,0,0,0.46)", 38, 0, 24);
  fillRoundedRect(ctx, titleX, titleY, titleMaxWidth, titleHeight, 34, titleGradient);
  clearShadow(ctx);

  drawFittedText(
    ctx,
    data.title || "\u9ad8\u4fa1\u8cb7\u53d6\uff01",
    titleX + 70,
    titleY + 22,
    titleMaxWidth - 140,
    titleHeight - 44,
    148,
    72,
    '"Arial Black", Impact, system-ui, sans-serif',
    "#ffffff",
    "center",
    { color: "#000000", width: 14 }
  );
  ctx.restore();

  const badgeText = `\u66f4\u65b0 ${formatUpdateDate(data.updateDate)}`;
  const badgeWidth = 660;
  const badgeHeight = 118;
  const badgeX = POSTER_WIDTH - padding - badgeWidth;
  const badgeY = titleY + 20;
  ctx.save();
  drawShadow(ctx, "rgba(0,0,0,0.38)", 24, 0, 14);
  fillRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 22, "#071026");
  clearShadow(ctx);
  strokeRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 22, "rgba(255,255,255,0.25)", 4);
  drawFittedText(
    ctx,
    badgeText,
    badgeX + 42,
    badgeY,
    badgeWidth - 84,
    badgeHeight,
    58,
    38,
    '"Arial Black", system-ui, sans-serif',
    "#ffffff",
    "center"
  );
  ctx.restore();
}

function drawImageFit(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  card: LoadedCard,
  x: number,
  y: number,
  width: number,
  metrics: CardMetrics,
  baseFontSize: number
) {
  const price = formatPrice(card.price);
  const pad = 16;
  const nameGap = 14;
  const priceGap = 12;
  const imageX = x + pad;
  const imageY = y + pad;
  const innerWidth = width - pad * 2;
  const nameY = imageY + metrics.imageHeight + nameGap;
  const priceY = nameY + metrics.nameHeight + priceGap;

  ctx.save();
  drawShadow(ctx, "rgba(4,18,48,0.33)", 30, 0, 18);
  fillRoundedRect(ctx, x, y, width, metrics.cardHeight, 18, "#ffffff");
  clearShadow(ctx);

  fillRoundedRect(ctx, imageX, imageY, innerWidth, metrics.imageHeight, 12, "#f1f5f9");
  if (card.imageElement) {
    drawImageFit(ctx, card.imageElement, imageX, imageY, innerWidth, metrics.imageHeight);
  } else {
    strokeRoundedRect(
      ctx,
      imageX + innerWidth * 0.14,
      imageY + metrics.imageHeight * 0.04,
      innerWidth * 0.72,
      metrics.imageHeight * 0.92,
      14,
      "#cbd5e1",
      6
    );
  }

  fillRoundedRect(ctx, imageX, nameY, innerWidth, metrics.nameHeight, 10, "#000000");
  if (card.name.trim()) {
    drawFittedText(
      ctx,
      card.name,
      imageX + 10,
      nameY,
      innerWidth - 20,
      metrics.nameHeight,
      baseFontSize * 2.15,
      34,
      '"Arial Black", Impact, system-ui, sans-serif',
      "#ffd51f",
      "center",
      { color: "#000000", width: 8 }
    );
  }

  fillRoundedRect(ctx, imageX, priceY, innerWidth, metrics.priceHeight, 10, "#ffffff");
  if (price) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${fitPriceSize(ctx, price, baseFontSize * 2.9)}px "Arial Black", Impact, system-ui, sans-serif`;
    ctx.lineJoin = "round";
    const textX = imageX + innerWidth / 2;
    const textY = priceY + metrics.priceHeight / 2 + 2;
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeText(price, textX, textY, innerWidth - 24);
    clearShadow(ctx);
    ctx.fillStyle = "#ff1010";
    ctx.fillText(price, textX, textY, innerWidth - 24);
    ctx.restore();
  }

  ctx.restore();
}

function fitPriceSize(ctx: CanvasRenderingContext2D, price: string, base: number) {
  let size = base;
  if (price.length > 10) size -= 12;
  else if (price.length > 8) size -= 6;
  return Math.max(size, price.length > 8 ? 78 : 82);
}

export async function drawPoster(canvas: HTMLCanvasElement, data: PopupData) {
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  drawBackground(ctx, data.backgroundColor);
  drawHeader(ctx, data);

  const visibleCards = data.cards.filter(
    (card) => card.name.trim() || card.price !== "" || card.image
  );
  const loadedCards: LoadedCard[] = await Promise.all(
    visibleCards.map(async (card) => ({
      ...card,
      imageElement: await loadImage(card.image)
    }))
  );

  const padding = 120;
  const columns = Math.min(4, Math.max(2, data.columns));
  const gap = Math.min(48, Math.max(36, Math.round(data.gap * 2.1)));
  const metrics = getCardMetrics(columns);
  const gridTop = padding + 300 + 48;
  const gridWidth = POSTER_WIDTH - padding * 2;
  const cardWidth = (gridWidth - gap * (columns - 1)) / columns;

  loadedCards.forEach((card, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = padding + col * (cardWidth + gap);
    const y = gridTop + row * (metrics.cardHeight + gap);
    drawCard(ctx, card, x, y, cardWidth, metrics, data.fontSize);
  });
}
