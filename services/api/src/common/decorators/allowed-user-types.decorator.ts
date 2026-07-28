import { SetMetadata } from "@nestjs/common";

export const ALLOWED_USER_TYPES_KEY = "allowedUserTypes";

/** Usar com UserTypeGuard — restringe a rota a tipos específicos de usuário. */
export const AllowedUserTypes = (...types: string[]) =>
  SetMetadata(ALLOWED_USER_TYPES_KEY, types);
