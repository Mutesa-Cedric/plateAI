import { compare, hash } from "bcrypt";
export const hashPassword = async (password: string): Promise<string> => {
    const hashedPassword = await hash(password, 10);
    return hashedPassword;
};


export const comparePassword = async (password: string, encryptedPassword?: string): Promise<Boolean> => {
    if (!encryptedPassword) return false;
    return await compare(password, encryptedPassword);
}
