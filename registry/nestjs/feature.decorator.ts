import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to store the required tiers on a route handler or controller.
 * Read by a Guard to enforce tier-based access control.
 */
export const REQUIRED_TIERS = 'REQUIRED_TIERS';

/**
 * Metadata key used to store the required feature flag key on a route handler or controller.
 * Read by a Guard to enforce feature-flag-based access control.
 */
export const REQUIRED_FEATURE = 'REQUIRED_FEATURE';

/**
 * Decorator that restricts a route or controller to subjects whose active tier
 * is included in the provided list of allowed tiers.
 *
 * Attach to a controller class or individual route handler method.
 * A corresponding Guard must use `Reflector.get(REQUIRED_TIERS, context.getHandler())`
 * to read this metadata and enforce the restriction.
 *
 * @param tiers - An array of tier strings that are allowed access.
 *
 * @example
 * // Allow only 'pro' and 'enterprise' tenants:
 * @RequireTier(['pro', 'enterprise'])
 * @Get('analytics')
 * getAnalytics() { ... }
 */
export const RequireTier = (tiers: string[]) => SetMetadata(REQUIRED_TIERS, tiers);

/**
 * Decorator that restricts a route or controller to requests where the specified
 * feature flag is enabled for the current subject's evaluation context.
 *
 * Attach to a controller class or individual route handler method.
 * A corresponding Guard must use `Reflector.get(REQUIRED_FEATURE, context.getHandler())`
 * to read this metadata and call `evaluateFlag` or check the resolved FeatureFlagMap.
 *
 * @param featureKey - The feature flag key to check (e.g. 'beta-ui', 'new-checkout').
 *
 * @example
 * // Only serve this route when 'new-checkout' is enabled for the tenant:
 * @RequireFeature('new-checkout')
 * @Post('checkout')
 * startCheckout() { ... }
 */
export const RequireFeature = (featureKey: string) => SetMetadata(REQUIRED_FEATURE, featureKey);
