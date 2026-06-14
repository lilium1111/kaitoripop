export type EventPrize = {
  label: string;
  value: string;
};

export type EventPosterData = {
  title: string;
  eventDate: string;
  startTime: string;
  capacity: string;
  entryFee: string;
  prizes: EventPrize[];
  summary: string;
  officialUrl: string;
  backgroundImage?: string;
  backgroundScale: number;
  backgroundX: number;
  backgroundY: number;
  overlayOpacity: number;
};
