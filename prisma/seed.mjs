import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rankLevels = [
  { name: "Bronze", minElo: 0, iconImgKey: "ranks/elo_bronze.png" },
  { name: "Prata", minElo: 1200, iconImgKey: "ranks/elo_prata.png" },
  { name: "Ouro", minElo: 1400, iconImgKey: "ranks/elo_ouro.png" },
  { name: "Platina", minElo: 1600, iconImgKey: "ranks/elo_platina.png" },
  { name: "Diamante", minElo: 1800, iconImgKey: "ranks/elo_diamante.png" },
  { name: "Mestre", minElo: 2000, iconImgKey: "ranks/elo_mestre.png" },
];

async function main() {
  for (const rankLevel of rankLevels) {
    await prisma.rankLevel.upsert({
      where: { name: rankLevel.name },
      update: {
        minElo: rankLevel.minElo,
        iconImgKey: rankLevel.iconImgKey,
      },
      create: rankLevel,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
