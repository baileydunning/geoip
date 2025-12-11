import { cn } from '@/lib/utils';

interface LoadingCardProps {
  className?: string;
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
        
        {/* Spinning arc */}
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse-glow" />
        </div>
      </div>
      
      <p className="mt-4 text-sm text-muted-foreground animate-pulse">
        Looking up location...
      </p>
    </div>
  );
}
