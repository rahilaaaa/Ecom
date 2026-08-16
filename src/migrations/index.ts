import * as migration_20260816_113319_initial from './20260816_113319_initial';

export const migrations = [
  {
    up: migration_20260816_113319_initial.up,
    down: migration_20260816_113319_initial.down,
    name: '20260816_113319_initial'
  },
];
