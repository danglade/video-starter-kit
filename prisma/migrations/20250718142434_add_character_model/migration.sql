-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tempId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "aspectRatio" TEXT NOT NULL DEFAULT '16:9',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyFrame" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeyFrame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mediaType" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "endpointId" TEXT,
    "requestId" TEXT,
    "status" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "metadata" JSONB,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "loraUrl" TEXT,
    "thumbnailUrl" TEXT,
    "trainingStatus" TEXT NOT NULL DEFAULT 'pending',
    "trainingJobId" TEXT,
    "trainingImages" JSONB,
    "trainingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_tempId_key" ON "User"("tempId");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Track_projectId_idx" ON "Track"("projectId");

-- CreateIndex
CREATE INDEX "KeyFrame_trackId_idx" ON "KeyFrame"("trackId");

-- CreateIndex
CREATE INDEX "MediaItem_userId_idx" ON "MediaItem"("userId");

-- CreateIndex
CREATE INDEX "MediaItem_projectId_idx" ON "MediaItem"("projectId");

-- CreateIndex
CREATE INDEX "Character_userId_idx" ON "Character"("userId");

-- CreateIndex
CREATE INDEX "Character_projectId_idx" ON "Character"("projectId");

-- CreateIndex
CREATE INDEX "Character_trainingStatus_idx" ON "Character"("trainingStatus");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyFrame" ADD CONSTRAINT "KeyFrame_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
