import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_GENRES = [
  "Oldies",
  "Hebrew",
  "Oriental",
  "Comedy",
  "Love",
  "War",
];

async function main() {
  for (const name of DEFAULT_GENRES) {
    await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Seed completed. Default genres created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
