import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTableRequestContract,
  RenameTableRequestContract,
  UpdateAthleteProfileRequestContract,
  WinningAthletesRequestContract,
} from "@pong-ping/contracts";
import {
  correctCoreGame,
  createCoreTable,
  enqueueCoreTable,
  formCoreActiveGame,
  recordCoreGame,
  removeCoreActiveAthlete,
  removeCoreQueuedAthlete,
  renameCoreTable,
  rotateCoreWinnerStays,
  updateCoreAthleteProfile,
} from "@/lib/api/core";
import { coreQueryKeys } from "@/features/club/api/query-keys";

function useInvalidateCore() {
  const queryClient = useQueryClient();

  return {
    athletes: () => queryClient.invalidateQueries({ queryKey: coreQueryKeys.athletes.all() }),
    dashboard: () => queryClient.invalidateQueries({ queryKey: coreQueryKeys.dashboard() }),
    games: () => queryClient.invalidateQueries({ queryKey: coreQueryKeys.games.all() }),
    ratings: () => queryClient.invalidateQueries({ queryKey: coreQueryKeys.ratings.all() }),
    tables: () => queryClient.invalidateQueries({ queryKey: coreQueryKeys.tables.all() }),
  };
}

export function useCreateCoreTableMutation() {
  const invalidate = useInvalidateCore();

  return useMutation({
    mutationFn: (input: CreateTableRequestContract) => createCoreTable(input),
    onSuccess: async () => {
      await Promise.all([invalidate.tables(), invalidate.dashboard()]);
    },
  });
}

export function useRenameCoreTableMutation() {
  const invalidate = useInvalidateCore();

  return useMutation({
    mutationFn: ({ tableId, input }: { tableId: string; input: RenameTableRequestContract }) =>
      renameCoreTable(tableId, input),
    onSuccess: async () => {
      await Promise.all([invalidate.tables(), invalidate.dashboard()]);
    },
  });
}

export function useEnqueueCoreTableMutation() {
  const invalidate = useInvalidateCore();

  return useMutation({
    mutationFn: ({ tableId }: { tableId: string }) => enqueueCoreTable(tableId),
    onSuccess: async () => {
      await Promise.all([invalidate.tables(), invalidate.dashboard()]);
    },
  });
}

export function useRemoveCoreQueuedAthleteMutation() {
  const invalidate = useInvalidateCore();

  return useMutation({
    mutationFn: ({ tableId, athleteId }: { tableId: string; athleteId: string }) =>
      removeCoreQueuedAthlete(tableId, athleteId),
    onSuccess: async () => {
      await Promise.all([invalidate.tables(), invalidate.dashboard()]);
    },
  });
}

export function useRemoveCoreActiveAthleteMutation() {
  const invalidate = useInvalidateCore();

  return useMutation({
    mutationFn: ({ tableId, athleteId }: { tableId: string; athleteId: string }) =>
      removeCoreActiveAthlete(tableId, athleteId),
    onSuccess: async () => {
      await Promise.all([invalidate.tables(), invalidate.dashboard()]);
    },
  });
}

export function useFormCoreActiveGameMutation() {
  const invalidate = useInvalidateCore();

  return useMutation({
    mutationFn: ({ tableId }: { tableId: string }) => formCoreActiveGame(tableId),
    onSuccess: async () => {
      await Promise.all([invalidate.tables(), invalidate.dashboard()]);
    },
  });
}

export function useRotateCoreWinnerStaysMutation() {
  const invalidate = useInvalidateCore();

  return useMutation({
    mutationFn: ({
      tableId,
      input,
    }: {
      tableId: string;
      input: WinningAthletesRequestContract;
    }) => rotateCoreWinnerStays(tableId, input),
    onSuccess: async () => {
      await Promise.all([invalidate.tables(), invalidate.dashboard()]);
    },
  });
}

export function useRecordCoreGameMutation() {
  const invalidate = useInvalidateCore();

  return useMutation({
    mutationFn: ({
      tableId,
      input,
    }: {
      tableId: string;
      input: WinningAthletesRequestContract;
    }) => recordCoreGame(tableId, input),
    onSuccess: async () => {
      await Promise.all([
        invalidate.tables(),
        invalidate.games(),
        invalidate.ratings(),
        invalidate.dashboard(),
      ]);
    },
  });
}

export function useCorrectCoreGameMutation() {
  const invalidate = useInvalidateCore();

  return useMutation({
    mutationFn: ({ gameRecordId }: { gameRecordId: string }) => correctCoreGame(gameRecordId),
    onSuccess: async () => {
      await Promise.all([invalidate.games(), invalidate.ratings(), invalidate.dashboard()]);
    },
  });
}

export function useUpdateCoreAthleteProfileMutation() {
  const invalidate = useInvalidateCore();

  return useMutation({
    mutationFn: ({
      athleteId,
      input,
    }: {
      athleteId: string;
      input: UpdateAthleteProfileRequestContract;
    }) => updateCoreAthleteProfile(athleteId, input),
    onSuccess: async () => {
      await Promise.all([invalidate.athletes(), invalidate.tables(), invalidate.dashboard()]);
    },
  });
}
