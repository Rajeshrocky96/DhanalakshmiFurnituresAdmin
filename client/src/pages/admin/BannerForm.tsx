import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader } from '@/components/ui/loader';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Combobox } from '@/components/ui/combobox';
import { bannerPositions, Banner } from '@/types';
import { Save, X, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const defaultBanner: Omit<Banner, 'id'> = {
  title: '',
  subtitle: '',
  image: '',
  position: 'HOME_HERO',
  order: 1,
  isActive: true,
  redirectType: 'NONE',
  redirectValue: '',
  categoryId: '',
};

import { api } from '@/lib/api';
import { Category, Product } from '@/types';

const BannerForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState(defaultBanner);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, [id, isEditing]);

  const loadData = async () => {
    try {
      const [cats, prods] = await Promise.all([
        api.getCategories(),
        api.getProducts()
      ]);
      setCategories(cats);
      setProducts(prods);

      if (isEditing && id) {
        const banners = await api.getBanners();
        const banner = banners.find((b) => b.id === id);
        if (banner) {
          setFormData({
            title: banner.title,
            subtitle: banner.subtitle,
            image: banner.image || '',
            position: banner.position,
            order: banner.order,
            isActive: banner.isActive,
            redirectType: banner.redirectType,
            redirectValue: banner.redirectValue,
            categoryId: banner.categoryId || '',
          });
        }
      }
    } catch (error) {
      toast({ title: 'Error loading data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Please use an image under 5MB', variant: 'destructive' });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      handleChange('image', previewUrl);
      setImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.order || formData.order < 1) {
      toast({ title: 'Validation Error', description: 'Please enter a valid display order (minimum 1)', variant: 'destructive' });
      return;
    }

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('subtitle', formData.subtitle);
      data.append('position', formData.position);
      data.append('order', formData.order.toString());
      data.append('isActive', formData.isActive.toString());
      data.append('redirectType', formData.redirectType);
      data.append('redirectValue', formData.redirectValue);
      if (formData.categoryId) data.append('categoryId', formData.categoryId);

      if (imageFile) {
        data.append('image', imageFile);
      } else if (formData.image && !formData.image.startsWith('blob:')) {
        data.append('image', formData.image);
      }

      if (isEditing && id) {
        await api.updateBanner(id, data);
      } else {
        await api.createBanner(data);
      }
      toast({
        title: isEditing ? 'Banner Updated' : 'Banner Created',
        description: `${formData.title} has been ${isEditing ? 'updated' : 'created'} successfully.`,
        variant: 'success',
      });
      navigate('/admin/banners');
    } catch (error: any) {
      toast({
        title: 'Error saving banner',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  return (
    <AdminLayout
      title={isEditing ? 'Edit Banner' : 'Add Banner'}
      breadcrumbs={[
        { label: 'Banners', href: '/admin/banners' },
        { label: isEditing ? 'Edit' : 'New' },
      ]}
    >
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/banners')} className="pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-3">
          <Button type="submit" form="banner-form">
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Update Banner' : 'Save Banner'}
          </Button>
        </div>
      </div>

      <form id="banner-form" onSubmit={handleSubmit} className="w-full">
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-medium mb-4">Banner Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Banner Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Summer Sale"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  placeholder="e.g., Up to 50% off on all items"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-medium mb-4">Banner Image</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Image *</Label>
                {formData.image ? (
                  <div className="relative w-full h-48 group">
                    <img
                      src={formData.image}
                      alt="Banner"
                      className="w-full h-full object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('image', '')}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Input
                        type="file"
                        onChange={handleFileUpload}
                        className="cursor-pointer"
                        accept="image/*"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Position & Order */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-medium mb-4">Display Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Combobox
                  options={bannerPositions.map((pos) => ({
                    value: pos.value,
                    label: pos.label,
                  }))}
                  value={formData.position}
                  onChange={(value) => handleChange('position', value)}
                  placeholder="Select position"
                  searchPlaceholder="Search position..."
                />
              </div>
              {formData.position === 'CATEGORY_TOP' && (
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Target Category *</Label>
                  <Combobox
                    options={categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    }))}
                    value={formData.categoryId}
                    onChange={(value) => handleChange('categoryId', value)}
                    placeholder="Select category"
                    searchPlaceholder="Search category..."
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) => handleChange('order', e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="e.g., 1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
          </div>

          {/* Redirect Settings */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-medium mb-4">Redirect Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="redirectType">Redirect Type</Label>
                <Combobox
                  options={[
                    { value: 'NONE', label: 'No Redirect' },
                    { value: 'CATEGORY', label: 'Category' },
                    { value: 'PRODUCT', label: 'Product' },
                  ]}
                  value={formData.redirectType}
                  onChange={(value) => {
                    handleChange('redirectType', value);
                    handleChange('redirectValue', '');
                  }}
                  placeholder="Select redirect type"
                  searchPlaceholder="Search type..."
                />
              </div>
              {formData.redirectType === 'CATEGORY' && (
                <div className="space-y-2">
                  <Label htmlFor="redirectValue">Select Category</Label>
                  <Combobox
                    options={categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    }))}
                    value={formData.redirectValue}
                    onChange={(value) => handleChange('redirectValue', value)}
                    placeholder="Select category"
                    searchPlaceholder="Search category..."
                  />
                </div>
              )}
              {formData.redirectType === 'PRODUCT' && (
                <div className="space-y-2">
                  <Label htmlFor="redirectValue">Select Product</Label>
                  <Combobox
                    options={products.map((prod) => ({
                      value: prod.id,
                      label: prod.name,
                    }))}
                    value={formData.redirectValue}
                    onChange={(value) => handleChange('redirectValue', value)}
                    placeholder="Select product"
                    searchPlaceholder="Search product..."
                  />
                </div>
              )}
            </div>
          </div>


        </div>
      </form>
    </AdminLayout >
  );
};

export default BannerForm;
