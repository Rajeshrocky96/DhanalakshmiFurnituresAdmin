import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader } from '@/components/ui/loader';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Category, Section } from '@/types';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Combobox } from '@/components/ui/combobox';

import { api } from '@/lib/api';

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const defaultCategory: Omit<Category, 'id'> = {
  sectionId: '',
  name: '',
  slug: '',
  image: '',
  order: 1,
  isActive: true,
};

const CategoryForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState(defaultCategory);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, [id, isEditing]);

  const loadData = async () => {
    try {
      const sectionsData = await api.getSections();
      setSections(sectionsData);

      if (isEditing && id) {
        const categories = await api.getCategories();
        const category = categories.find((c) => c.id === id || c.categoryId === id);
        if (category) {
          setFormData({
            sectionId: category.sectionId || '',
            name: category.name,
            slug: category.slug,
            image: category.image,
            order: category.order,
            isActive: category.isActive,
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
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'name') {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Please use an image under 5MB', variant: 'destructive' });
        return;
      }

      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      handleChange('image', previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sectionId) {
      toast({ title: 'Section is required', variant: 'destructive' });
      return;
    }

    if (!formData.order || formData.order < 1) {
      toast({ title: 'Validation Error', description: 'Please enter a valid display order (minimum 1)', variant: 'destructive' });
      return;
    }

    try {
      const data = new FormData();
      data.append('sectionId', formData.sectionId);
      data.append('name', formData.name);
      data.append('slug', formData.slug);
      data.append('order', formData.order.toString());
      data.append('isActive', formData.isActive.toString());

      if (imageFile) {
        data.append('image', imageFile);
      } else if (!formData.image.startsWith('blob:')) {
        data.append('image', formData.image);
      }

      if (isEditing && id) {
        await api.updateCategory(id, data);
      } else {
        await api.createCategory(data);
      }
      toast({
        title: isEditing ? 'Category Updated' : 'Category Created',
        description: `${formData.name} has been ${isEditing ? 'updated' : 'created'} successfully.`,
        variant: 'success',
      });
      navigate('/admin/categories');
    } catch (error: any) {
      toast({
        title: 'Error saving category',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  return (
    <AdminLayout
      title={isEditing ? 'Edit Category' : 'Add Category'}
      breadcrumbs={[
        { label: 'Categories', href: '/admin/categories' },
        { label: isEditing ? 'Edit' : 'New' },
      ]}
    >
      <form onSubmit={handleSubmit} className="w-full">
        <div className="admin-card p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sectionId">Section *</Label>
              <Combobox
                options={sections.map((section) => ({
                  value: section.id,
                  label: section.name,
                }))}
                value={formData.sectionId}
                onChange={(value) => handleChange('sectionId', value)}
                placeholder="Select section"
                searchPlaceholder="Search section..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Office Furniture"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Category Image</Label>
              {formData.image ? (
                <div className="relative w-full h-48 group">
                  <img
                    src={formData.image}
                    alt="Category"
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

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Update Category' : 'Save Category'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/categories')}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default CategoryForm;
