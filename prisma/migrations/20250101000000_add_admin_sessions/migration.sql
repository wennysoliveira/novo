-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_sessionId_key" ON "admin_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "admin_sessions_sessionId_idx" ON "admin_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "admin_sessions_lastActive_idx" ON "admin_sessions"("lastActive");

