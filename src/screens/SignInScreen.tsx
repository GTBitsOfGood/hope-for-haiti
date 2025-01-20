import { INVALID_CREDENTIALS_ERR } from "@/auth/errors";
import { Unauthenticated } from "@/auth/PageHelpers";
import submitHandler from "@/util/formAction";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

export default function SignInPage() {
  const handleSubmit = submitHandler(async (formData: FormData) => {
    const email = formData.get("email")?.toString() || "";
    const password = formData.get("password")?.toString() || "";

    try {
      const resp = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (resp?.code === INVALID_CREDENTIALS_ERR) {
        return toast.error("Invalid credentials");
      }
    } catch (e) {
      toast.error("Unkonwn error");
      console.error(e);
    }
  });

  return (
    <Unauthenticated redirect="/">
      <main className="w-screen h-screen flex flex-col justify-center items-center">
        <h1 className="mb-6 text-xl font-semibold">Sign In</h1>

        <form onSubmit={handleSubmit} className="w-64">
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              required
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              name="password"
              type="password"
              placeholder="******************"
              required
            />
          </div>

          <button
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Sign In
          </button>
        </form>
      </main>
    </Unauthenticated>
  );
}
