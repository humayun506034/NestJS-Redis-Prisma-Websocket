export class CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  image?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  phoneNumber: string;
  vatUid?: string;
  companyRegistrationNumber?: string;
  password: string;
  subject?: string;
  registrationOtp?: string;
  registrationOtpExpireIn?: Date;
  loginOtp?: string;
  loginOtpExpireIn?: Date;
  isVerified?: boolean;
  isBlocked?: boolean;
  isDeleted?: boolean;
}

export class CreateUserByAdmin {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyName: string;
  phoneNumber: string;
  password: string;
}
