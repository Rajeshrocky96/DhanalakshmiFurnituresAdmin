import { Category, Subcategory, Product, Banner, Section } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:30036"}/api`;

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Request failed with status ${res.status}`);
    }
    return res.json();
};

export const api = {
    // Sections
    getSections: async (): Promise<Section[]> => {
        const res = await fetch(`${API_URL}/sections`);
        return handleResponse(res);
    },
    createSection: async (data: Partial<Section> | FormData): Promise<Section> => {
        const isFormData = data instanceof FormData;
        const res = await fetch(`${API_URL}/sections`, {
            method: 'POST',
            headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
            body: isFormData ? data : JSON.stringify(data),
        });
        return handleResponse(res);
    },
    updateSection: async (id: string, data: Partial<Section> | FormData): Promise<Section> => {
        const isFormData = data instanceof FormData;
        const res = await fetch(`${API_URL}/sections/${id}`, {
            method: 'PUT',
            headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
            body: isFormData ? data : JSON.stringify(data),
        });
        return handleResponse(res);
    },
    deleteSection: async (id: string): Promise<void> => {
        const res = await fetch(`${API_URL}/sections/${id}`, { method: 'DELETE' });
        return handleResponse(res);
    },

    // Categories
    getCategories: async (): Promise<Category[]> => {
        const res = await fetch(`${API_URL}/categories`);
        return handleResponse(res);
    },
    createCategory: async (data: Partial<Category> | FormData): Promise<Category> => {
        const isFormData = data instanceof FormData;
        const res = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
            body: isFormData ? data : JSON.stringify(data),
        });
        return handleResponse(res);
    },
    updateCategory: async (id: string, data: Partial<Category> | FormData): Promise<Category> => {
        const isFormData = data instanceof FormData;
        const res = await fetch(`${API_URL}/categories/${id}`, {
            method: 'PUT',
            headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
            body: isFormData ? data : JSON.stringify(data),
        });
        return handleResponse(res);
    },
    deleteCategory: async (id: string): Promise<void> => {
        const res = await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
        return handleResponse(res);
    },

    // Subcategories
    getSubcategories: async (): Promise<Subcategory[]> => {
        const res = await fetch(`${API_URL}/subcategories`);
        return handleResponse(res);
    },
    createSubcategory: async (data: Partial<Subcategory>): Promise<Subcategory> => {
        const res = await fetch(`${API_URL}/subcategories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    updateSubcategory: async (id: string, data: Partial<Subcategory>): Promise<Subcategory> => {
        const res = await fetch(`${API_URL}/subcategories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    deleteSubcategory: async (id: string): Promise<void> => {
        const res = await fetch(`${API_URL}/subcategories/${id}`, { method: 'DELETE' });
        return handleResponse(res);
    },

    // Products
    getProducts: async (): Promise<Product[]> => {
        const res = await fetch(`${API_URL}/products`);
        return handleResponse(res);
    },
    createProduct: async (data: Partial<Product> | FormData): Promise<Product> => {
        const isFormData = data instanceof FormData;
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
            body: isFormData ? data : JSON.stringify(data),
        });
        return handleResponse(res);
    },
    updateProduct: async (id: string, data: Partial<Product> | FormData): Promise<Product> => {
        const isFormData = data instanceof FormData;
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
            body: isFormData ? data : JSON.stringify(data),
        });
        return handleResponse(res);
    },
    deleteProduct: async (id: string): Promise<void> => {
        const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
        return handleResponse(res);
    },

    // Banners
    getBanners: async (): Promise<Banner[]> => {
        const res = await fetch(`${API_URL}/banners`);
        return handleResponse(res);
    },
    createBanner: async (data: Partial<Banner> | FormData): Promise<Banner> => {
        const isFormData = data instanceof FormData;
        const res = await fetch(`${API_URL}/banners`, {
            method: 'POST',
            headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
            body: isFormData ? data : JSON.stringify(data),
        });
        return handleResponse(res);
    },
    updateBanner: async (id: string, data: Partial<Banner> | FormData): Promise<Banner> => {
        const isFormData = data instanceof FormData;
        const res = await fetch(`${API_URL}/banners/${id}`, {
            method: 'PUT',
            headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
            body: isFormData ? data : JSON.stringify(data),
        });
        return handleResponse(res);
    },
    deleteBanner: async (id: string): Promise<void> => {
        const res = await fetch(`${API_URL}/banners/${id}`, { method: 'DELETE' });
        return handleResponse(res);
    },



};
