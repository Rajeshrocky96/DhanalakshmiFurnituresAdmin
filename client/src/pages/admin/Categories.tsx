import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@/components/ui/loader';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
import { Category } from '@/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { api } from '@/lib/api';
import { TruncatedText } from '@/components/ui/truncated-text';
import { Pagination } from '@/components/ui/pagination-control';

const Categories: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      toast({ title: 'Error loading categories', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const updated = { ...category, isActive: !category.isActive };
      await api.updateCategory(category.id, updated);
      await loadCategories(); // Reload to ensure consistency
      toast({ title: 'Category status updated', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error updating category', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (categoryToDelete) {
      try {
        await api.deleteCategory(categoryToDelete);
        setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete));
        toast({ title: 'Category deleted successfully', variant: 'success' });
      } catch (error) {
        toast({ title: 'Error deleting category', variant: 'destructive' });
      }
      setCategoryToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  // Pagination logic
  const totalItems = categories.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedCategories = categories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) return <Loader fullScreen />;

  return (
    <AdminLayout title="Categories" breadcrumbs={[{ label: 'Categories' }]}>
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-semibold text-muted-foreground">
          Total Categories: {categories.length}
        </div>
        <Button onClick={() => navigate('/admin/categories/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <div className="admin-card overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Order</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.map((category) => (
                <tr key={category.categoryId || category.id}>
                  <td className="font-medium">
                    <TruncatedText text={category.name} />
                  </td>

                  <td className="text-muted-foreground">{category.order}</td>
                  <td>
                    <Switch
                      checked={category.isActive}
                      onCheckedChange={() => handleToggleActive(category)}
                      className="scale-75"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => navigate(`/admin/categories/${category.categoryId || category.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setCategoryToDelete(category.categoryId || category.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No categories found
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
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This may affect related subcategories and products.
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
    </AdminLayout>
  );
};

export default Categories;
