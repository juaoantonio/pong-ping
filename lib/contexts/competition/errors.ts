import type { CompetitionError } from "./use-cases";

export function mapCompetitionErrorToHttp(error: CompetitionError): {
  body: { error: string };
  status: number;
} {
  switch (error.code) {
    case "table_not_found":
      return { body: { error: "Mesa nao encontrada." }, status: 404 };
    case "finish_match_forbidden":
      return {
        body: {
          error:
            "Apenas jogadores da rodada atual ou admins podem encerrar a rodada.",
        },
        status: 403,
      };
    case "not_enough_players":
      return {
        body: { error: "A fila precisa de pelo menos dois jogadores." },
        status: 400,
      };
    case "winner_not_in_current_match":
      return {
        body: { error: "O vencedor precisa estar na mesa atual." },
        status: 400,
      };
    case "match_not_found":
      return { body: { error: "Rodada nao encontrada." }, status: 404 };
    case "cannot_rollback_rollback":
      return {
        body: { error: "Um rollback nao pode ser revertido." },
        status: 400,
      };
    case "match_already_rolled_back":
      return {
        body: { error: "Esta rodada ja foi revertida." },
        status: 409,
      };
    case "ranking_not_found":
      return {
        body: { error: "Ranking da rodada nao encontrado." },
        status: 409,
      };
  }
}
