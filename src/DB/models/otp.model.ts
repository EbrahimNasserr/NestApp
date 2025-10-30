import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { generateHash, OtpTypeEnum } from 'src/common';
import { emailEvent } from 'src/common/email/email.event';
import { IOtp } from 'src/common';

@Schema({
  timestamps: true,
})
export class Otp implements IOtp {
  @Prop({ required: true })
  code: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: String, enum: OtpTypeEnum, required: true })
  type: OtpTypeEnum;
}

export type OtpDocument = HydratedDocument<Otp>;

const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

OtpSchema.pre(
  'save',
  async function (
    this: OtpDocument & { wasNew: boolean; plainOtp?: string },
    next,
  ) {
    this.wasNew = this.isNew;
    if (this.isModified('code')) {
      this.plainOtp = this.code;
      this.code = await generateHash(this.code);
      await this.populate({
        path: 'createdBy',
        select: 'email firstName lastName',
      });
    }
    next();
  },
);

OtpSchema.post('save', function (doc, next) {
  const that = doc as OtpDocument & { wasNew: boolean; plainOtp?: string };
  if (that.wasNew && that.plainOtp) {
    const user = that.createdBy as unknown as {
      email: string;
      firstName?: string;
      lastName?: string;
    };
    const fullName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email.split('@')[0]; // fallback to email username if names not available
    emailEvent.emit(doc.type, user.email, that.plainOtp, fullName);
  }
  next();
});

export const OtpModel = MongooseModule.forFeature([
  { name: Otp.name, schema: OtpSchema },
]);
