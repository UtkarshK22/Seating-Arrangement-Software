type User = {
  id: string;
  fullName: string;
};

type Props = {
  users: User[];
  selectedUserId: string | null;
  onUserClick: (userId: string) => void;
};

export function UserList({
  users,
  selectedUserId,
  onUserClick,
}: Props) {
  return (
    <div>
      <h3>Users</h3>
      {users.map(user => (
        <div
          key={user.id}
          onClick={() => onUserClick(user.id)}
          style={{
            padding: "8px",
            cursor: "pointer",
            background:
              selectedUserId === user.id ? "#e0e7ff" : "transparent",
          }}
        >
          {user.fullName}
        </div>
      ))}
    </div>
  );
}
