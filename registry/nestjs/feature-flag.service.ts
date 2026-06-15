import { Injectable, Logger } from '@nestjs/common';
import { evaluateFlag } from '../core/engine';
import type { EvaluationContext, FeatureRule } from '../core/types';

/**
 * Abstract base service for feature flag evaluation in NestJS.
 *
 * Provides a concrete, reusable `evaluate` method that handles the full
 * evaluation pipeline (fail-closed default, logging, pure engine delegation).
 *
 * Consumers must extend this class and implement `getRule` to connect the
 * service to their own data source (TypeORM, Prisma, Drizzle, Redis, etc.).
 *
 * @example
 * // Concrete implementation backed by Prisma:
 * @Injectable()
 * export class PrismaFeatureFlagService extends FeatureFlagService {
 *   constructor(private readonly prisma: PrismaService) {
 *     super();
 *   }
 *
 *   async getRule(key: string): Promise<FeatureRule | null> {
 *     const record = await this.prisma.featureFlag.findUnique({ where: { key } });
 *     if (!record) return null;
 *     return {
 *       enabled: record.enabled,
 *       allowedTiers: record.allowedTiers,
 *       rolloutPercentage: record.rolloutPercentage ?? undefined,
 *     };
 *   }
 * }
 */
@Injectable()
export abstract class FeatureFlagService {
  protected readonly logger = new Logger(FeatureFlagService.name);

  /**
   * Fetches the FeatureRule for a given flag key from the underlying data source.
   *
   * Implement this method in a concrete subclass to connect the service to your
   * database, cache, or remote config provider.
   *
   * @param key - The feature flag key to look up (e.g. 'beta-ui', 'dark-mode').
   * @returns   - The FeatureRule if a record exists, or null if the key is unknown.
   *
   * @example Implementations:
   *   TypeORM:  return this.repo.findOneBy({ key });
   *   Prisma:   return this.prisma.featureFlag.findUnique({ where: { key } });
   *   Drizzle:  const [row] = await db.select().from(featureFlags).where(eq(featureFlags.key, key));
   *             return row ?? null;
   *   Redis:    return this.cacheManager.get<FeatureRule>(`flag:${key}`);
   */
  abstract getRule(key: string): Promise<FeatureRule | null>;

  /**
   * Evaluates a single feature flag for the given EvaluationContext.
   *
   * Delegates the rule fetch to `this.getRule(key)` (implemented by the subclass)
   * and then passes the result to the pure `evaluateFlag` function from the core
   * engine, which applies the kill-switch → tier → rollout-percentage logic.
   *
   * If no rule is found for the key, the method logs a warning and returns `false`
   * (fail-closed / safe default — unknown flags are always disabled).
   *
   * @param context - The evaluation context for the current subject (tenant or user).
   * @param key     - The feature flag key to evaluate (e.g. 'beta-ui').
   * @returns       - `true` if the feature is active for this context, `false` otherwise.
   */
  async evaluate(context: EvaluationContext, key: string): Promise<boolean> {
    const rule = await this.getRule(key);

    if (!rule) {
      this.logger.warn(
        `No rule found for feature flag "${key}". Defaulting to disabled (fail-closed).`,
      );
      return false;
    }

    const result = evaluateFlag(context, rule);

    this.logger.debug(
      `Flag "${key}" evaluated to ${result} for subject "${context.id}" (tier: ${context.tier})`,
    );

    return result;
  }
}
