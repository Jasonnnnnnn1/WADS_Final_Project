import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function getSettingsByUserId(userId: string, db: DbClient = prisma) {
  return db.userSettings.findUnique({ where: { userId } });
}

export async function upsertSettingsByUserId(userId: string, payload: Partial<Record<string, unknown>>, db: DbClient = prisma) {
  return db.userSettings.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: { ...payload },
  });
}
