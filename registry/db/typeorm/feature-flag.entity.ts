import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Represents the single latest authoritative state of a feature flag rule.
 * Each row maps one feature key to its current enablement configuration,
 * tier restrictions, and rollout percentage. This entity is the source of
 * truth consumed by the SDK's evaluateFlag engine to make real-time decisions.
 */
@Entity('feature_flags')
export class FeatureFlag {
  /**
   * The unique identifier for this feature flag (e.g. "beta-ui", "dark-mode").
   * Acts as the primary key — one row per flag key.
   */
  @PrimaryColumn({ type: 'varchar' })
  key!: string;

  /**
   * Master kill switch. When false, the feature is disabled for all subjects
   * regardless of tier or rollout percentage.
   */
  @Column({ type: 'boolean', default: false })
  enabled!: boolean;

  /**
   * Optional list of billing tiers permitted to access this feature.
   * Stored as a comma-separated string via TypeORM's 'simple-array' column type.
   * A null value means the feature is not restricted by tier.
   * Examples: ['pro', 'enterprise']
   */
  @Column({ type: 'simple-array', nullable: true })
  allowedTiers!: string[] | null;

  /**
   * Optional gradual rollout percentage (0–100).
   * When set, only a deterministic percentage of subjects (hashed by id)
   * will have the feature enabled. Null means 100% rollout to eligible subjects.
   */
  @Column({ type: 'int', nullable: true })
  rolloutPercentage!: number | null;

  /**
   * Automatically updated by TypeORM on every save.
   * Used to track when the flag configuration was last changed.
   */
  @UpdateDateColumn()
  updatedAt!: Date;
}
