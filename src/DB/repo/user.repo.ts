import { Injectable } from '@nestjs/common';
import { DBRepo } from './db.repo';
import { UserDocument as TDocument, User } from '../models/user.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UserRepo extends DBRepo<TDocument> {
  constructor(
    @InjectModel(User.name) protected override readonly model: Model<TDocument>,
  ) {
    super(model);
  }
}
