import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Product } from '@/types';
import { Badge } from '@/components/ui/badge';

import { Check, Package, Tag, Layers } from 'lucide-react';

interface ProductQuickViewProps {
    product: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    getCategoryName: (id: string) => string;
    getSubcategoryName: (id: string) => string;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
    product,
    open,
    onOpenChange,
    getCategoryName,
    getSubcategoryName,
}) => {
    if (!product) return null;

    // Logic to show at most 3 specs
    const displaySpecs = product.specs ? product.specs.slice(0, 3) : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                    {/* Image Section */}
                    <div className="bg-muted p-6 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent" />
                        <img
                            src={product.thumbnailUrl}
                            alt={product.name}
                            className="max-w-full max-h-[300px] md:max-h-[400px] object-contain shadow-lg rounded-lg z-10 transition-transform duration-500 hover:scale-105"
                        />
                        {product.isOnOffer && (
                            <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-20 animate-pulse">
                                OFFER
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="p-6 flex flex-col h-full overflow-y-auto">
                        <DialogHeader className="mb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-primary mb-1">{product.name}</DialogTitle>
                                    <DialogDescription className="text-sm text-muted-foreground flex items-center gap-2">
                                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {getCategoryName(product.categoryId)}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {getSubcategoryName(product.subcategoryId)}</span>
                                    </DialogDescription>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${product.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                    {product.isActive ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-6 flex-1">
                            {/* Description */}
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-foreground/80">Description</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {product.description || "No description available."}
                                </p>
                            </div>

                            {/* Key Specs */}
                            {displaySpecs.length > 0 && (
                                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                                        <Package className="w-4 h-4" /> Key Specifications
                                    </h4>
                                    <div className="grid gap-3">
                                        {displaySpecs.map((spec, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm group">
                                                <span className="text-muted-foreground group-hover:text-primary transition-colors">{spec.key}</span>
                                                <span className="font-medium text-foreground">{spec.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {product.specs.length > 3 && (
                                        <p className="text-xs text-center text-muted-foreground mt-3 italic">
                                            + {product.specs.length - 3} more specifications available
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Tags/Badges */}
                            <div className="flex flex-wrap gap-2">
                                {product.isNewArrival && <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">New Arrival</Badge>}
                                {product.isBestSeller && <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">Best Seller</Badge>}
                                {product.isFeatured && <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200">Featured</Badge>}
                                {product.isInStock ? (
                                    <Badge variant="outline" className="text-green-600 border-green-200 flex gap-1 items-center"><Check className="w-3 h-3" /> In Stock</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-red-600 border-red-200">Out of Stock</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
