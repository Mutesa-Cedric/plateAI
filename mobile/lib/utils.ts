
export const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

export const validatePassword = (password: string) => {
    return password.length >= 4;
}
