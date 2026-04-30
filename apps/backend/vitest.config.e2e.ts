import base from "./vitest.config";

export default {
  ...base,
  test: {
    ...base.test,
    include: ["test/**/*.e2e-spec.ts"],
  },
};
