import { describe, expect, it, vi } from "vitest";
import { AthleteReadController } from "./athlete/athlete-read.controller";
import { CompetitionReadController } from "./competition/competition-read.controller";
import { CoreDashboardReadController } from "./core-dashboard-read.controller";
import { RatingReadController } from "./rating/rating-read.controller";
import { TableReadController } from "./table/table-read.controller";

const tenantContext = { id: "club-1", slug: "central-pong" };
const principal = {
  userId: "user-1",
  tenantId: "club-1",
  sessionId: "session-1",
  systemRoles: [],
  tenantRoles: ["member"],
};

function contextStub() {
  return {
    getTenantOrThrow: vi.fn(() => tenantContext),
    getPrincipalOrThrow: vi.fn(() => principal),
  };
}

describe("controllers de leitura core", () => {
  it("lista mesas usando tenant atual e paginacao recebida", async () => {
    const query = { listTables: vi.fn().mockResolvedValue({ items: [], page: {} }) };
    const controller = new TableReadController(contextStub() as never, query as never);

    await controller.list({ page: 2, pageSize: 10 });

    expect(query.listTables).toHaveBeenCalledWith("club-1", { page: 2, pageSize: 10 });
  });

  it("consulta detalhe de mesa usando tenant atual", async () => {
    const query = { getTableDetail: vi.fn().mockResolvedValue({ id: "table-1" }) };
    const controller = new TableReadController(contextStub() as never, query as never);

    await expect(controller.detail("table-1")).resolves.toEqual({ id: "table-1" });

    expect(query.getTableDetail).toHaveBeenCalledWith("club-1", "table-1");
  });

  it("consulta atleta atual usando tenant e principal atuais", async () => {
    const query = { getCurrentAthlete: vi.fn().mockResolvedValue({ id: "athlete-1" }) };
    const controller = new AthleteReadController(contextStub() as never, query as never);

    await expect(controller.me()).resolves.toEqual({ id: "athlete-1" });

    expect(query.getCurrentAthlete).toHaveBeenCalledWith("club-1", "user-1");
  });

  it("lista atletas usando tenant atual", async () => {
    const query = { listAthletes: vi.fn().mockResolvedValue({ items: [], page: {} }) };
    const controller = new AthleteReadController(contextStub() as never, query as never);

    await controller.list({ page: 1, pageSize: 50 });

    expect(query.listAthletes).toHaveBeenCalledWith("club-1", { page: 1, pageSize: 50 });
  });

  it("lista ranking usando tenant atual", async () => {
    const query = { listRatings: vi.fn().mockResolvedValue({ items: [], page: {} }) };
    const controller = new RatingReadController(contextStub() as never, query as never);

    await controller.list({ page: 1, pageSize: 20 });

    expect(query.listRatings).toHaveBeenCalledWith("club-1", { page: 1, pageSize: 20 });
  });

  it("lista historico e detalhe de jogos usando tenant atual", async () => {
    const query = {
      getGame: vi.fn().mockResolvedValue({ id: "game-1" }),
      listGames: vi.fn().mockResolvedValue({ items: [], page: {} }),
    };
    const controller = new CompetitionReadController(contextStub() as never, query as never);

    await controller.list({ page: 3, pageSize: 5 });
    await expect(controller.detail("game-1")).resolves.toEqual({ id: "game-1" });

    expect(query.listGames).toHaveBeenCalledWith("club-1", { page: 3, pageSize: 5 });
    expect(query.getGame).toHaveBeenCalledWith("club-1", "game-1");
  });

  it("monta dashboard usando tenant atual", async () => {
    const dashboard = { getDashboard: vi.fn().mockResolvedValue({ tables: [] }) };
    const controller = new CoreDashboardReadController(contextStub() as never, dashboard as never);

    await expect(controller.getDashboard()).resolves.toEqual({ tables: [] });

    expect(dashboard.getDashboard).toHaveBeenCalledWith("club-1");
  });
});
