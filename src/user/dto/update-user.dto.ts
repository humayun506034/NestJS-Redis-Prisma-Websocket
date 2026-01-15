export class UpdateUserDto {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  image?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  phoneNumber?: string;
  vatUid?: string;
  companyRegistrationNumber?: string;
  password?: string;
  subject?: string;
  registrationOtp?: string;
  registrationOtpExpireIn?: Date;
  loginOtp?: string;
  loginOtpExpireIn?: Date;
  isVerified?: boolean;
  isBlocked?: boolean;
  isDeleted?: boolean;
}
