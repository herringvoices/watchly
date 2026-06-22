import prisma from '../lib/prisma';

export const LikeService = {
  async likeUpdate(updateId: number, userId: string) {
    await prisma.updateLike.upsert({
      where: { updateId_userId: { updateId, userId } },
      create: { updateId, userId },
      update: {},
    });
    const likeCount = await prisma.updateLike.count({ where: { updateId } });
    return { liked: true, likeCount };
  },

  async unlikeUpdate(updateId: number, userId: string) {
    await prisma.updateLike.deleteMany({ where: { updateId, userId } });
    const likeCount = await prisma.updateLike.count({ where: { updateId } });
    return { liked: false, likeCount };
  },

  async likeComment(commentId: number, userId: string) {
    await prisma.commentLike.upsert({
      where: { commentId_userId: { commentId, userId } },
      create: { commentId, userId },
      update: {},
    });
    const likeCount = await prisma.commentLike.count({ where: { commentId } });
    return { liked: true, likeCount };
  },

  async unlikeComment(commentId: number, userId: string) {
    await prisma.commentLike.deleteMany({ where: { commentId, userId } });
    const likeCount = await prisma.commentLike.count({ where: { commentId } });
    return { liked: false, likeCount };
  },
};
