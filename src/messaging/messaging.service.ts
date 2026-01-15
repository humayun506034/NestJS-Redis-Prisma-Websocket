import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { sendResponse } from 'src/utils/sendResponse';

type UserPair = { userOneId: string; userTwoId: string };

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeUserPair(userId: string, otherUserId: string): UserPair {
    return userId < otherUserId
      ? { userOneId: userId, userTwoId: otherUserId }
      : { userOneId: otherUserId, userTwoId: userId };
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async getUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async isUserValid(userId: string) {
    try {
      await this.ensureUserExists(userId);
      return true;
    } catch {
      return false;
    }
  }

  async getOrCreateConversation(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('Cannot start a conversation with yourself');
    }

    await this.ensureUserExists(userId);
    await this.ensureUserExists(otherUserId);

    const pair = this.normalizeUserPair(userId, otherUserId);

    const conversation = await this.prisma.conversation.upsert({
      where: {
        userOneId_userTwoId: pair,
      },
      update: {},
      create: pair,
      include: {
        userOne: {
          select: { id: true, firstName: true, lastName: true, email: true, image: true },
        },
        userTwo: {
          select: { id: true, firstName: true, lastName: true, email: true, image: true },
        },
      },
    });

    return sendResponse('Conversation ready', conversation);
  }

  async getOrCreateConversationByEmail(userId: string, otherUserEmail: string) {
    const otherUser = await this.getUserByEmail(otherUserEmail);
    return this.getOrCreateConversation(userId, otherUser.id);
  }

  async listConversations(userId: string) {
    await this.ensureUserExists(userId);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      include: {
        userOne: {
          select: { id: true, firstName: true, lastName: true, email: true, image: true },
        },
        userTwo: {
          select: { id: true, firstName: true, lastName: true, email: true, image: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            senderId: true,
            receiverId: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const data = conversations.map((conversation) => {
      const otherUser =
        conversation.userOneId === userId
          ? conversation.userTwo
          : conversation.userOne;
      const lastMessage = conversation.messages[0] ?? null;

      return {
        id: conversation.id,
        otherUser,
        lastMessage,
        updatedAt: conversation.updatedAt,
      };
    });

    return sendResponse('Conversations fetched successfully', data);
  }

  async getMessages(userId: string, conversationId: string, limit = 20, cursor?: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
    });

    if (!conversation) {
      throw new ForbiddenException('Access denied');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      // select: {
      //   id: true,
      //   senderId: true,
      //   receiverId: true,
      //   content: true,
      //   createdAt: true,
      //   // readAt: true,
      // },
      include:{
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, image: true },
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, email: true, image: true },
        },
      }
    });

    return sendResponse('Messages fetched successfully', messages);
  }

  async getMessagesWithUserEmail(
    userId: string,
    otherUserEmail: string,
    limit = 20,
    cursor?: string,
  ) {
    const otherUser = await this.getUserByEmail(otherUserEmail);
    const pair = this.normalizeUserPair(userId, otherUser.id);

    const conversation = await this.prisma.conversation.findUnique({
      where: {
        userOneId_userTwoId: pair,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.getMessages(userId, conversation.id, limit, cursor);
  }

  async sendMessageToUser(senderId: string, receiverId: string, content: string) {
    if (!content || !content.trim()) {
      throw new BadRequestException('Message content is required');
    }

    await this.ensureUserExists(senderId);
    await this.ensureUserExists(receiverId);

    const pair = this.normalizeUserPair(senderId, receiverId);

    const result = await this.prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.upsert({
        where: { userOneId_userTwoId: pair },
        update: { updatedAt: new Date() },
        create: pair,
      });

      const message = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId,
          receiverId,
          content,
        },
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          content: true,
          createdAt: true,
        },
      });

      return {
        conversationId: conversation.id,
        message,
      };
    });

    return result;
  }

  async sendMessageToEmail(senderId: string, receiverEmail: string, content: string) {
    const receiver = await this.getUserByEmail(receiverEmail);
    return this.sendMessageToUser(senderId, receiver.id, content);
  }

  async sendMessageInConversation(
    senderId: string,
    conversationId: string,
    content: string,
  ) {
    if (!content || !content.trim()) {
      throw new BadRequestException('Message content is required');
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ userOneId: senderId }, { userTwoId: senderId }],
      },
    });

    if (!conversation) {
      throw new ForbiddenException('Access denied');
    }

    const receiverId =
      conversation.userOneId === senderId
        ? conversation.userTwoId
        : conversation.userOneId;

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          receiverId,
          content,
        },
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          content: true,
          createdAt: true,
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return {
      conversationId,
      receiverId,
      message,
    };
  }
}
