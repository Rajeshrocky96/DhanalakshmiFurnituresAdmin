import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader } from '@/components/ui/loader';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Section } from '@/types';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { api } from '@/lib/api';

const SectionForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Omit<Section, 'id' | 'slug'> & { slug: string }>({
    name: '',
    slug: '',
    imageUrl: '',
    icon: '',
    order: 1,
    isActive: true,
    showOnHome: false,
  });
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (id) {
      loadSection(id);
    }
  }, [id]);

  const loadSection = async (sectionId: string) => {
    try {
      const sections = await api.getSections();
      const section = sections.find((s) => s.id === sectionId);
      if (section) {
        setFormData({
          name: section.name,
          slug: section.slug,
          imageUrl: section.imageUrl,
          icon: section.icon,
          order: section.order,
          isActive: section.isActive,
          showOnHome: section.showOnHome,
        });
      }
    } catch (error) {
      toast({ title: 'Error loading section', variant: 'destructive' });
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
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      handleChange('imageUrl', previewUrl);
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
      data.append('name', formData.name);
      data.append('slug', formData.slug);
      data.append('icon', formData.icon);
      data.append('order', formData.order.toString());
      data.append('isActive', formData.isActive.toString());
      data.append('showOnHome', formData.showOnHome.toString());

      if (imageFile) {
        data.append('image', imageFile);
      } else if (formData.imageUrl && !formData.imageUrl.startsWith('blob:')) {
        data.append('imageUrl', formData.imageUrl);
      }

      if (id) {
        await api.updateSection(id, data);
        toast({
          title: 'Section Updated',
          description: `${formData.name} has been updated successfully.`,
          variant: 'success',
        });
        navigate('/admin/sections');
      }
    } catch (error: any) {
      toast({
        title: 'Error updating section',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  return (
    <AdminLayout
      title="Edit Section"
      breadcrumbs={[
        { label: 'Sections', href: '/admin/sections' },
        { label: 'Edit' },
      ]}
    >
      <form onSubmit={handleSubmit} className="max-w-xl">
        <div className="admin-card p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Section Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., New Arrivals"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Section Image</Label>
              {formData.imageUrl ? (
                <div className="relative w-full h-48 group">
                  <img
                    src={formData.imageUrl}
                    alt="Section"
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => handleChange('imageUrl', '')}
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
              <Label htmlFor="icon">Icon Name</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                placeholder="e.g., Sparkles, Trophy, Star"
              />
              <p className="text-xs text-muted-foreground">Use Lucide icon names</p>
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
            <div className="flex items-center space-x-2">
              <Switch
                id="showOnHome"
                checked={formData.showOnHome}
                onCheckedChange={(checked) => handleChange('showOnHome', checked)}
              />
              <Label htmlFor="showOnHome">Show on Home Page</Label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Update Section
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/sections')}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default SectionForm;
