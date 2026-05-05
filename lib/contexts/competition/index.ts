export {
  mapCompetitionErrorToHttp,
} from "@/lib/contexts/competition/errors";
export type {
  AdminRoundReadModel,
  AdminRoundsReadFilters,
} from "@/lib/contexts/competition/queries";
export { getAdminRoundsReadModel } from "@/lib/contexts/competition/queries";
export type {
  CompetitionError,
  CompetitionErrorCode,
  FinishedMatchDto,
  RollbackMatchDto,
} from "@/lib/contexts/competition/use-cases";
export { finishMatch, rollbackMatch } from "@/lib/contexts/competition/use-cases";
