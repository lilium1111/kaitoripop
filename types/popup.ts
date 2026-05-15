export type CardItem = {
  id: string;
  name: string;
  price: number | "";
  image?: string;
};

export type PopupData = {
  title: string;
  updateDate: string;
  columns: number;
  gap: number;
  fontSize: number;
  cards: CardItem[];
};
