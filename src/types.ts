export interface ProductSize {
  name: string; // e.g., "60 Capsules"
  count: number;
  priceModifier: number; // multiplier or flat add, let's use multiplier for elegant scaling
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  goal: string; // e.g., "Heart", "Liver"
  shortHook: string;
  basePrice: number;
  rating: number;
  reviewsCount: number;
  colorTheme: string; // e.g., "emerald", "teal", "indigo"
  sizes: ProductSize[];
  imageUrl?: string;
  imageUrls?: string[];
  
  // PDP Rich Details
  benefits: string[];
  activeIngredients: {
    name: string;
    amount: string;
    percentageDV: string;
    function: string;
  }[];
  directions: string;
  storageWarnings: string[];
  
  // Visual properties
  colorGradStart: string;
  colorGradEnd: string;

  // SEO & Extended details
  seoTitle?: string;
  seoDescription?: string;
  detailedCopy?: string;
  specifications?: {
    feature: string;
    details: string;
  }[];
}

export interface CartItem {
  product: Product;
  selectedSize: ProductSize;
  quantity: number;
  isSubscription?: boolean;
}

export interface UserReview {
  id: string;
  author: string;
  verified: boolean;
  rating: number;
  date: string;
  title: string;
  comment: string;
  productId?: string;
  userId?: string;
}

export interface FaqItem {
  category: string;
  question: string;
  answer: string;
}
