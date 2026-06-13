-- CreateEnum
CREATE TYPE "BinderLayout" AS ENUM ('FOUR_POCKET', 'NINE_POCKET', 'TWELVE_POCKET');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Binder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverColor" TEXT NOT NULL DEFAULT '#1a1a2e',
    "pocketLayout" "BinderLayout" NOT NULL DEFAULT 'NINE_POCKET',
    "pageCount" INTEGER NOT NULL DEFAULT 10,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Binder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinderPage" (
    "id" TEXT NOT NULL,
    "binderId" TEXT NOT NULL,
    "pageIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BinderPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardSlot" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "cardId" TEXT,
    "cardName" TEXT,
    "cardImageSmall" TEXT,
    "cardSet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Binder_userId_idx" ON "Binder"("userId");

-- CreateIndex
CREATE INDEX "BinderPage_binderId_idx" ON "BinderPage"("binderId");

-- CreateIndex
CREATE UNIQUE INDEX "BinderPage_binderId_pageIndex_key" ON "BinderPage"("binderId", "pageIndex");

-- CreateIndex
CREATE INDEX "CardSlot_pageId_idx" ON "CardSlot"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "CardSlot_pageId_slotIndex_key" ON "CardSlot"("pageId", "slotIndex");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Binder" ADD CONSTRAINT "Binder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderPage" ADD CONSTRAINT "BinderPage_binderId_fkey" FOREIGN KEY ("binderId") REFERENCES "Binder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardSlot" ADD CONSTRAINT "CardSlot_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "BinderPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
