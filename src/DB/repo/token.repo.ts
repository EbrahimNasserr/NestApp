import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { DBRepo } from "./db.repo";
import { Token, TokenDocument } from "../models/token.model";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class TokenRepo extends DBRepo<TokenDocument> {
  constructor(
    @InjectModel(Token.name) protected override readonly model: Model<TokenDocument>,
  ) {
    super(model);
  }
}