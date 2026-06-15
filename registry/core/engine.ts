import type { EvaluationContext, FeatureFlagMap, FeatureRule } from './types';

/**
 * Computes a deterministic integer in [0, 99] from an arbitrary string using
 * a simple ASCII-sum modulo 100 hash. The same id will always produce the same
 * bucket, which is the core property needed for a consistent rollout.
 */
function hashId(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return sum % 100;
}

/**
 * Evaluates a single FeatureRule against an EvaluationContext and returns a
 * boolean indicating whether the feature should be active for that context.
 *
 * Evaluation order:
 *  1. If `rule.enabled` is false → return false immediately (master kill switch).
 *  2. If `rule.allowedTiers` is defined and `context.tier` is not in the list → return false.
 *  3. If `rule.rolloutPercentage` is defined, hash `context.id` to a value in [0, 99]
 *     and return true only if that value is less than the rollout percentage.
 *  4. All checks passed → return true.
 *
 * @param context - The evaluation context for the subject (tenant or user).
 * @param rule    - The feature rule configuration to evaluate against.
 * @returns       - `true` if the feature is active for this context, `false` otherwise.
 *
 * @example
 * const rule: FeatureRule = { enabled: true, allowedTiers: ['pro'], rolloutPercentage: 50 };
 * const ctx: EvaluationContext = { id: 'tenant_abc', tier: 'pro' };
 * const active = evaluateFlag(ctx, rule); // deterministic based on tenant id
 */
export function evaluateFlag(context: EvaluationContext, rule: FeatureRule): boolean {
  // Step 1: Master kill switch — disabled for everyone.
  if (!rule.enabled) {
    return false;
  }

  // Step 2: Tier restriction — context.tier must be in the allowed list.
  if (rule.allowedTiers !== undefined && !rule.allowedTiers.includes(context.tier)) {
    return false;
  }

  // Step 3: Gradual rollout — hash the subject id and check against the threshold.
  if (rule.rolloutPercentage !== undefined) {
    const bucket = hashId(context.id); // value in [0, 99]
    return bucket < rule.rolloutPercentage;
  }

  // Step 4: All checks passed.
  return true;
}

/**
 * Evaluates an entire record of FeatureRules against a single EvaluationContext
 * and returns a FeatureFlagMap containing the resolved boolean state for each flag.
 *
 * @param context - The evaluation context for the subject (tenant or user).
 * @param rules   - A map of flag keys to their FeatureRule configurations.
 * @returns       - A FeatureFlagMap with every flag key resolved to true or false.
 *
 * @example
 * const rules: Record<string, FeatureRule> = {
 *   'beta-ui':   { enabled: true, allowedTiers: ['pro', 'enterprise'] },
 *   'dark-mode': { enabled: true, rolloutPercentage: 50 },
 *   'old-ui':    { enabled: false },
 * };
 * const ctx: EvaluationContext = { id: 'tenant_abc', tier: 'pro' };
 * const flags = evaluateAllFlags(ctx, rules);
 * // => { 'beta-ui': true, 'dark-mode': true|false, 'old-ui': false }
 */
export function evaluateAllFlags(
  context: EvaluationContext,
  rules: Record<string, FeatureRule>,
): FeatureFlagMap {
  const result: FeatureFlagMap = {};

  for (const key of Object.keys(rules)) {
    result[key] = evaluateFlag(context, rules[key]!);
  }

  return result;
}
