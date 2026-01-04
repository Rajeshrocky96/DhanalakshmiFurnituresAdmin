import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
    fullScreen?: boolean;
    className?: string;
    size?: number;
}

export const Loader: React.FC<LoaderProps> = ({ fullScreen = false, className = '', size = 24 }) => {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                <Loader2 className={`animate-spin text-primary ${className}`} size={48} />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-4">
            <Loader2 className={`animate-spin text-primary ${className}`} size={size} />
        </div>
    );
};
