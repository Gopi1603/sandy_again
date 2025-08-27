export type Recipe = {
  id: number;
  title: string;
  cuisine: string | null;
  rating: number | null;
  prep_time: number | null;
  cook_time: number | null;
  total_time: number | null;
  description: string | null;
  nutrients: Record<string, string> | null;
  serves: string | null;
};
