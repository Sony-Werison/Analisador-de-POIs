
'use client';

import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L, { type LatLngBounds } from 'leaflet';
import 'leaflet.markercluster';
import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import type { POI } from '@/types';
import { useTranslations } from '@/lib/translations';

// Fix for default icon issue with Leaflet and Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const icons: { [key: string]: L.Icon } = {
  clean: createIcon('blue'),
  duplicate: createIcon('red'),
  proximity: createIcon('yellow'),
  invalid: createIcon('black'),
  location: createIcon('violet'),
  base: createIcon('green'),
  match: createIcon('orange'),
  default: createIcon('grey'),
};

function MarkerCluster({ points }: { points: POI[] }) {
  const map = useMap();
  const { t } = useTranslations();
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!map) return;
    
    // Initialize cluster group
    if (!markerClusterGroupRef.current) {
        markerClusterGroupRef.current = L.markerClusterGroup();
        map.addLayer(markerClusterGroupRef.current);
    }

    const markerClusterGroup = markerClusterGroupRef.current;
    
    // Clear existing layers
    markerClusterGroup.clearLayers();

    if (points && points.length > 0) {
      const markers = points
        .map((point) => {
          if (point.latitude === null || point.longitude === null) return null;
          const icon = icons[point.status?.type || 'default'] || icons.default;
          const marker = L.marker([point.latitude, point.longitude], { icon });
          marker.bindPopup(
            `<b>${t('map_popup_row')}:</b> ${point.row}<br><b>Lat:</b> ${point.latitude}<br><b>Lon:</b> ${point.longitude}<br><b>${t('map_popup_status')}:</b> ${point.status?.reason || 'N/A'}`
          );
          return marker;
        })
        .filter((m): m is L.Marker => m !== null);
      
      if (markers.length > 0) {
        markerClusterGroup.addLayers(markers);
      }
    }

    return () => {
        if(markerClusterGroupRef.current) {
            // Clean up when component unmounts
        }
    }
  }, [points, map, t]);

  return null;
}


function MapController({
  bounds,
  highlightedPoints,
  highlightedBounds,
}: {
  bounds?: LatLngBounds;
  highlightedPoints: POI[];
  highlightedBounds?: LatLngBounds;
}) {
  const map = useMap();
  const highlightLayerRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (bounds && Object.keys(bounds).length > 0 && map) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
      } catch (e) {
        console.error("Error fitting bounds:", e, bounds);
      }
    }
  }, [bounds, map]);

  useEffect(() => {
    // Clear previous highlight
    if (highlightLayerRef.current) {
      map.removeLayer(highlightLayerRef.current);
      highlightLayerRef.current = null;
    }

    if (highlightedPoints.length > 0) {
      const markers = highlightedPoints
        .map((point) => {
          if (point.latitude === null || point.longitude === null) return null;
          const icon = icons[point.status?.type || 'default'] || icons.default;
          return L.marker([point.latitude, point.longitude], { icon });
        })
        .filter((m): m is L.Marker => m !== null);

      if (markers.length > 0) {
        const featureGroup = L.featureGroup(markers);
        highlightLayerRef.current = featureGroup;
        map.addLayer(featureGroup);
        if (highlightedBounds) {
          map.fitBounds(highlightedBounds, { padding: [50, 50], maxZoom: 18 });
        }
      }
    }
  }, [highlightedPoints, highlightedBounds, map]);

  return null;
}

type MapViewProps = {
  points: POI[];
  bounds?: LatLngBounds;
  highlightedPoints: POI[];
  highlightedBounds?: LatLngBounds;
};

export default function MapView({
  points,
  bounds,
  highlightedPoints,
  highlightedBounds,
}: MapViewProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="h-[calc(100vh-150px)] min-h-[600px] w-full rounded-lg shadow-inner overflow-hidden">
      <MapContainer
        center={[-14.235, -51.925]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        // @ts-ignore
        whenReady={() => console.log('Map is ready')}
      >
        {resolvedTheme === 'dark' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        <MarkerCluster points={points} />
        <MapController
          bounds={bounds}
          highlightedPoints={highlightedPoints}
          highlightedBounds={highlightedBounds}
        />
      </MapContainer>
    </div>
  );
}
