-- CreateTable
CREATE TABLE "Query" (
    "id" SERIAL NOT NULL,
    "sqlText" TEXT NOT NULL,
    "executionTimeMs" INTEGER,
    "rowCount" INTEGER,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "planJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Query_pkey" PRIMARY KEY ("id")
);
