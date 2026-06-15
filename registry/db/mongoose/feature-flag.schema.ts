import { model, models, Schema } from 'mongoose';

/**
 * TypeScript interface representing a single FeatureFlag document.
 * Mirrors the schema fields and includes the auto-managed timestamp fields
 * added by Mongoose's { timestamps: true } option.
 */
export interface IFeatureFlag {
  /** The unique identifier for this feature flag (e.g. "beta-ui", "dark-mode"). */
  key: string;
  /** Master kill switch. When false, the feature is disabled for all subjects. */
  enabled: boolean;
  /**
   * Optional list of billing tiers permitted to access this feature.
   * An empty array means the feature is not restricted by tier.
   */
  allowedTiers: string[];
  /**
   * Optional gradual rollout percentage (0–100).
   * When undefined, the feature is rolled out to 100% of eligible subjects.
   */
  rolloutPercentage?: number;
  /** Auto-managed by Mongoose via { timestamps: true }. */
  createdAt: Date;
  /** Auto-managed by Mongoose via { timestamps: true }. */
  updatedAt: Date;
}

/**
 * Represents the single latest authoritative state of a feature flag rule.
 * Each document maps one feature key to its current enablement configuration,
 * tier restrictions, and rollout percentage. This collection is the source of
 * truth consumed by the SDK's evaluateFlag engine to make real-time decisions.
 */
const FeatureFlagSchema = new Schema<IFeatureFlag>(
  {
    /**
     * The unique identifier for this feature flag (e.g. "beta-ui", "dark-mode").
     * Required and unique — one document per flag key.
     */
    key: {
      type: String,
      required: true,
      unique: true,
    },

    /**
     * Master kill switch. When false, the feature is disabled for all subjects
     * regardless of tier or rollout percentage.
     */
    enabled: {
      type: Boolean,
      default: false,
    },

    /**
     * Optional list of billing tiers permitted to access this feature.
     * An empty array means the feature is not restricted by tier.
     * Examples: ['pro', 'enterprise']
     */
    allowedTiers: {
      type: [String],
      default: [],
    },

    /**
     * Optional gradual rollout percentage (0–100).
     * When set, only a deterministic percentage of subjects (hashed by id)
     * will have the feature enabled. Undefined means 100% rollout.
     */
    rolloutPercentage: {
      type: Number,
      required: false,
    },
  },
  {
    /**
     * Automatically adds and manages 'createdAt' and 'updatedAt' Date fields
     * on every document. Mongoose updates 'updatedAt' on every save/update.
     */
    timestamps: true,
  },
);

/**
 * The Mongoose model for the FeatureFlag collection.
 *
 * The `models.FeatureFlag || model(...)` pattern prevents Mongoose from
 * throwing a "Cannot overwrite model" error in hot-reloading environments
 * such as Next.js dev mode.
 */
export const FeatureFlag =
  (models.FeatureFlag as ReturnType<typeof model<IFeatureFlag>>) ||
  model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);
