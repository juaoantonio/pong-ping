import { Controller, Get } from "@nestjs/common";
import { RankingsService } from "../services/rankings.service";

@Controller("rankings")
export class RankingsController {
  constructor(private readonly rankings: RankingsService) {}

  @Get()
  async list() {
    return { rankings: await this.rankings.list() };
  }
}
