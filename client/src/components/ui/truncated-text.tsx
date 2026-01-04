import React from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TruncatedTextProps {
    text: string;
    className?: string;
    maxChars?: number;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({
    text,
    className,
    maxChars
}) => {
    if (!text) return <span className={className}>-</span>;

    const shouldTruncate = maxChars ? text.length > maxChars : true;
    const displayText = maxChars && shouldTruncate ? `${text.slice(0, maxChars)}...` : text;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={cn("truncate block max-w-[200px]", className)}>
                        {displayText}
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-xs break-words">{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
