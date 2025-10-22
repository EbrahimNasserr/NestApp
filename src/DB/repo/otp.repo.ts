import { Injectable } from '@nestjs/common';
import { DBRepo } from './db.repo';
import { Otp, OtpDocument } from '../models/otp.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class OtpRepo extends DBRepo<OtpDocument> {
  constructor(
    @InjectModel(Otp.name)
    protected override readonly model: Model<OtpDocument>,
  ) {
    super(model);
  }
}
