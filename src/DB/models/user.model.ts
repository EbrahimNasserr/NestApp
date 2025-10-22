import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
  Virtual,
} from '@nestjs/mongoose';
import { GenderEnum, generateHash, ProviderEnum } from 'src/common';
import { HydratedDocument } from 'mongoose';
import { Otp, OtpDocument } from './otp.model';

@Schema({
  timestamps: true,
  strictQuery: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
})
export class User {
  @Prop({ required: true, minlength: 3, maxlength: 20 })
  firstName: string;

  @Prop({ required: true, minlength: 3, maxlength: 20 })
  lastName: string;

  @Virtual({
    get: function (this: User) {
      return `${this.firstName} ${this.lastName}`;
    },
    set: function (this: User, value: string) {
      const [firstName, lastName] = value.split(' ') || [];
      this.firstName = firstName;
      this.lastName = lastName;
    },
  })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false, type: Date })
  confirmEmail: Date;

  @Prop({
    required: false,
    type: String,
  })
  confirmEmailOtp: string;

  @Prop({
    required: function (this: User) {
      return this.provider === ProviderEnum.SYSTEM ? true : false;
    },
  })
  password: string;

  @Prop({ type: String, required: false })
  resetPasswordToken: string;

  @Prop({ type: Date, required: false })
  resetPasswordExpires: Date;

  @Prop({ type: String, enum: ProviderEnum, default: ProviderEnum.SYSTEM })
  provider: ProviderEnum;

  @Prop({ type: String, enum: GenderEnum, default: GenderEnum.MALE })
  gender: GenderEnum;

  @Prop({ type: Date, required: false })
  changeCredentialsTime: Date;

  @Prop({ type: String, required: false })
  profilePicture: string;

  @Virtual()
  otp: OtpDocument[];
}

const UserSchema = SchemaFactory.createForClass(User);
UserSchema.virtual('otp', {
  ref: Otp.name,
  localField: '_id',
  foreignField: 'createdBy',
});
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await generateHash(this.password);
  next();
});
export type UserDocument = HydratedDocument<User>;
export const UserModel = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
]);
