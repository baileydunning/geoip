import { useEffect, useState, useRef, useMemo } from 'react';
import { Map as MapIcon, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GeoIPResponse } from '@/types/geoip';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

interface GeoMapProps {
  data: GeoIPResponse | null;
}

type MapLayer = 'street' | 'satellite';

const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
  },
};

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;
const LOCATION_ZOOM = 10;

export function GeoMap({ data }: GeoMapProps) {
  const [activeLayer, setActiveLayer] = useState<MapLayer>('street');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const hasLocation = data && typeof data.result.latitude === 'number' && typeof data.result.longitude === 'number';
  
  const center: [number, number] = useMemo(() => {
    return hasLocation ? [data.result.latitude, data.result.longitude] : DEFAULT_CENTER;
  }, [hasLocation, data?.result.latitude, data?.result.longitude]);
  
  const zoom = hasLocation ? LOCATION_ZOOM : DEFAULT_ZOOM;

useEffect(() => {
  let map: L.Map | null = null;

  const initMap = async () => {
    const L = await import('leaflet');

    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Fix default icon
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    map = L.map(mapContainerRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    L.tileLayer(TILE_LAYERS.street.url, {
      attribution: TILE_LAYERS.street.attribution,
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    // Let React/layout finish, then tell Leaflet to recalc size
    requestAnimationFrame(() => {
      map.invalidateSize();
    });
  };

  initMap();

  return () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  };
}, []);

useEffect(() => {
  if (!mapInstanceRef.current || !mapReady) return;
  // When data changes, the layout may shift; keep the tiles lined up
  mapInstanceRef.current.invalidateSize();
}, [mapReady, hasLocation, data]);

  // Update tile layer when activeLayer changes
  useEffect(() => {
    const updateTileLayer = async () => {
      if (!mapInstanceRef.current || !mapReady) return;
      
      const L = await import('leaflet');
      const map = mapInstanceRef.current;

      // Remove existing tile layers
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });

      // Add new tile layer
      L.tileLayer(TILE_LAYERS[activeLayer].url, {
        attribution: TILE_LAYERS[activeLayer].attribution,
      }).addTo(map);
    };

    updateTileLayer();
  }, [activeLayer, mapReady]);

  // Update map view and marker when data changes
  useEffect(() => {
    const updateMapView = async () => {
      if (!mapInstanceRef.current || !mapReady) return;
      
      const L = await import('leaflet');
      const map = mapInstanceRef.current;

      // Remove existing marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      // Fly to location
      map.flyTo(center, zoom, { duration: 1.5 });

      // Add marker if we have location data
      if (hasLocation && data) {
        const marker = L.marker([data.result.latitude, data.result.longitude]).addTo(map);
        
        marker.bindPopup(`
          <div style="padding: 4px; min-width: 150px;">
            <p style="font-family: monospace; font-size: 14px; font-weight: bold; margin-bottom: 8px; color: hsl(174, 72%, 40%);">${data.ip}</p>
            <div style="font-size: 14px; color: #374151;">
              <p><span style="color: #6b7280;">City:</span> ${data.result.cityName}</p>
              <p><span style="color: #6b7280;">Region:</span> ${data.result.regionName}</p>
              <p><span style="color: #6b7280;">Country:</span> ${data.result.countryName}</p>
              <p style="font-size: 12px; color: #9ca3af; padding-top: 4px; border-top: 1px solid #e5e7eb; margin-top: 4px;">
                ${data.result.latitude.toFixed(4)}, ${data.result.longitude.toFixed(4)}
              </p>
            </div>
          </div>
        `);
        
        markerRef.current = marker;
      }
    };

    updateMapView();
  }, [center, zoom, hasLocation, data, mapReady]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowLayerMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-primary" />
          <span className="font-medium">Location Map</span>
          {hasLocation && data && (
            <span className="text-xs text-muted-foreground ml-2">
              {data.result.latitude.toFixed(4)}, {data.result.longitude.toFixed(4)}
            </span>
          )}
        </div>
        
        {/* Layer toggle */}
        <div className="relative" ref={menuRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="gap-2 text-xs"
          >
            <Layers className="h-3 w-3" />
            <span className="capitalize">{activeLayer}</span>
          </Button>
          
          {showLayerMenu && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-[1000] animate-fade-in">
              {(['street', 'satellite'] as MapLayer[]).map((layer) => (
                <button
                  key={layer}
                  onClick={() => {
                    setActiveLayer(layer);
                    setShowLayerMenu(false);
                  }}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors capitalize",
                    activeLayer === layer && "bg-primary/10 text-primary"
                  )}
                >
                  {layer}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Map Container */}
      <div className="flex-1 relative min-h-[300px]">
        <div 
          ref={mapContainerRef} 
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        />
        
        {/* No data overlay */}
        {!hasLocation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
            <div className="bg-card/90 backdrop-blur-sm px-6 py-4 rounded-lg border border-border/50 text-center">
              <MapIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm">
                Location will appear here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
