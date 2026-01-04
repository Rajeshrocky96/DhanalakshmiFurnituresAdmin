import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader } from '@/components/ui/loader';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Product, ProductSpec } from '@/types';
import { Plus, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const defaultProduct: Omit<Product, 'id' | 'createdAt'> = {
  name: '',
  slug: '',
  categoryId: '',
  subcategoryId: '',
  description: '',
  thumbnailUrl: '',
  imageUrls: [''],
  specs: [{ key: '', value: '' }],
  isActive: true,
  isNewArrival: false,
  isBestSeller: false,
  isFeatured: false,
  isTrending: false,
  isPremium: false,
  isRecommended: false,
  isOnOffer: false,
  isCustomOrder: false,
  isInStock: true,
  offerText: '',
  rating: 0,
};

import { api } from '@/lib/api';
import { Category, Subcategory } from '@/types';

const ProductForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(id);



  const [formData, setFormData] = useState(defaultProduct);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  useEffect(() => {
    loadData();
  }, [id, isEditing]);

  const loadData = async () => {
    try {
      const [cats, subs] = await Promise.all([
        api.getCategories(),
        api.getSubcategories()
      ]);
      setCategories(cats);
      setSubcategories(subs);

      if (isEditing && id) {
        const products = await api.getProducts();
        const product = products.find((p) => p.id === id);
        if (product) {
          setFormData({
            name: product.name,
            slug: product.slug,
            categoryId: product.categoryId,
            subcategoryId: product.subcategoryId,
            description: product.description,
            thumbnailUrl: product.thumbnailUrl,
            imageUrls: product.imageUrls.length > 0 ? product.imageUrls : [''],
            specs: product.specs.length > 0 ? product.specs : [{ key: '', value: '' }],
            isActive: product.isActive,
            isNewArrival: product.isNewArrival,
            isBestSeller: product.isBestSeller,
            isFeatured: product.isFeatured,
            isTrending: product.isTrending,
            isPremium: product.isPremium,
            isRecommended: product.isRecommended,
            isOnOffer: product.isOnOffer,
            isCustomOrder: product.isCustomOrder,
            isInStock: product.isInStock,
            offerText: product.offerText,
            rating: product.rating,
          });
        }
      }
    } catch (error) {
      toast({ title: 'Error loading data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ...

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

  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...formData.specs];
    newSpecs[index] = { ...newSpecs[index], [field]: value };
    setFormData((prev) => ({ ...prev, specs: newSpecs }));
  };

  const addSpec = () => {
    setFormData((prev) => ({ ...prev, specs: [...prev.specs, { key: '', value: '' }] }));
  };

  const removeSpec = (index: number) => {
    if (formData.specs.length > 1) {
      setFormData((prev) => ({
        ...prev,
        specs: prev.specs.filter((_, i) => i !== index),
      }));
    }
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.imageUrls];
    newUrls[index] = value;
    setFormData((prev) => ({ ...prev, imageUrls: newUrls }));
  };

  const addImageUrl = () => {
    setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }));
  };

  const removeImageUrl = (index: number) => {
    if (formData.imageUrls.length > 1) {
      setFormData((prev) => ({
        ...prev,
        imageUrls: prev.imageUrls.filter((_, i) => i !== index),
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'thumbnailUrl' | 'imageUrls', index?: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Please use an image under 5MB', variant: 'destructive' });
        return;
      }

      const previewUrl = URL.createObjectURL(file);

      if (field === 'thumbnailUrl') {
        setThumbnailFile(file);
        handleChange('thumbnailUrl', previewUrl);
      } else if (field === 'imageUrls' && typeof index === 'number') {
        // Add to gallery files
        setGalleryFiles(prev => [...prev, file]);

        // Update form data preview
        if (index === formData.imageUrls.length) {
          setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls.filter(u => u), previewUrl] }));
        } else {
          handleImageUrlChange(index, previewUrl);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('slug', formData.slug);
      data.append('categoryId', formData.categoryId);
      data.append('subcategoryId', formData.subcategoryId);
      data.append('description', formData.description);
      data.append('isActive', formData.isActive.toString());
      data.append('isNewArrival', formData.isNewArrival.toString());
      data.append('isBestSeller', formData.isBestSeller.toString());
      data.append('isFeatured', formData.isFeatured.toString());
      data.append('isTrending', formData.isTrending.toString());
      data.append('isPremium', formData.isPremium.toString());
      data.append('isRecommended', formData.isRecommended.toString());
      data.append('isOnOffer', formData.isOnOffer.toString());
      data.append('isCustomOrder', formData.isCustomOrder.toString());
      data.append('isInStock', formData.isInStock.toString());
      data.append('offerText', formData.offerText);
      data.append('rating', formData.rating.toString());
      data.append('specs', JSON.stringify(formData.specs));

      if (thumbnailFile) {
        data.append('thumbnail', thumbnailFile);
      } else if (formData.thumbnailUrl && !formData.thumbnailUrl.startsWith('blob:')) {
        data.append('thumbnailUrl', formData.thumbnailUrl);
      }

      // Append gallery images
      galleryFiles.forEach((file) => {
        data.append('images', file);
      });

      // Also append existing URLs that haven't changed
      const existingUrls = formData.imageUrls.filter(url => url && !url.startsWith('blob:'));
      data.append('imageUrls', JSON.stringify(existingUrls));

      if (isEditing && id) {
        await api.updateProduct(id, data);
      } else {
        await api.createProduct(data);
      }
      toast({
        title: isEditing ? 'Product Updated' : 'Product Created',
        description: `${formData.name} has been ${isEditing ? 'updated' : 'created'} successfully.`,
        variant: 'success',
      });
      navigate('/admin/products');
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Error saving product',
        description: error.message || 'Unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const filteredSubcategories = formData.categoryId
    ? subcategories.filter(
      (s) => s.PK === `CATEGORY#${formData.categoryId}`
    )
    : subcategories;


  const flags = [
    { key: 'isActive', label: 'Active' },
    { key: 'isNewArrival', label: 'New Arrival' },
    { key: 'isBestSeller', label: 'Best Seller' },
    { key: 'isFeatured', label: 'Featured' },
    { key: 'isTrending', label: 'Trending' },
    { key: 'isPremium', label: 'Premium' },
    { key: 'isRecommended', label: 'Recommended' },
    { key: 'isOnOffer', label: 'On Offer' },
    { key: 'isCustomOrder', label: 'Custom Order' },
    { key: 'isInStock', label: 'In Stock' },
  ];

  return (
    <AdminLayout
      title={isEditing ? 'Edit Product' : 'Add Product'}
      breadcrumbs={[
        { label: 'Products', href: '/admin/products' },
        { label: isEditing ? 'Edit' : 'New' },
      ]}
    >
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/products')} className="pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-3">
          <Button type="submit" form="product-form">
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Update Product' : 'Save Product'}
          </Button>
        </div>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="w-full">
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Ergonomic Office Chair"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Combobox
                  options={categories.map((cat) => ({
                    value: cat.categoryId,
                    label: cat.name,
                  }))}
                  value={formData.categoryId}
                  onChange={(value) => {
                    handleChange('categoryId', value);
                    handleChange('subcategoryId', '');
                  }}
                  placeholder="Select category"
                  searchPlaceholder="Search category..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory *</Label>
                <Combobox
                  options={filteredSubcategories.map((sub) => ({
                    value: sub.subcategoryId,
                    label: sub.name,
                  }))}
                  value={formData.subcategoryId}
                  onChange={(value) => handleChange('subcategoryId', value)}
                  disabled={!formData.categoryId}
                  placeholder="Select subcategory"
                  searchPlaceholder="Search subcategory..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="e.g., A comfortable chair for long hours..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-medium mb-4">Images</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail Image</Label>
                {formData.thumbnailUrl ? (
                  <div className="relative w-24 h-24 group">
                    <img
                      src={formData.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('thumbnailUrl', '')}
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
                        onChange={(e) => handleFileUpload(e, 'thumbnailUrl')}
                        className="cursor-pointer"
                        accept="image/*"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Product Images</Label>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                  {formData.imageUrls.map((url, index) => (
                    url ? (
                      <div key={index} className="relative aspect-square group">
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border"
                        />
                        {formData.imageUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageUrl(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm hover:bg-destructive/90"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ) : null
                  ))}

                  <div className="relative aspect-square border-2 border-dashed rounded-lg hover:bg-accent/50 transition-colors flex flex-col items-center justify-center p-2">
                    <Input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleFileUpload(e, 'imageUrls', formData.imageUrls.length)}
                      accept="image/*"
                    />
                    <Plus className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">Add Image</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-medium mb-4">Specifications</h3>
            <div className="space-y-3">
              {formData.specs.map((spec, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={spec.key}
                    onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                    placeholder="Key (e.g., Material)"
                    className="flex-1"
                  />
                  <Input
                    value={spec.value}
                    onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                    placeholder="Value (e.g., Teak Wood)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSpec(index)}
                    disabled={formData.specs.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSpec}>
                <Plus className="h-4 w-4 mr-2" />
                Add Specification
              </Button>
            </div>
          </div>

          {/* Flags */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-medium mb-4">Product Flags</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {flags.map((flag) => (
                <div key={flag.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={flag.key}
                    checked={formData[flag.key as keyof typeof formData] as boolean}
                    onCheckedChange={(checked) => handleChange(flag.key, checked)}
                  />
                  <Label htmlFor={flag.key} className="text-sm cursor-pointer">
                    {flag.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Offer & Rating */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-medium mb-4">Offer & Rating</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offerText">Offer Text</Label>
                <Input
                  id="offerText"
                  value={formData.offerText}
                  onChange={(e) => handleChange('offerText', e.target.value)}
                  placeholder="e.g., 20% OFF on Diwali Sale"
                  disabled={!formData.isOnOffer}
                />
                {!formData.isOnOffer && (
                  <p className="text-xs text-muted-foreground">
                    Enable "On Offer" flag to add offer text
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (0-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => handleChange('rating', e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="e.g., 4.5"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default ProductForm;
