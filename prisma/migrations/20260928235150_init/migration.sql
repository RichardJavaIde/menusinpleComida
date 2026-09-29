-- CreateTable
CREATE TABLE "AdminUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Dish" (
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
    CONSTRAINT "Dish_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "restaurantName" TEXT NOT NULL DEFAULT 'Mi Restaurante',
    "slogan" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "currencySymbol" TEXT NOT NULL DEFAULT 'RD$',
    "showSchedules" BOOLEAN NOT NULL DEFAULT true,
    "colorPrimary" TEXT NOT NULL DEFAULT '#B45309',
    "colorSecondary" TEXT NOT NULL DEFAULT '#1F2937',
    "colorBackground" TEXT NOT NULL DEFAULT '#FFFBF5',
    "colorText" TEXT NOT NULL DEFAULT '#1F2937',
    "colorPrice" TEXT NOT NULL DEFAULT '#15803D',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_DishToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_DishToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Dish" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DishToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- CreateIndex
CREATE INDEX "Dish_categoryId_sortOrder_idx" ON "Dish"("categoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "Dish_isVisible_idx" ON "Dish"("isVisible");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_DishToTag_AB_unique" ON "_DishToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_DishToTag_B_index" ON "_DishToTag"("B");
