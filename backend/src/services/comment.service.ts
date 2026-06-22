import prisma from '../lib/prisma';

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  profilePicture: true,
};

function formatComment(raw: any, userId?: string) {
  const { _count, likes, ...rest } = raw;
  return {
    ...rest,
    likeCount: _count?.likes ?? 0,
    isLikedByMe: userId ? (likes?.length ?? 0) > 0 : false,
  };
}

export const CommentService = {
  async getComments(updateId: number, limit = 20, offset = 0, userId?: string) {
    const [rawComments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { updateId },
        include: {
          user: { select: userSelect },
          _count: { select: { likes: true } },
          ...(userId ? { likes: { where: { userId }, select: { userId: true } } } : {}),
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.comment.count({ where: { updateId } }),
    ]);
    const comments = rawComments.map((c) => formatComment(c, userId));
    return { comments, total, hasMore: offset + comments.length < total };
  },

  async addComment(updateId: number, userId: string, text: string) {
    const update = await prisma.mediaUpdate.findUnique({ where: { id: updateId } });
    if (!update) {
      const err: any = new Error('Update not found');
      err.status = 404;
      throw err;
    }

    const raw = await prisma.comment.create({
      data: { updateId, userId, text },
      include: {
        user: { select: userSelect },
        _count: { select: { likes: true } },
      },
    });
    return formatComment(raw, userId);
  },

  async deleteComment(commentId: number, userId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      const err: any = new Error('Comment not found');
      err.status = 404;
      throw err;
    }
    if (comment.userId !== userId) {
      const err: any = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    await prisma.comment.delete({ where: { id: commentId } });
  },
};
