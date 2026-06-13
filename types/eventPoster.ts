export type EventPrize = {
  label: string;
  value: string;
};

export type EventPosterData = {
  title: string;
  eventDate: string;
  startTime: string;
  venue: string;
  capacity: string;
  entryFee: string;
  prizes: EventPrize[];
  summary: string;
  details: string;
  officialUrl: string;
  backgroundImage?: string;
  backgroundScale: number;
  backgroundX: number;
  backgroundY: number;
  overlayOpacity: number;
};
