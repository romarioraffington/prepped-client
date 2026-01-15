export type Review = {
  uri: string;
  rating: number;
  review: string;
  publishedTime: string;
  authorAttribution: {
    displayName: string | null;
    photoUri: string | null;
    profileUri: string | null;
  };
};

export type Reviews = {
  rating: number;
  count: number;
  uri: string;
  items: Review[];
};
