import { SetMetadata } from "@nestjs/common";
import { TokenTypeEnum } from "../enums/token.enum";

export const TOKEN_TYPE_KEY = "tokenType";

export const TokenType = (tokenType: TokenTypeEnum = TokenTypeEnum.Access) => {
    return SetMetadata(TOKEN_TYPE_KEY, tokenType);
}