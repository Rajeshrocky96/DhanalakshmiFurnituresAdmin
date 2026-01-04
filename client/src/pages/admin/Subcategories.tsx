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
import { Subcategory, Category } from '@/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { api } from '@/lib/api';
import { TruncatedText } from '@/components/ui/truncated-text';
import { Pagination } from '@/components/ui/pagination-control';

const Subcategories: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subs, cats] = await Promise.all([
        api.getSubcategories(),
        api.getCategories()
      ]);
      setSubcategories(subs);
      setCategories(cats);
    } catch (error) {
      toast({ title: 'Error loading data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) =>
    categories.find(c => c.categoryId === categoryId)?.name || "-";



  const handleToggleActive = async (subcategory: Subcategory) => {
    try {
      const updated = { ...subcategory, isActive: !subcategory.isActive };
      await api.updateSubcategory(subcategory.id, updated);
      await loadData(); // Reload to ensure consistency
      toast({ title: 'Subcategory status updated', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error updating subcategory', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (subcategoryToDelete) {
      try {
        await api.deleteSubcategory(subcategoryToDelete);
        setSubcategories((prev) => prev.filter((s) => s.id !== subcategoryToDelete));
        toast({ title: 'Subcategory deleted successfully', variant: 'success' });
      } catch (error) {
        toast({ title: 'Error deleting subcategory', variant: 'destructive' });
      }
      setSubcategoryToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  // Pagination logic
  const totalItems = subcategories.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedSubcategories = subcategories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) return <Loader fullScreen />;

  return (
    <AdminLayout title="Subcategories" breadcrumbs={[{ label: 'Subcategories' }]}>
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-semibold text-muted-foreground">
          Total Subcategories: {subcategories.length}
        </div>
        <Button onClick={() => navigate('/admin/subcategories/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subcategory
        </Button>
      </div>

      {/* Subcategories Table */}
      <div className="admin-card overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Subcategory Name</th>

                <th>Order</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSubcategories.map((subcategory) => (
                <tr key={subcategory.subcategoryId || subcategory.id}>
                  <td className="text-muted-foreground">
                    <TruncatedText text={getCategoryName(subcategory.categoryId)} />

                  </td>
                  <td className="font-medium">
                    <TruncatedText text={subcategory.name} />
                  </td>

                  <td className="text-muted-foreground">{subcategory.order}</td>
                  <td>
                    <Switch
                      checked={subcategory.isActive}
                      onCheckedChange={() => handleToggleActive(subcategory)}
                      className="scale-75"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => navigate(`/admin/subcategories/${subcategory.subcategoryId || subcategory.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSubcategoryToDelete(subcategory.subcategoryId || subcategory.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedSubcategories.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No subcategories found
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
            <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subcategory? This may affect related products.
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

export default Subcategories;
