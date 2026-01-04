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
import { Combobox } from '@/components/ui/combobox';
import { bannerPositions, Banner, Category } from '@/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { api } from '@/lib/api';
import { TruncatedText } from '@/components/ui/truncated-text';
import { Pagination } from '@/components/ui/pagination-control';
import { ImagePreview } from '@/components/ui/image-preview';

const Banners: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  React.useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const [bannersData, categoriesData] = await Promise.all([
        api.getBanners(),
        api.getCategories()
      ]);
      setBanners(bannersData);
      setCategories(categoriesData);
    } catch (error) {
      toast({ title: 'Error loading banners', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return '';
    return categories.find(c => c.id === categoryId)?.name || '';
  };

  const getPositionLabel = (position: string) =>
    bannerPositions.find((p) => p.value === position)?.label || position;

  const handleToggleActive = async (banner: Banner) => {
    try {
      const updated = { ...banner, isActive: !banner.isActive };
      await api.updateBanner(banner.id, updated);
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? updated : b))
      );
      toast({ title: 'Banner status updated', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error updating banner', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (bannerToDelete) {
      try {
        await api.deleteBanner(bannerToDelete);
        setBanners((prev) => prev.filter((b) => b.id !== bannerToDelete));
        toast({ title: 'Banner deleted successfully', variant: 'success' });
      } catch (error) {
        toast({ title: 'Error deleting banner', variant: 'destructive' });
      }
      setBannerToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredBanners = banners.filter((banner) => {
    const matchesPosition = positionFilter === 'all' || banner.position === positionFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && banner.isActive) ||
      (statusFilter === 'inactive' && !banner.isActive);
    return matchesPosition && matchesStatus;
  });

  // Pagination logic
  const totalItems = filteredBanners.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedBanners = filteredBanners.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [positionFilter, statusFilter]);

  if (loading) return <Loader fullScreen />;

  return (
    <AdminLayout title="Banners" breadcrumbs={[{ label: 'Banners' }]}>
      <div className="text-lg font-semibold text-muted-foreground mb-4">
        Total Banners: {banners.length}
      </div>
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Combobox
            options={[
              { value: 'all', label: 'All Positions' },
              ...bannerPositions.map((pos) => ({
                value: pos.value,
                label: pos.label,
              })),
            ]}
            value={positionFilter}
            onChange={setPositionFilter}
            placeholder="Position"
            className="w-full sm:w-48"
            searchPlaceholder="Search position..."
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
        <Button onClick={() => navigate('/admin/banners/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </Button>
      </div>

      {/* Banners Table */}
      <div className="admin-card overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Title</th>
                <th>Position</th>
                <th>Order</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBanners.map((banner) => (
                <tr key={banner.id}>
                  <td>
                    <ImagePreview
                      src={banner.image}
                      alt={banner.title}
                      className="w-32 h-20"
                    />
                  </td>
                  <td>
                    <div>
                      <p className="font-medium">
                        <TruncatedText text={banner.title} />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <TruncatedText text={banner.subtitle} />
                      </p>
                    </div>
                  </td>
                  <td className="text-muted-foreground">
                    {getPositionLabel(banner.position)}
                    {banner.position === 'CATEGORY_TOP' && banner.categoryId && (
                      <span className="block text-xs text-primary mt-1">
                        For: {getCategoryName(banner.categoryId)}
                      </span>
                    )}
                  </td>
                  <td className="text-muted-foreground">{banner.order}</td>
                  <td>
                    <Switch
                      checked={banner.isActive}
                      onCheckedChange={() => handleToggleActive(banner)}
                      className="scale-75"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => navigate(`/admin/banners/${banner.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setBannerToDelete(banner.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedBanners.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No banners found
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
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this banner? This action cannot be undone.
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

export default Banners;
