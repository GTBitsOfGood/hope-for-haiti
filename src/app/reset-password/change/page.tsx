"use client";

import submitHandler from "@/util/formAction";
import toast from "react-hot-toast";
import { useApiClient } from "@/hooks/useApiClient";
import { useRouter, useSearchParams } from "next/navigation";
import { CgSpinner } from "react-icons/cg";
import { validatePassword } from "@/util/util";
import { useFetch } from "@/hooks/useFetch";

export default function ResetPasswordChangePage() {
  const { apiClient } = useApiClient();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const { isLoading, error } = useFetch(`/api/reset-password/verify?token=${token}`, {
    onError: () => {
      toast.error("Error while validating token");
      router.push("/signIn");
    },
  });

  const handleSubmit = submitHandler(async (formData: FormData) => {
    try {
      const password = formData.get("password") || "";
      const confirmPassword = formData.get("confirmPassword") || "";
      if (!password || !confirmPassword || password != confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      if (!validatePassword(password as string)) {
        toast.error(
          "Password must be at least 8 characters and contain one upper and lower case letter, one number, and one special character (!@#$%^&*)."
        );
        return;
      }

      await apiClient.post("/api/reset-password/change", {
        body: JSON.stringify({
          password: password as string,
          token: token,
        }),
      });

      toast.success("Password reset successfully!");
      router.push("/signIn");
    } catch (e) {
      if (e instanceof Error) {
        toast.error(e.message);
      } else {
        toast.error("Unknown error");
      }
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
          <h1 className="mb-1 text-xl font-semibold">Reset Password</h1>
          <h2 className="mb-4 text-gray-800 opacity-70 font-light text-sm whitespace-normal w-64 sm:w-80">
            Please enter your new password.
          </h2>
        </div>
        {isLoading && <CgSpinner />}
        {!isLoading && !error && (
          <form onSubmit={handleSubmit} className="w-64 sm:w-80">
            <div className="mb-4">
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
                autoComplete="new-password"
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-800 text-sm mb-2 font-light"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <input
                className="bg-zinc-50 appearance-none border-gray-200 rounded w-full py-2 px-3 text-gray-700 leading-tight font-light text-sm"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                autoComplete="new-password"
                required
              />
            </div>
            <button
              className="w-full bg-red-500 hover:bg-red-700 text-white py-1 px-4 mt-7 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Reset password
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
