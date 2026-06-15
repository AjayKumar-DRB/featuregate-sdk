import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { EvaluationContext } from '../core/types';
import { REQUIRED_FEATURE, REQUIRED_TIERS } from './feature.decorator';
import { FeatureFlagService } from './feature-flag.service';

/**
 * Extracts an EvaluationContext from the HTTP request.
 *
 * Assumes the request has been authenticated upstream and that the auth
 * middleware/guard has attached a `user` object containing at minimum:
 *   - `id`   — unique subject identifier (tenantId or userId)
 *   - `tier` — the subject's billing tier (e.g. 'free', 'pro', 'enterprise')
 *
 * Throws a ForbiddenException if the required fields are missing.
 */
function extractContext(request: Record<string, any>): EvaluationContext {
  const user = request['user'];

  if (!user?.id || !user?.tier) {
    throw new ForbiddenException(
      'Request is missing required user context (id and tier). ' +
        'Ensure an authentication guard runs before feature guards.',
    );
  }

  return {
    id: user.id as string,
    tier: user.tier as string,
    attributes: user.attributes,
  };
}

// ---------------------------------------------------------------------------
// TierGuard
// ---------------------------------------------------------------------------

/**
 * Guard that enforces tier-based access control on a route or controller.
 *
 * Reads the `REQUIRED_TIERS` metadata set by the `@RequireTier()` decorator
 * and compares it against the authenticated user's tier from `request.user`.
 *
 * - If no metadata is present (decorator not applied), the guard passes through.
 * - If the user's tier is not in the allowed list, a `ForbiddenException` is thrown.
 *
 * @example
 * // Apply globally in a module, or per-controller / per-route:
 * @UseGuards(TierGuard)
 * @RequireTier(['pro', 'enterprise'])
 * @Get('reports')
 * getReports() { ... }
 */
@Injectable()
export class TierGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredTiers = this.reflector.get<string[] | undefined>(
      REQUIRED_TIERS,
      ctx.getHandler(),
    );

    // No decorator applied — allow the request through.
    if (!requiredTiers || requiredTiers.length === 0) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest<Record<string, any>>();
    const context = extractContext(request);

    if (!requiredTiers.includes(context.tier)) {
      throw new ForbiddenException(
        `Access denied. This endpoint requires one of the following tiers: [${requiredTiers.join(', ')}]. ` +
          `Your current tier is "${context.tier}".`,
      );
    }

    return true;
  }
}

// ---------------------------------------------------------------------------
// FeatureFlagGuard
// ---------------------------------------------------------------------------

/**
 * Guard that enforces feature-flag-based access control on a route or controller.
 *
 * Reads the `REQUIRED_FEATURE` metadata set by the `@RequireFeature()` decorator,
 * extracts the user context from `request.user`, and delegates evaluation to
 * `FeatureFlagService.evaluate()`, which calls the pure `evaluateFlag` engine.
 *
 * - If no metadata is present (decorator not applied), the guard passes through.
 * - If the evaluated flag is `false` for the user's context, a `ForbiddenException` is thrown.
 *
 * @example
 * // Apply globally in a module, or per-controller / per-route:
 * @UseGuards(FeatureFlagGuard)
 * @RequireFeature('new-checkout')
 * @Post('checkout')
 * startCheckout() { ... }
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.get<string | undefined>(
      REQUIRED_FEATURE,
      ctx.getHandler(),
    );

    // No decorator applied — allow the request through.
    if (!requiredFeature) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest<Record<string, any>>();
    const context = extractContext(request);

    const isEnabled = await this.featureFlagService.evaluate(context, requiredFeature);

    if (!isEnabled) {
      throw new ForbiddenException(
        `Access denied. The feature "${requiredFeature}" is not enabled for ` +
          `subject "${context.id}" (tier: "${context.tier}").`,
      );
    }

    return true;
  }
}
