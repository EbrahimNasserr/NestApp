import { compare, hash } from 'bcrypt';

export const generateHash = async (
  plaintext: string,
  saltOrRounds: number = parseInt(process.env.SALT_OR_ROUNDS as string) || 10,
): Promise<string> => {
  return await hash(plaintext, saltOrRounds);
};

export const compareHash = async (
  plaintext: string,
  hashedText: string,
): Promise<boolean> => {
  return await compare(plaintext, hashedText);
};
