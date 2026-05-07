import { describe, expect, it } from "vitest";
import { ActorId } from "../../shared/domain";
import { CoreIdentityTranslator } from "./core-identity-translator";

describe("CoreIdentityTranslator", () => {
  it("maps an identity principal into a core-owned actor id", () => {
    const translator = new CoreIdentityTranslator();

    expect(translator.toActorId({ userId: "user-1" })).toEqual(new ActorId("user-1"));
  });
});
