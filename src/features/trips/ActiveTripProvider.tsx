import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useUserProfile } from '../profile/profile.data';
import { useMyTrips } from './trips.data';
import { pickActiveTrip, type Trip } from './model';

interface ActiveTripState {
  trips: Trip[];
  /** The active trip: the user's choice if they still belong to it, else their first trip. */
  trip: Trip | null;
  loading: boolean;
}

const ActiveTripContext = createContext<ActiveTripState>({ trips: [], trip: null, loading: true });

export function ActiveTripProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const profile = useUserProfile(user?.uid);
  const myTrips = useMyTrips(user?.uid);

  const value = useMemo<ActiveTripState>(
    () => ({
      trips: myTrips.data,
      trip: pickActiveTrip(myTrips.data, profile?.activeTripId),
      loading: myTrips.loading,
    }),
    [myTrips.data, myTrips.loading, profile?.activeTripId],
  );

  return <ActiveTripContext.Provider value={value}>{children}</ActiveTripContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs with its provider
export function useActiveTrip() {
  return useContext(ActiveTripContext);
}
