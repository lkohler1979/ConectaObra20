import { Injectable } from "@nestjs/common";
import { compare, hash } from "bcryptjs";

const SALT_ROUNDS = 10;

@Injectable()
export class PasswordService {
  hash(senha: string): Promise<string> {
    return hash(senha, SALT_ROUNDS);
  }

  compare(senha: string, senhaHash: string): Promise<boolean> {
    return compare(senha, senhaHash);
  }
}
