import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ImagePreviewProps {
    src: string;
    alt: string;
    className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ src, alt, className }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className={cn("cursor-pointer overflow-hidden rounded bg-muted group relative", className)}>
                    <img
                        src={src}
                        alt={alt}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">View</span>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                <div className="relative w-full h-full flex items-center justify-center">
                    <img
                        src={src}
                        alt={alt}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
