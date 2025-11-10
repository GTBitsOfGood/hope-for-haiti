"use client";

import { INVALID_CREDENTIALS_ERR } from "@/auth/errors";
import submitHandler from "@/util/formAction";
import { signIn } from "next-auth/react";
import Link from "next/link";
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

      console.log(resp);

      if (resp?.code === INVALID_CREDENTIALS_ERR) {
        return toast.error("Invalid credentials");
      }
    } catch (e) {
      toast.error("Unknown error");
      console.error(e);
    }
  });

  return (
    <main 
      className="w-screen h-screen flex flex-col justify-center items-center"
      style={{
        background: 'linear-gradient(to top right, #4AA6EB, #F0424E)'
      }}
    >
      <div className="bg-white py-6 px-6 rounded-xl">
        <div className="flex flex-col justify-center items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Hope for Haiti Logo" className="mb-4" />
          <h1 className="mb-1 text-xl font-semibold">Log In</h1>
          <h2 className="mb-4 text-gray-800 opacity-70 font-light text-sm">
            Please enter your credentials.
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="w-64 sm:w-80">
          <div className="mb-4">
            <label
              className="block text-gray-800 text-sm mb-2 font-light"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="bg-zinc-50 appearance-none border-gray-200 rounded w-full py-2 px-3 text-gray-700 leading-tight font-light text-sm"
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              required
            />
          </div>

          <div className="mb-2">
            <label
              className="block text-gray-800 text-sm mb-2 font-light"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="bg-zinc-50 appearance-none border-gray-200 rounded w-full py-2 px-3 text-gray-700 leading-tight font-light text-sm"
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              required
            />
          </div>

          <div className="flex justify-between align-middle">
            <div>
              <input
                type="checkbox"
                className="bg-zinc-50 border-gray-200 rounded focus:ring-0"
              />
              <label
                htmlFor="remember"
                className="text-gray-800 text-xs ml-2 font-light"
              >
                Remember me
              </label>
            </div>
            <div>
              <Link href={"/reset-password"} className="text-red-500 text-xs">
                Forgot Password
              </Link>
            </div>
          </div>

          <button
            className="w-full bg-red-500 hover:bg-red-700 text-white py-1 px-4 mt-7 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}
