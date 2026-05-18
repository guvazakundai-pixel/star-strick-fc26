import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const useTurso = process.env.TURSO_DATABASE_URL && process.env.USE_TURSO === "true";

  if (useTurso) {
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSql(libsql);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function mockResult(method: string) {
  if (method === "findUnique" || method === "findFirst")
    return Promise.resolve(null);
  if (method === "findMany" || method === "groupBy")
    return Promise.resolve([]);
  if (method === "count" || method === "aggregate")
    return Promise.resolve(0);
  if (method === "updateMany" || method === "deleteMany")
    return Promise.resolve({ count: 0 });
  return Promise.resolve(null);
}

function wrapModel(model: unknown, modelName: string) {
  if (model === null || model === undefined || typeof model !== "object") {
    return model;
  }
  return new Proxy(model as Record<string, unknown>, {
    get(target, method: string) {
      const fn = target[method];
      if (typeof fn !== "function") return fn;
      return (...args: unknown[]) => {
        try {
          const result = fn.apply(target, args);
          if (result && typeof result.then === "function") {
            return result.catch((err: Error) => {
              console.error(`[Prisma:${modelName}.${method}]`, err?.message ?? err);
              return mockResult(method);
            });
          }
          return result;
        } catch (err) {
          console.error(`[Prisma:${modelName}.${method}]`, err);
          return mockResult(method);
        }
      };
    },
  });
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
      return wrapModel(value, String(prop));
    }
    return value;
  },
});