import { getDb } from '../../db/connection.js';
import { verifyPassword } from '../../common/crypto.js';
import { UnauthorizedError, NotFoundError } from '../../common/errors.js';
import { UserDto } from '../../common/types.js';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  role: string;
  created_at: string;
}

export class AuthService {
  private db = getDb();

  public validateCredentials(email: string, password: string): UserDto {
    const stmt = this.db.prepare(
      'SELECT id, email, password_hash, salt, role, created_at FROM users WHERE email = ?'
    );
    const row = stmt.get(email) as UserRow | undefined;

    if (!row) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = verifyPassword(password, row.salt, row.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return {
      id: row.id,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
    };
  }

  public getUserById(id: string): UserDto {
    const stmt = this.db.prepare(
      'SELECT id, email, role, created_at FROM users WHERE id = ?'
    );
    const row = stmt.get(id) as Omit<UserRow, 'password_hash' | 'salt'> | undefined;

    if (!row) {
      throw new NotFoundError('User', id);
    }

    return {
      id: row.id,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
    };
  }
}
