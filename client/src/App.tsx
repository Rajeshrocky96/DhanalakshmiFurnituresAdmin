import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import ProductForm from "./pages/admin/ProductForm";
import Banners from "./pages/admin/Banners";
import BannerForm from "./pages/admin/BannerForm";
import Categories from "./pages/admin/Categories";
import CategoryForm from "./pages/admin/CategoryForm";
import Subcategories from "./pages/admin/Subcategories";
import SubcategoryForm from "./pages/admin/SubcategoryForm";
import Sections from "./pages/admin/Sections";
import SectionForm from "./pages/admin/SectionForm";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Redirect root to admin */}
            <Route path="/" element={<Navigate to="/admin" replace />} />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/new"
              element={
                <ProtectedRoute>
                  <ProductForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/:id"
              element={
                <ProtectedRoute>
                  <ProductForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/banners"
              element={
                <ProtectedRoute>
                  <Banners />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/banners/new"
              element={
                <ProtectedRoute>
                  <BannerForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/banners/:id"
              element={
                <ProtectedRoute>
                  <BannerForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute>
                  <Categories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories/new"
              element={
                <ProtectedRoute>
                  <CategoryForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories/:id"
              element={
                <ProtectedRoute>
                  <CategoryForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subcategories"
              element={
                <ProtectedRoute>
                  <Subcategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subcategories/new"
              element={
                <ProtectedRoute>
                  <SubcategoryForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subcategories/:id"
              element={
                <ProtectedRoute>
                  <SubcategoryForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sections"
              element={
                <ProtectedRoute>
                  <Sections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sections/:id"
              element={
                <ProtectedRoute>
                  <SectionForm />
                </ProtectedRoute>
              }
            />


            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
