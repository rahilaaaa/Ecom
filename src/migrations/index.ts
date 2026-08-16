import * as migration_20260816_113319_initial from './20260816_113319_initial';
import * as migration_20260816_215300_pricing_mode from './20260816_215300_pricing_mode';

export const migrations = [
  {
    up: migration_20260816_113319_initial.up,
    down: migration_20260816_113319_initial.down,
    name: '20260816_113319_initial'
  },
  {
    up: migration_20260816_215300_pricing_mode.up,
    down: migration_20260816_215300_pricing_mode.down,
    name: '20260816_215300_pricing_mode'
  },
];
