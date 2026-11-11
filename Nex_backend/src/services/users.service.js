import { findAllUsers, findUserById, createUser as createUserRepository, updateUser as updateUserRepository, patchUser as patchUserRepository, deleteUser as deleteUserRepository } from "../repositories/users.repository.js";


export const getUsers = async () => {
    return await findAllUsers();
};

export const getUserById = async (id) => {
    return await findUserById(id);
};


export const createUser = async (email, passwordHash) => {
    return await createUserRepository(email, passwordHash);
};

export const updateUser = async (
    id,
    email,
    passwordHash,
    accountType,
    status
) => {
    return await updateUserRepository(
        id,
        email,
        passwordHash,
        accountType,
        status
    );
};

export const patchUser = async (
    id,
    email,
    passwordHash,
    accountType,
    status
) => {
    return await patchUserRepository(
        id,
        email,
        passwordHash,
        accountType,
        status
    );
};

export const deleteUser = async (id) => {
    return await deleteUserRepository(id);
};