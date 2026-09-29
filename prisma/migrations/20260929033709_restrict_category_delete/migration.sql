-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dish" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "showSchedule" BOOLEAN NOT NULL DEFAULT false,
    "scheduleFrom" TEXT,
    "scheduleTo" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dish_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Dish" ("categoryId", "createdAt", "description", "id", "isAvailable", "isVisible", "name", "priceCents", "scheduleFrom", "scheduleTo", "showSchedule", "sortOrder", "updatedAt") SELECT "categoryId", "createdAt", "description", "id", "isAvailable", "isVisible", "name", "priceCents", "scheduleFrom", "scheduleTo", "showSchedule", "sortOrder", "updatedAt" FROM "Dish";
DROP TABLE "Dish";
ALTER TABLE "new_Dish" RENAME TO "Dish";
CREATE INDEX "Dish_categoryId_sortOrder_idx" ON "Dish"("categoryId", "sortOrder");
CREATE INDEX "Dish_isVisible_idx" ON "Dish"("isVisible");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
