import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { ConfigSchema } from "../../../common/config/config.module";
import { TenantEntity } from "../entities";

const STATE_TTL_SECONDS = 10 * 60;

export type OAuthTenantStatePayload = {
  tenantId: string;
  tenantSlug: string;
  returnTo: string;
  nonce: string;
  iat: number;
  exp: number;
};

export type ValidatedOAuthTenantState = {
  payload: OAuthTenantStatePayload;
  tenant: TenantEntity;
};

@Injectable()
export class OAuthStateService {
  public constructor(
    private readonly config: ConfigService<ConfigSchema>,
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
  ) {}

  public createTenantState(input: {
    tenantId: string;
    tenantSlug: string;
    returnTo?: string;
  }): string {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const payload: OAuthTenantStatePayload = {
      tenantId: input.tenantId,
      tenantSlug: input.tenantSlug,
      returnTo: validateInternalReturnTo(input.returnTo),
      nonce: randomBytes(16).toString("base64url"),
      iat: nowSeconds,
      exp: nowSeconds + STATE_TTL_SECONDS,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

    return `${encodedPayload}.${this.sign(encodedPayload)}`;
  }

  public async validateTenantState(
    rawState: string | undefined,
  ): Promise<ValidatedOAuthTenantState> {
    const payload = this.decodeAndVerify(rawState);

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new BadRequestException("OAuth state has expired.");
    }

    validateInternalReturnTo(payload.returnTo);

    const tenant = await this.tenants.findOne({ where: { id: payload.tenantId } });
    if (!tenant || !tenant.active || tenant.slug !== payload.tenantSlug) {
      throw new BadRequestException("OAuth state tenant is invalid.");
    }

    return { payload, tenant };
  }

  public validateInternalReturnTo(returnTo: string | undefined): string {
    return validateInternalReturnTo(returnTo);
  }

  private decodeAndVerify(rawState: string | undefined): OAuthTenantStatePayload {
    if (!rawState) {
      throw new BadRequestException("OAuth state is required.");
    }

    const [encodedPayload, signature, extra] = rawState.split(".");
    if (!encodedPayload || !signature || extra !== undefined) {
      throw new BadRequestException("OAuth state is malformed.");
    }

    if (!this.isValidSignature(encodedPayload, signature)) {
      throw new BadRequestException("OAuth state signature is invalid.");
    }

    try {
      return assertStatePayload(JSON.parse(Buffer.from(encodedPayload, "base64url").toString()));
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("OAuth state payload is invalid.");
    }
  }

  private sign(encodedPayload: string): string {
    return createHmac("sha256", this.config.getOrThrow<string>("SESSION_SECRET"))
      .update(encodedPayload)
      .digest("base64url");
  }

  private isValidSignature(encodedPayload: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(encodedPayload));
    const actual = Buffer.from(signature);

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}

export function validateInternalReturnTo(returnTo: string | undefined): string {
  if (!returnTo) return "/club";
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
    throw new BadRequestException("OAuth return path must be internal.");
  }

  return returnTo;
}

function assertStatePayload(value: unknown): OAuthTenantStatePayload {
  if (!isRecord(value)) throw new BadRequestException("OAuth state payload is invalid.");

  const payload = value as Partial<OAuthTenantStatePayload>;
  if (
    typeof payload.tenantId !== "string" ||
    typeof payload.tenantSlug !== "string" ||
    typeof payload.returnTo !== "string" ||
    typeof payload.nonce !== "string" ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number"
  ) {
    throw new BadRequestException("OAuth state payload is invalid.");
  }

  return payload as OAuthTenantStatePayload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
