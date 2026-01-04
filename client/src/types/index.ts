export interface Category {
    id: string;
    categoryId?: string; // Added for compatibility
    sectionId?: string; // Added for Section -> Category hierarchy
    name: string;
    slug: string;
    image: string;
    order: number;
    isActive: boolean;
}

export interface Subcategory {
    id: string;
    subcategoryId?: string; // Added for compatibility
    categoryId: string;
    name: string;
    slug: string;
    order: number;
    isActive: boolean;
    PK?: string;
}

export interface ProductSpec {
    key: string;
    value: string;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    categoryId: string;
    subcategoryId: string;
    description: string;
    thumbnailUrl: string;
    imageUrls: string[];
    specs: ProductSpec[];
    isActive: boolean;
    isNewArrival: boolean;
    isBestSeller: boolean;
    isFeatured: boolean;
    isTrending: boolean;
    isPremium: boolean;
    isRecommended: boolean;
    isOnOffer: boolean;
    isCustomOrder: boolean;
    isInStock: boolean;
    offerText: string;
    rating: number;
    createdAt: string;
}

export interface Banner {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    position: string;
    order: number;
    isActive: boolean;
    redirectType: 'NONE' | 'CATEGORY' | 'PRODUCT';
    redirectValue: string;
    categoryId?: string; // For CATEGORY_TOP position
}

export interface Section {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    icon: string;
    order: number;
    isActive: boolean;
    showOnHome: boolean;
}

export const bannerPositions = [
    { value: 'HOME_HERO', label: 'Home - Hero Section' },
    { value: 'HOME_MIDDLE', label: 'Home - Middle Section' },
    { value: 'HOME_BOTTOM', label: 'Home - Bottom Section' },
    { value: 'CATEGORY_TOP', label: 'Category - Top' },
    { value: 'PRODUCT_SIDEBAR', label: 'Product - Sidebar' },
];
