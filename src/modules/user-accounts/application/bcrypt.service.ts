import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';

@Injectable()
export class BcryptService {
    async generateHash(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }
}