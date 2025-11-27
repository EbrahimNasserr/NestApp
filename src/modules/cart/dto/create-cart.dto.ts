import { ICartProduct } from "src/common";
import { IsMongoId, IsNumber, IsPositive, Min } from "class-validator";
import { Types } from "mongoose";

export class CreateCartDto implements Partial<ICartProduct> {
    @IsMongoId()
    productId: Types.ObjectId;
    @Min(1)
    @IsPositive()
    @IsNumber()
    quantity: number;
}
