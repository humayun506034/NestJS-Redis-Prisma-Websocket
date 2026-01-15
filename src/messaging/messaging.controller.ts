import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/common/decorator/rolesDecorator';
import { AuthGuard } from 'src/common/guards/auth/auth.guard';
import { sendResponse } from 'src/utils/sendResponse';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { MessagingService } from './messaging.service';

@Controller('messages')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @UseGuards(AuthGuard)
  @Roles()
  @Get('conversations')
  listConversations(@Req() req: Request & { user: { id: string } }) {
    return this.messagingService.listConversations(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Roles()
  @Post('conversations/:userId')
  getOrCreateConversation(
    @Req() req: Request & { user: { id: string } },
    @Param('userId') userId: string,
  ) {
    return this.messagingService.getOrCreateConversation(req.user.id, userId);
  }

  @UseGuards(AuthGuard)
  @Roles()
  @Post('conversations/email/:email')
  getOrCreateConversationByEmail(
    @Req() req: Request & { user: { id: string } },
    @Param('email') email: string,
  ) {
    return this.messagingService.getOrCreateConversationByEmail(
      req.user.id,
      email,
    );
  }

  @UseGuards(AuthGuard)
  @Roles()
  @Get('conversations/:conversationId/messages')
  getMessages(
    @Req() req: Request & { user: { id: string } },
    @Param('conversationId') conversationId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.messagingService.getMessages(
      req.user.id,
      conversationId,
      query.limit,
      query.cursor,
    );
  }

  @UseGuards(AuthGuard)
  @Roles()
  @Get('users/email/:email/messages')
  getMessagesWithUserEmail(
    @Req() req: Request & { user: { id: string } },
    @Param('email') email: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.messagingService.getMessagesWithUserEmail(
      req.user.id,
      email,
      query.limit,
      query.cursor,
    );
  }

  @UseGuards(AuthGuard)
  @Roles()
  @Post('conversations/:conversationId/messages')
  async sendMessageInConversation(
    @Req() req: Request & { user: { id: string } },
    @Param('conversationId') conversationId: string,
    @Body() dto: CreateMessageDto,
  ) {
    const result = await this.messagingService.sendMessageInConversation(
      req.user.id,
      conversationId,
      dto.content,
    );

    return sendResponse('Message sent successfully', result);
  }

  @UseGuards(AuthGuard)
  @Roles()
  @Post('users/:userId')
  async sendMessageToUser(
    @Req() req: Request & { user: { id: string } },
    @Param('userId') userId: string,
    @Body() dto: CreateMessageDto,
  ) {
    const result = await this.messagingService.sendMessageToUser(
      req.user.id,
      userId,
      dto.content,
    );

    return sendResponse('Message sent successfully', result);
  }

  @UseGuards(AuthGuard)
  @Roles()
  @Post('users/email/:email')
  async sendMessageToEmail(
    @Req() req: Request & { user: { id: string } },
    @Param('email') email: string,
    @Body() dto: CreateMessageDto,
  ) {
    const result = await this.messagingService.sendMessageToEmail(
      req.user.id,
      email,
      dto.content,
    );

    return sendResponse('Message sent successfully', result);
  }
}
