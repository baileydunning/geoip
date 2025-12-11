import { useState, useEffect } from 'react';
import { Search, Globe, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateIPv4, detectVisitorIP } from '@/services/geoip';
import { cn } from '@/lib/utils';

interface IPInputProps {
  onLookup: (ip: string) => void;
  isLoading: boolean;
}

export function IPInput({ onLookup, isLoading }: IPInputProps) {
  const [ip, setIp] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-detect visitor IP on mount
    handleDetectIP();
  }, []);

  const handleDetectIP = async () => {
    setIsDetecting(true);
    try {
      const detectedIP = await detectVisitorIP();
      setIp(detectedIP);
      setValidationError(null);
    } catch (error) {
      console.error('Failed to detect IP:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIp(value);
    
    if (value && !validateIPv4(value)) {
      setValidationError('Invalid IPv4 format');
    } else {
      setValidationError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ip.trim()) {
      setValidationError('Please enter an IP address');
      return;
    }

    if (!validateIPv4(ip)) {
      setValidationError('Invalid IPv4 format (e.g., 8.8.8.8)');
      return;
    }

    setValidationError(null);
    onLookup(ip.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter IP address (e.g., 8.8.8.8)"
            value={ip}
            onChange={handleInputChange}
            disabled={isLoading || isDetecting}
            className={cn(
              "pl-10 pr-10 h-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 font-mono text-sm",
              validationError && "border-destructive focus:border-destructive focus:ring-destructive/20"
            )}
          />
          {isDetecting && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDetectIP}
            disabled={isLoading || isDetecting}
            className="h-12 w-12 shrink-0"
            title="Detect my IP"
          >
            <RefreshCw className={cn("h-4 w-4", isDetecting && "animate-spin")} />
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading || isDetecting || !ip.trim()}
            className="h-12 px-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/25"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Looking up...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Lookup</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      {validationError && (
        <p className="mt-2 text-sm text-destructive animate-fade-in">
          {validationError}
        </p>
      )}
    </form>
  );
}
