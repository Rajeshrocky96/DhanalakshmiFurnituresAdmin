import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader } from '@/components/ui/loader';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Combobox } from '@/components/ui/combobox';
import { Category, Subcategory } from '@/types';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const defaultSubcategory: Omit<Subcategory, 'id'> = {
  categoryId: '',
  name: '',
  slug: '',
  order: 1,
  isActive: true,
};

import { api } from '@/lib/api';


const SubcategoryForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState(defaultSubcategory);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id, isEditing]);

  const loadData = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);

      if (isEditing && id) {
        const subs = await api.getSubcategories();
        const subcategory = subs.find((s) => s.id === id || s.subcategoryId === id);
        if (subcategory) {
          setFormData({
            categoryId: subcategory.categoryId,
            name: subcategory.name,
            slug: subcategory.slug,
            order: subcategory.order,
            isActive: subcategory.isActive,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a parent category',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a subcategory name',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.order || formData.order < 1) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid display order (minimum 1)',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isEditing && id) {
        await api.updateSubcategory(id, formData);
      } else {
        await api.createSubcategory(formData);
      }
      toast({
        title: isEditing ? 'Subcategory Updated' : 'Subcategory Created',
        description: `${formData.name} has been ${isEditing ? 'updated' : 'created'} successfully.`,
        variant: 'success',
      });
      navigate('/admin/subcategories');
    } catch (error: any) {
      toast({
        title: 'Error saving subcategory',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  return (
    <AdminLayout
      title={isEditing ? 'Edit Subcategory' : 'Add Subcategory'}
      breadcrumbs={[
        { label: 'Subcategories', href: '/admin/subcategories' },
        { label: isEditing ? 'Edit' : 'New' },
      ]}
    >
      <form onSubmit={handleSubmit} className="max-w-xl">
        <div className="admin-card p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Parent Category *</Label>

              <Combobox
                options={categories.map((cat) => ({
                  value: cat.categoryId || cat.id,
                  label: cat.name,
                }))}
                value={formData.categoryId}
                onChange={(value) => handleChange('categoryId', value)}
                placeholder="Select category"
                searchPlaceholder="Search category..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Subcategory Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Office Chairs"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Display Order *</Label>
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
            {isEditing ? 'Update Subcategory' : 'Save Subcategory'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/subcategories')}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default SubcategoryForm;
