import { SetMetadata } from "@nestjs/common";
import { RoleEnum } from "../enums/user.provider";

export const ACCESS_ROLES_KEY = "accessRoles";

export const AccessRoles = (accessRoles: RoleEnum[] = [RoleEnum.USER]) => {
    return SetMetadata(ACCESS_ROLES_KEY, accessRoles);
}