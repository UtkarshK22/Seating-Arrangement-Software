import api from "./http";

type User = {
  id: string;
  fullName: string;
};

export async function getUsers(): Promise<User[]> {
  return api<User[]>("/users");
}

