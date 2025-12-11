import { useState, useEffect } from 'react';
import { Globe, Github, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IPInput } from '@/components/IPInput';
import { JsonViewer } from '@/components/JsonViewer';
import { GeoMap } from '@/components/GeoMap';
import { LoadingCard } from '@/components/LoadingCard';
import { fetchGeoIP } from '@/services/geoip';
import { GeoIPResponse } from '@/types/geoip';

const Index = () => {
  const [data, setData] = useState<GeoIPResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Initialize theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleLookup = async (ip: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchGeoIP(ip);
      
      if ('error' in result) {
        setError(result.message);
        setData(null);
      } else {
        setData(result);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch geolocation data. Please try again.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">GeoIP Lookup</h1>
                <p className="text-xs text-muted-foreground">Powered by Harper & IP2Location LITE</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-9 w-9"
              >
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="View on GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
          
          <IPInput onLookup={handleLookup} isLoading={isLoading} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
          {/* JSON Panel */}
          <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
            {isLoading ? (
              <LoadingCard className="h-full" />
            ) : (
              <JsonViewer data={data} error={error} />
            )}
          </div>
          
          {/* Map Panel */}
          <div className="glass-card rounded-xl overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
            <GeoMap data={data} />
          </div>
        </div>
        
        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>
            This application uses IP2Location LITE data. 
            <span className="mx-1">•</span>
            <a 
              href="https://lite.ip2location.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Get IP2Location Data
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
