import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@/components/ui/loader';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Combobox } from '@/components/ui/combobox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { api } from '@/lib/api';
import { Category, Subcategory, Product } from '@/types';
import { TruncatedText } from '@/components/ui/truncated-text';
import { Pagination } from '@/components/ui/pagination-control';
import { ProductQuickView } from '@/components/admin/ProductQuickView';
import { ImagePreview } from '@/components/ui/image-preview';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, cats, subs] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getSubcategories()
      ]);
      setProducts(prods);
      setCategories(cats);
      setSubcategories(subs);
    } catch (error) {
      toast({ title: 'Error loading data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.categoryId === categoryId)?.name || '-';

  const getSubcategoryName = (subcategoryId: string) =>
    subcategories.find((s) => s.subcategoryId === subcategoryId)?.name || '-';


  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
    const matchesSubcategory = subcategoryFilter === 'all' || product.subcategoryId === subcategoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && product.isActive) ||
      (statusFilter === 'inactive' && !product.isActive);
    return matchesSearch && matchesCategory && matchesSubcategory && matchesStatus;
  });

  // Pagination logic
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, subcategoryFilter, statusFilter]);

  const handleToggleActive = async (product: Product) => {
    try {
      const updated = { ...product, isActive: !product.isActive };
      await api.updateProduct(product.id, updated);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? updated : p))
      );
      toast({ title: 'Product status updated', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error updating product', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (productToDelete) {
      try {
        await api.deleteProduct(productToDelete);
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete));
        toast({ title: 'Product deleted successfully', variant: 'success' });
      } catch (error) {
        toast({ title: 'Error deleting product', variant: 'destructive' });
      }
      setProductToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  if (loading) return <Loader fullScreen />;

  const filteredSubcategories = categoryFilter === 'all'
    ? subcategories
    : subcategories.filter(s => s.categoryId === categoryFilter);

  return (
    <AdminLayout title="Products" breadcrumbs={[{ label: 'Products' }]}>
      <div className="text-lg font-semibold text-muted-foreground mb-4">
        Total Products: {products.length}
      </div>
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          <Combobox
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              })),
            ]}
            value={categoryFilter}
            onChange={(value) => {
              setCategoryFilter(value);
              setSubcategoryFilter('all');
            }}
            placeholder="Category"
            className="w-full sm:w-40"
            searchPlaceholder="Search category..."
          />
          <Combobox
            options={[
              { value: 'all', label: 'All Subcategories' },
              ...filteredSubcategories.map((sub) => ({
                value: sub.id,
                label: sub.name,
              })),
            ]}
            value={subcategoryFilter}
            onChange={setSubcategoryFilter}
            placeholder="Subcategory"
            className="w-full sm:w-40"
            searchPlaceholder="Search subcategory..."
          />
          <Combobox
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Status"
            className="w-full sm:w-32"
            searchPlaceholder="Search status..."
          />
        </div>
        <Button onClick={() => navigate('/admin/products/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Products Table */}
      <div className="admin-card overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Active</th>
                <th>Featured</th>
                <th>On Offer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <ImagePreview
                      src={product.thumbnailUrl}
                      alt={product.name}
                      className="w-12 h-12"
                    />
                  </td>
                  <td className="font-medium">
                    <TruncatedText text={product.name} />
                  </td>
                  <td className="text-muted-foreground">
                    <TruncatedText text={getCategoryName(product.categoryId)} />
                  </td>
                  <td className="text-muted-foreground">
                    <TruncatedText text={getSubcategoryName(product.subcategoryId)} />
                  </td>
                  <td>
                    <Switch
                      checked={product.isActive}
                      onCheckedChange={() => handleToggleActive(product)}
                      className="scale-75"
                    />
                  </td>
                  <td>
                    <span className={`status-badge ${product.isFeatured ? 'status-active' : 'status-inactive'}`}>
                      {product.isFeatured ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${product.isOnOffer ? 'status-active' : 'status-inactive'}`}>
                      {product.isOnOffer ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedProduct(product);
                          setQuickViewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setProductToDelete(product.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          totalItems={totalItems}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ProductQuickView
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        product={selectedProduct}
        getCategoryName={getCategoryName}
        getSubcategoryName={getSubcategoryName}
      />
    </AdminLayout >
  );
};

export default Products;
