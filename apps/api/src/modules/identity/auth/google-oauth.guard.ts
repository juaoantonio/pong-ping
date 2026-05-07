import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CurrentContextService } from "../../../common/context";

@Injectable()
export class GoogleOAuthGuard extends AuthGuard("google") {
  public constructor(private readonly context: CurrentContextService) {
    super();
  }

  public override canActivate(context: ExecutionContext) {
    this.context.getTenantOrThrow();
    return super.canActivate(context);
  }
}
