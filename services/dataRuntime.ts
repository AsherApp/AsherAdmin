import { createBrowserCoordinator, type WatchOptions } from '@asher/data-runtime';
import { getCurrentUser } from './authService';

export const dataRuntime = createBrowserCoordinator();

// The package schedules work; existing query/store layers own the returned data.
export function watchData(options: WatchOptions) {
  const owner = String(getCurrentUser()?.id ?? 'anonymous');
  return dataRuntime.watch({
    ...options,
    key: `${owner}:${options.key}`,
    isActive: () => String(getCurrentUser()?.id ?? 'anonymous') === owner && (!options.isActive || options.isActive()),
  });
}
