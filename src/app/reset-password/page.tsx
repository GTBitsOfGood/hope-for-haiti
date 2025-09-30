"use client";

import submitHandler from "@/util/formAction";
import Link from "next/link";
import toast from "react-hot-toast";
import { useApiClient } from "@/hooks/useApiClient";
import { useState } from "react";

export default function SignInPage() {
  const { apiClient } = useApiClient();
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = submitHandler(async (formData: FormData) => {
    try {
      // Uncomment below when api route is finished
      /*
      await apiClient.post("/api/reset-password", {
        body: formData,
      });
      */
      console.log(formData, apiClient);
      setSubmitted(true);
    } catch (e) {
      toast.error("Unknown error");
      console.error(e);
    }
  });

  return (
    <main className="bg-gradient-to-tr from-[#4AA6EB] to-[#F0424E] w-screen h-screen flex flex-col justify-center items-center">
      <div className="bg-white py-6 px-6 rounded-xl">
        <div className="flex flex-col justify-center items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Hope for Haiti Logo" className="mb-4" />
          <h1 className="mb-1 text-xl font-semibold">Forgot Password</h1>
          <h2 className="mb-4 text-gray-800 opacity-70 font-light text-sm whitespace-normal w-64 sm:w-80">
            Please enter your email and we will send you a recovery link.
          </h2>
        </div>
        {!submitted ? (
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
            <button
              className="w-full bg-red-500 hover:bg-red-700 text-white py-1 px-4 mt-7 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Send recovery link
            </button>
            <Link href="/signIn">
              <button
                className="w-full bg-white hover:bg-gray-200 text-red-500 py-1 px-4 mt-2 rounded focus:outline-none focus:shadow-outline"
                type="submit"
              >
                Return to login
              </button>
            </Link>
          </form>
        ) : (
          <div>Password reset email sent. Please check your inbox.</div>
        )}
      </div>
    </main>
  );
}
