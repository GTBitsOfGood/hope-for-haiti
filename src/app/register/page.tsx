"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import submitHandler from "@/util/formAction";
import { signIn } from "next-auth/react";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { apiClient } = useApiClient();
  const token = searchParams.get("token");

  const { data: inviteData, isLoading } = useFetch<{ email: string }>(
    `/api/invites/${token}`,
    {
      onError: () => {
        toast.error("Error while validating invite");
        router.replace("/");
      },
    }
  );

  if (!token) {
    router.replace("/");
    return null;
  }

  const handleSubmit = submitHandler(async (formData: FormData) => {
    if (formData.get("password") !== formData.get("confirm")) {
      toast.error("Your passwords do not match");
      return;
    }
    formData.delete("confirm");
    formData.append("inviteToken", token);

    try {
      await apiClient.post("/api/users", { body: formData });

      const password = formData.get("password");
      const result = await signIn("credentials", {
        email: inviteData?.email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        router.push("/");
      }
    } catch (error) {
      toast.error((error as Error).toString());
    }
  });

  if (isLoading) {
    return (
      <main
        className="w-screen h-screen flex flex-col justify-center items-center"
        style={{
          background: "linear-gradient(to top right, #4AA6EB, #F0424E)",
        }}
      >
        <div className="bg-white py-6 px-6 rounded-xl w-96 sm:w-[580px]">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-600">Loading invite...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="w-screen h-screen flex flex-col justify-center items-center"
      style={{
        background: "linear-gradient(to top right, #4AA6EB, #F0424E)",
      }}
    >
      <div className="bg-white py-6 px-6 rounded-xl w-96 sm:w-[580px]">
        <div>
          <h1 className="mb-1 text-xl font-semibold">Create Account</h1>
          <p className="mb-4 text-sm font-light text-gray-500">
            Welcome to the Hope for Haiti database. Please fill in your <br />{" "}
            organization&apos;s account information.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label
                className="block text-gray-800 text-sm mb-2 font-light"
                htmlFor="email"
              >
                Email
                <div className="text-red-500 inline">*</div>
              </label>
              <input
                className="bg-zinc-50 appearance-none border-gray-200 rounded w-full py-2 px-3 text-gray-500 leading-tight font-light text-sm"
                type="email"
                value={inviteData?.email || ""}
                disabled
                required
              />
            </div>

            <div className="mb-3">
              <label
                className="block text-gray-800 text-sm mb-2 font-light"
                htmlFor="password"
              >
                Password
                <div className="text-red-500 inline">*</div>
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

            <div className="mb-3">
              <label
                className="block text-gray-800 text-sm mb-2 font-light"
                htmlFor="confirm"
              >
                Confirm Password
                <div className="text-red-500 inline">*</div>
              </label>
              <input
                className="bg-zinc-50 appearance-none border-gray-200 rounded w-full py-2 px-3 text-gray-700 leading-tight font-light text-sm"
                id="confirm"
                name="confirm"
                type="password"
                placeholder="Confirm Password"
                required
              />
            </div>

            <div className="mb-3">
              <p className="text-xs text-gray-500 font-light">
                Passwords must be at least 8 characters long and contain at
                least one uppercase letter, one lowercase letter, one number,
                and one special character.
              </p>
            </div>

            <div className="justify-end flex">
              <button
                className="w-36 bg-red-500 hover:bg-red-700 text-white py-1 px-4 mt-2 rounded focus:outline-none focus:shadow-outline"
                type="submit"
              >
                Create account
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
