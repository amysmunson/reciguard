import React, { useState } from 'react';
import { RefreshControl } from 'react-native';
import { colors } from '../../styles/theme';

// Pull-to-refresh for a FlatList / ScrollView. Screens already show cached
// data first and refetch on focus; this lets the user force a server call at
// any time. `refresh` should return a promise that settles when the screen's
// data has been refetched. Those requests also update the offline banner
// (lib/server/connectivity.js), so a pull is how you clear it once you're
// back online.
//
// Usage: const refreshControl = usePullToRefresh(refresh);
//        <FlatList refreshControl={refreshControl} ... />
export const usePullToRefresh = (refresh) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch {
      // keep showing what's on screen; the offline banner / screen's own
      // error handling covers failures
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
      colors={[colors.primary]}
    />
  );
};
