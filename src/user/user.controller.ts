import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { Roles } from 'src/common/decorator/rolesDecorator';
import { AuthGuard } from 'src/common/guards/auth/auth.guard';
import { uploadFileToSupabase } from 'src/utils/common/uploadFileToSupabase';
import { CreateUserDto } from './dto/create-user.dto';
import { ROLE } from './entities/role.entity';
import { UserService } from './user.service';
import { UserRole } from '@prisma/client';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private configService: ConfigService,
  ) {}

  @UseGuards(AuthGuard)
  @Roles(ROLE.ADMIN)
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isBlocked') isBlocked?: boolean,
  ) {
    return this.userService.findAll(page, limit, isBlocked);
  }
  @UseGuards(AuthGuard)
  @Roles()
  @Get('/me')
  me(@Req() req: Request & { user: { id: string } }) {
    return this.userService.getMyProfileInfo(req.user.id);
  }

  @Post('/temp-login')
  async TempLogin(@Body('email') email: string) {
    return this.userService.tempLogin(email);
  }
  @UseGuards(AuthGuard)
  @Roles()
  @Get('/dashboard-statics')
  dashboardStatics(@Req() req: Request & { user: { id: string } }) {
    return this.userService.getStatics(req.user.id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async create(
    @Body() body: { data: string },
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const parsed = JSON.parse(body.data) as unknown;
    let userRegistrationData: Partial<CreateUserDto> & { image?: string } = {};

    if (parsed && typeof parsed === 'object') {
      userRegistrationData = parsed as Partial<CreateUserDto> & {
        image?: string;
      };
    }

    if (image) {
      console.log(image);
      const imageLink = await uploadFileToSupabase(
        image,
        this.configService, // <-- important
        'user-uploads', // optional folder
      );
      // console.log('🚀 ~ UserController ~ create ~ imageLink:', imageLink);
      userRegistrationData.image = imageLink;
    }

    return this.userService.create(userRegistrationData as CreateUserDto);
  }
  @UseGuards(AuthGuard)
  @Roles(ROLE.ADMIN)
  @Post('/create-user-without-otp')
  createUserWithoutOtp(@Body() createUserByAdmin: any) {
    return this.userService.createUserWithoutOtp(createUserByAdmin);
  }

  @Post('/resend-register-otp')
  resendRegistrationVerifyOtp(@Body('email') email: string) {
    return this.userService.resendRegistrationVerifyOtp(email);
  }

  @Post('/verify-register-otp')
  verifyRegisterOtp(@Body('email') email: string, @Body('otp') otp: string) {
    return this.userService.verifyRegisterOtp(email, otp);
  }

  @Post('/login')
  login(@Body('email') email: string, @Body('password') password: string) {
    return this.userService.login(email, password);
  }

  @Post('/resend-login-otp')
  resendLoginOtp(@Body('email') email: string) {
    return this.userService.resendLoginOtp(email);
  }

  @Post('/verify-login-otp')
  verifyLoginOtp(@Body('email') email: string, @Body('otp') otp: string) {
    return this.userService.verifyLoginOtp(email, otp);
  }

  @Post('/change-password')
  changePassword(
    @Body('email') email: string,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.userService.changePassword(email, oldPassword, newPassword);
  }

  @Post('/forgotten-password')
  forgottenPassword(@Body('email') email: string) {
    return this.userService.forgottenPassword(email);
  }

  @Post('/verify-forgotten-password-otp')
  verifyForgottenPasswordOtp(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.userService.verifyForgottenPasswordOtp(email, otp, newPassword);
  }
  @UseGuards(AuthGuard)
  @Roles(ROLE.CUSTOMER, ROLE.ADMIN)
  @Patch('update-profile')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async updateProfile(
    @Req() req: Request & { user: any },
    @Body() body?: any,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    let userUpdateData: any = {};

    // 🟢 BODY OPTIONAL
    if (body?.data) {
      try {
        const parsed = JSON.parse(body.data);
        userUpdateData = { ...parsed };
      } catch (err) {
        throw new BadRequestException('Invalid JSON format in data field');
      }
    }

    // 🟢 IMAGE OPTIONAL
    if (image) {
      const imageLink = await uploadFileToSupabase(
        image,
        this.configService,
        'user-uploads',
      );
      userUpdateData.image = imageLink;
    }

    // ❌ nothing provided
    if (Object.keys(userUpdateData).length === 0) {
      throw new BadRequestException('No update data provided');
    }

    return this.userService.updateProfile(req.user.id, userUpdateData);
  }

  @Patch('block-user/:id')
  @UseGuards(AuthGuard)
  @Roles(ROLE.ADMIN)
  blockUser(@Param('id') id: string) {
    return this.userService.blockUser(id);
  }

  @Patch('unblock-user/:id')
  @UseGuards(AuthGuard)
  @Roles(ROLE.ADMIN)
  unblockUser(@Param('id') id: string) {
    return this.userService.unblockUser(id);
  }

  @Patch('change-role/:id')
  @UseGuards(AuthGuard)
  @Roles(ROLE.ADMIN)
  changeRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.userService.changeRole(id, role);
  }

  @Delete('delete-user/:id')
  @UseGuards(AuthGuard)
  @Roles(ROLE.ADMIN)
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Delete('delete-myself-account')
  @UseGuards(AuthGuard)
  @Roles(ROLE.ADMIN, ROLE.CUSTOMER)
  deleteMyselfAccount(@Req() req: Request & { user: any }) {
    return this.userService.deleteMyselfAccount(req.user.id);
  }
}
