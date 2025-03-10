import { useUser } from "@/components/context/UserContext";
import { signOut } from "next-auth/react";

export default function HomeScreen() {
  const { user } = useUser();
  const handleSignout = () => signOut();

  return (
    <>
      <h1 className="text-2xl font-semibold">Home</h1>
      <p className="mb-4">User Type: {user?.type}</p>
      <button
        onClick={handleSignout}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Sign Out
      </button>
    </>
  );
}
