import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { IncomingMessage } from 'http';
import { WebSocket, Server } from 'ws';
import { MessagingService } from './messaging.service';

type SocketPayload = {
  recipientId?: string;
  recipientEmail?: string;
  content: string;
};

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagingGateway {
  @WebSocketServer()
  server: Server;

  private readonly clients = new Map<string, WebSocket>();
  private readonly clientUserIds = new Map<WebSocket, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagingService: MessagingService,
  ) {}

  async handleConnection(client: WebSocket, request: IncomingMessage) {
    const token = this.extractToken(request);
    const userId = await this.getUserIdFromToken(token);

    if (!userId) {
      client.close(1008, 'Unauthorized');
      return;
    }

    this.clients.set(userId, client);
    this.clientUserIds.set(client, userId);
  }

  handleDisconnect(client: WebSocket) {
    const userId = this.clientUserIds.get(client);
    if (userId) {
      this.clients.delete(userId);
      this.clientUserIds.delete(client);
    }
  }

  @SubscribeMessage('message')
  async onMessage(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() payload: SocketPayload,
  ): Promise<WsResponse> {
    const senderId = this.clientUserIds.get(client);
    if (!senderId) {
      return {
        event: 'error',
        data: { message: 'Unauthorized' },
      };
    }

    let data: SocketPayload | null = payload;
    if (typeof payload === 'string') {
      try {
        data = JSON.parse(payload) as SocketPayload;
      } catch {
        data = null;
      }
    }

    if ((!data?.recipientId && !data?.recipientEmail) || !data?.content) {
      return {
        event: 'error',
        data: { message: 'recipientId or recipientEmail and content are required' },
      };
    }

    try {
      const result = data.recipientEmail
        ? await this.messagingService.sendMessageToEmail(
            senderId,
            data.recipientEmail,
            data.content,
          )
        : await this.messagingService.sendMessageToUser(
            senderId,
            data.recipientId as string,
            data.content,
          );

      const receiverId =
        data.recipientId ?? (result.message?.receiverId as string | undefined);
      const receiverClient = receiverId ? this.clients.get(receiverId) : undefined;
      if (receiverClient) {
        receiverClient.send(
          JSON.stringify({ event: 'message', data: result }),
        );
      }

      return {
        event: 'message',
        data: result,
      };
    } catch (error: any) {
      return {
        event: 'error',
        data: { message: error?.message ?? 'Failed to send message' },
      };
    }
  }

  private extractToken(request: IncomingMessage): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader) {
      return authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;
    }

    const url = request.url ?? '';
    const parsedUrl = new URL(url, 'http://localhost');
    return parsedUrl.searchParams.get('token');
  }

  private async getUserIdFromToken(token: string | null): Promise<string | null> {
    if (!token) {
      return null;
    }

    const decoded: unknown = this.jwtService.decode(token);
    if (!decoded || typeof decoded !== 'object') {
      return null;
    }

    const decodedRecord = decoded as Record<string, unknown>;
    const userId =
      typeof decodedRecord.id === 'string' ? decodedRecord.id : null;
    if (!userId) {
      return null;
    }

    const isValid = await this.messagingService.isUserValid(userId);
    return isValid ? userId : null;
  }
}
