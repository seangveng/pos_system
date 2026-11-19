export interface Products {
  id: number;
  name: string;
  sku: string;
  price: number;
  rating?: number;
  reviewCount?: number;
  category: string;
  image: string;
  stock: number;
  description?: string;
  status?: "active" | "inactive";
  sizes?: string[];
  colors?: string[];
}
