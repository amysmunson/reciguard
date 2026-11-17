import { useProfileToggle } from './useProfileToggle';

// High-contrast mode (profiles.contrast), shared by the Accessibility screen
// and Settings → Display so both switches always agree. Instant and
// optimistic; see useProfileToggle.
export const useContrastSetting = () => {
  const { value, ready, toggle } = useProfileToggle('contrast', 'Could not update high-contrast mode');
  return { contrast: value, loading: !ready, toggleContrast: toggle };
};
