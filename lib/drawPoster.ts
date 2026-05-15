"use client";

import type { CardItem, PopupData } from "@/types/popup";

export const POSTER_WIDTH = 2480;
export const POSTER_HEIGHT = 3508;
const POP_FONT_FAMILY = '"Arial Black", "Hiragino Maru Gothic ProN", "Yu Gothic", Meiryo, sans-serif';

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

function scaleCardMetrics(metrics: CardMetrics, scale: number): CardMetrics {
  const imageHeight = Math.round(metrics.imageHeight * scale);
  const nameHeight = Math.round(metrics.nameHeight * scale);
  const priceHeight = Math.round(metrics.priceHeight * scale);
  return {
    cardHeight: imageHeight + nameHeight + priceHeight + 56,
    imageHeight,
    nameHeight,
    priceHeight
  };
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

function drawBackground(ctx: CanvasRenderingContext2D) {
  const centerX = POSTER_WIDTH / 2;
  const centerY = 360;
  const outerRadius = Math.hypot(POSTER_WIDTH, POSTER_HEIGHT);

  const base = ctx.createLinearGradient(0, 0, 0, POSTER_HEIGHT);
  base.addColorStop(0, "#14b8ff");
  base.addColorStop(0.34, "#1237a3");
  base.addColorStop(0.72, "#0754bc");
  base.addColorStop(1, "#052b7f");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  const rays = 40;
  const step = (Math.PI * 2) / rays;
  for (let index = 0; index < rays; index += 1) {
    const angle = -Math.PI / 2 + index * step;
    const spread = step * 0.55;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle - spread / 2) * outerRadius, centerY + Math.sin(angle - spread / 2) * outerRadius);
    ctx.lineTo(centerX + Math.cos(angle + spread / 2) * outerRadius, centerY + Math.sin(angle + spread / 2) * outerRadius);
    ctx.closePath();
    ctx.fillStyle = index % 2 === 0 ? "rgba(255, 255, 255, 0.2)" : "rgba(80, 200, 255, 0.2)";
    ctx.fill();
  }

  const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 1180);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.42)");
  glow.addColorStop(0.28, "rgba(124, 223, 255, 0.2)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  const shade = ctx.createLinearGradient(0, 0, 0, POSTER_HEIGHT);
  shade.addColorStop(0, "rgba(0, 38, 130, 0)");
  shade.addColorStop(0.55, "rgba(0, 22, 96, 0.12)");
  shade.addColorStop(1, "rgba(0, 16, 72, 0.34)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
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

function fitTextSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  initialSize: number,
  minSize: number,
  fontFamily = POP_FONT_FAMILY
) {
  let size = initialSize;
  while (size > minSize) {
    ctx.font = `900 ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function drawPopHeadline(ctx: CanvasRenderingContext2D, title: string, x: number, y: number, width: number, height: number) {
  const text = title.trim() || "\u9ad8\u4fa1\u8cb7\u53d6\uff01";
  const textSize = fitTextSize(ctx, text, width - 150, 154, 82);

  ctx.save();
  drawShadow(ctx, "rgba(0,0,0,0.52)", 34, 16, 24);
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((-1.5 * Math.PI) / 180);
  roundedRect(ctx, -width / 2, -height / 2, width, height, 42);
  const banner = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
  banner.addColorStop(0, "#e90012");
  banner.addColorStop(0.46, "#ff4a12");
  banner.addColorStop(1, "#ff9f00");
  ctx.fillStyle = banner;
  ctx.fill();
  clearShadow(ctx);
  ctx.strokeStyle = "#fff4cf";
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.strokeStyle = "rgba(120, 0, 0, 0.3)";
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${textSize}px ${POP_FONT_FAMILY}`;
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  drawShadow(ctx, "rgba(0,0,0,0.72)", 0, 11, 12);
  ctx.strokeStyle = "#071026";
  ctx.lineWidth = Math.max(18, textSize * 0.13);
  ctx.strokeText(text, 0, 8, width - 150);
  clearShadow(ctx);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, 0, 8, width - 150);
  ctx.restore();
}

function drawHeader(ctx: CanvasRenderingContext2D, data: PopupData) {
  const padding = 120;
  const titleX = padding;
  const titleY = padding;
  const titleMaxWidth = 1510;
  const titleHeight = 224;
  drawPopHeadline(ctx, data.title || "\u9ad8\u4fa1\u8cb7\u53d6\uff01", titleX, titleY, titleMaxWidth, titleHeight);

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
    POP_FONT_FAMILY,
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
      POP_FONT_FAMILY,
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
    ctx.font = `900 ${fitPriceSize(ctx, price, baseFontSize * 2.9)}px ${POP_FONT_FAMILY}`;
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

function drawNotice(ctx: CanvasRenderingContext2D) {
  const text = "\u8cb7\u53d6\u4fa1\u683c\u306f\u72b6\u614b\u3084\u5728\u5eab\u6570\u306b\u3088\u3063\u3066\u5909\u52d5\u3059\u308b\u5834\u5408\u304c\u3054\u3056\u3044\u307e\u3059\u3002\u3054\u4e86\u627f\u304f\u3060\u3055\u3044\u3002";
  const width = POSTER_WIDTH - 320;
  const height = 122;
  const x = (POSTER_WIDTH - width) / 2;
  const y = POSTER_HEIGHT - 230;

  ctx.save();
  drawShadow(ctx, "rgba(0,0,0,0.28)", 24, 0, 12);
  fillRoundedRect(ctx, x, y, width, height, 28, "rgba(255, 255, 255, 0.88)");
  clearShadow(ctx);
  strokeRoundedRect(ctx, x, y, width, height, 28, "rgba(255,255,255,0.72)", 4);
  drawFittedText(ctx, text, x + 56, y, width - 112, height, 48, 34, POP_FONT_FAMILY, "#071a3c", "center");
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
  drawBackground(ctx);
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
  const baseMetrics = getCardMetrics(columns);
  const gridTop = padding + 300 + 48;
  const gridWidth = POSTER_WIDTH - padding * 2;
  const cardWidth = (gridWidth - gap * (columns - 1)) / columns;
  const noticeTop = POSTER_HEIGHT - 230;
  const maxGridBottom = noticeTop - 78;
  const rows = Math.max(1, Math.ceil(loadedCards.length / columns));
  const desiredGridHeight = rows * baseMetrics.cardHeight + Math.max(0, rows - 1) * gap;
  const availableGridHeight = Math.max(420, maxGridBottom - gridTop);
  const verticalScale = Math.min(1, availableGridHeight / desiredGridHeight);
  const metrics = scaleCardMetrics(baseMetrics, verticalScale);
  const rowGap = Math.max(20, Math.round(gap * verticalScale));

  loadedCards.forEach((card, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = padding + col * (cardWidth + gap);
    const y = gridTop + row * (metrics.cardHeight + rowGap);
    drawCard(ctx, card, x, y, cardWidth, metrics, data.fontSize);
  });

  drawNotice(ctx);
}
