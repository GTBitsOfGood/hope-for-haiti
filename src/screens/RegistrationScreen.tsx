import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import submitHandler from "@/util/formAction";
import { signIn } from "next-auth/react";

export default function RegistrationScreen() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) router.replace("/");

    const fetchData = async () => {
      try {
        const response = await fetch(`api/invites/${token}`, {
          cache: "no-store",
        });
        if (response.status === 400) {
          setError("Invalid or expired invite");
        }
        const json = await response.json();
        setEmail(json["email"]);
      } catch (err) {
        toast.error("Unknown Error");
        console.log(err);
      }
    };
    fetchData();
  }, [searchParams, router]);

  const handleSubmit = submitHandler(async (formData: FormData) => {
    if (formData.get("password") !== formData.get("confirm")) {
      toast.error("Your passwords do not match");
      return;
    }
    formData.delete("confirm");
    formData.append("inviteToken", searchParams.get("token") || "");

    const response = await fetch(`api/users`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const password = formData.get("password");
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
    } else if (response.status === 400) {
      setError("Invite has expired");
    } else if (response.status === 404) {
      setError("Invite does not exist");
    } else if (response.status === 409) {
      setError("User already exists");
    } else {
      setError("Unknown error");
    }
  });

  return (
    <main className="bg-gradient-to-tr from-[#4AA6EB] to-[#F0424E] w-screen h-screen flex flex-col justify-center items-center">
      <div className="bg-white py-6 px-6 rounded-xl w-96 sm:w-[580]">
        {!error ? (
          <div>
            <h1 className="mb-1 text-xl font-semibold">Create Account</h1>
            <p className="mb-4 text-sm font-light text-gray-500">
              Welcome to the Hope for Haiti database. Please fill in your <br />{" "}
              organization’s account information.
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
                  value={email}
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
                  htmlFor="password"
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
        ) : (
          <div className="flex justify-center">
            <p className="text-red-500 text-lg font-semibold py-1 mt-2">
              {error}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
