import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Platsåtkomst nekad. Aktivera plats i inställningar.');
        setLoading(false);
        return null;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const loc = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setLocation(loc);
      setLoading(false);
      return loc;
    } catch (e: any) {
      setError(e.message ?? 'Kunde inte hämta plats.');
      setLoading(false);
      return null;
    }
  }, []);

  // Auto-request on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { location, error, loading, requestLocation };
}
