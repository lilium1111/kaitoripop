"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type PrintImagePortalProps = {
  imageUrl: string;
};

export function PrintImagePortal({ imageUrl }: PrintImagePortalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !imageUrl) return null;

  return createPortal(
    <div className="event-poster-print-root" aria-hidden="true">
      <img alt="" className="event-poster-print-image" src={imageUrl} />
    </div>,
    document.body
  );
}
