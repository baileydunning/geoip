import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, FileJson2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GeoIPResponse } from '@/types/geoip';
import { cn } from '@/lib/utils';

interface JsonViewerProps {
  data: GeoIPResponse | null;
  error?: string | null;
}

export function JsonViewer({ data, error }: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!data) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const renderValue = (value: unknown, indent: number = 0): JSX.Element => {
    if (value === null) {
      return <span className="json-null">null</span>;
    }
    if (typeof value === 'number') {
      return <span className="json-number">{value}</span>;
    }
    if (typeof value === 'string') {
      return <span className="json-string">"{value}"</span>;
    }
    if (typeof value === 'object') {
      // Recursively render nested objects
      return (
        <>
          <span className="text-muted-foreground">{'{'}</span>
          <div className="pl-4">
            {renderJson(value as Record<string, unknown>, indent + 1)}
          </div>
          <span className="text-muted-foreground">{'}'}</span>
        </>
      );
    }
    return <span>{String(value)}</span>;
  };

  const renderJson = (obj: Record<string, unknown>, indent: number = 0): JSX.Element[] => {
    const entries = Object.entries(obj);
    
    return entries.map(([key, value], index) => (
      <div
        key={key}
        className="animate-fade-in"
        style={{ 
          paddingLeft: `${indent * 20}px`,
          animationDelay: `${index * 30}ms`
        }}
      >
        <span className="json-key">"{key}"</span>
        <span className="text-muted-foreground">: </span>
        {renderValue(value, indent)}
        {index < entries.length - 1 && <span className="text-muted-foreground">,</span>}
      </div>
    ));
  };

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <FileJson2 className="h-5 w-5 text-destructive" />
            <span className="font-medium text-destructive">Error Response</span>
          </div>
        </div>
        <div className="flex-1 p-4 font-mono text-sm">
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <FileJson2 className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-center">
          Enter an IP address and click Lookup<br />
          to see the geolocation data
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:text-primary transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <FileJson2 className="h-5 w-5 text-primary" />
          <span className="font-medium">JSON Response</span>
          <span className="text-xs text-muted-foreground ml-2">
            {Object.keys(data).length} fields
          </span>
        </button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-success" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
      
      {/* JSON Content */}
      <div 
        className={cn(
          "flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed bg-code transition-all",
          !isExpanded && "h-0 p-0 overflow-hidden"
        )}
      >
        <div className="text-muted-foreground">{'{'}</div>
        <div className="pl-4">
          {renderJson(data as unknown as Record<string, unknown>)}
        </div>
        <div className="text-muted-foreground">{'}'}</div>
      </div>
    </div>
  );
}
