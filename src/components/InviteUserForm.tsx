"use client";

import { useState } from "react";
import { UserType } from "@prisma/client";
import { Open_Sans } from "next/font/google";
import { useRouter } from "next/navigation";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

interface InviteUserFormProps {
  closeModal: () => void;
  onSubmit: (role: UserType) => void;
}

export default function InviteUserForm({
  closeModal,
  onSubmit,
}: InviteUserFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserType | "">("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !role) {
      setErrorMessage("All fields are required.");
      return;
    }

    //if the role is PARTNER, go to account creation without sending an invite
    if (role === "PARTNER") {
      closeModal();
      router.push(
        `/create-partner-account?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`,
      );
      return;
    }

    //otherwise, send invite immediately
    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email,
          name,
          userType: role.toUpperCase(),
        }).toString(),
      });

      if (!response.ok) throw new Error("Couldn't send invite.");

      setSuccess(true);
      onSubmit(role as UserType);
    } catch {
      setErrorMessage("Couldn't send invite. Please try again.");
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ${openSans.className}`}
    >
      <div className="bg-white p-6 rounded-[16px] w-[450px] relative">
        {success ? (
          <>
            <h2 className="text-[24px] font-bold text-[#22070B] mb-4">
              Add new account
            </h2>
            <button
              className="text-[24px] absolute top-4 right-4 mr-3 text-[#22070B]"
              onClick={closeModal}
            >
              ✕
            </button>
            <p className="text-[16px] text-[#22070B]/70 mb-4">
              An email has been sent to finalize account creation. This account
              is currently pending.
            </p>
            <p className="text-[16px] text-[#22070B]/70 mb-8">
              You can view the current status from the account management page.
            </p>
            <div className="flex justify-center mb-8">
              <img
                src="/assets/blue_arrow.svg"
                alt="Success"
                className="w-30 h-30"
              />
            </div>

            <button
              className="bg-mainRed text-white px-6 py-3 rounded-[4px] font-semibold w-full"
              onClick={closeModal}
            >
              Back to account management
            </button>
          </>
        ) : (
          <>
            <h2 className="text-[24px] font-bold text-[#22070B] mb-4">
              Add new account
            </h2>
            <button
              className="absolute top-4 right-4 text-[#22070B]"
              onClick={closeModal}
            >
              ✕
            </button>
            <form onSubmit={handleSubmit}>
              <label className="block text-[16px] text-[#22070B] mb-2">
                Name
              </label>
              <input
                type="text"
                className="w-full p-3 border bg-[#F9F9F9] text-[16px] text-[#22070B] rounded-[4px] mb-5"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <label className="block text-[16px] text-[#22070B] mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full p-3 border bg-[#F9F9F9] text-[16px] text-[#22070B] rounded-[4px] mb-5"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label className="block text-[16px] text-[#22070B] mb-2">
                Role
              </label>
              <div className="relative w-full">
                <button
                  type="button"
                  className="w-full p-3 border bg-[#F9F9F9] text-[16px] text-[#22070B] rounded-[4px] flex justify-between items-center"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {role ? role : "Select a role"}
                  <svg
                    className="w-4 h-4 text-[#6B7280]"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="w-full bg-white border rounded-[4px] mt-1">
                    {["SUPER_ADMIN", "ADMIN", "STAFF", "PARTNER"].map(
                      (option) => (
                        <div
                          key={option}
                          className="p-3 text-[16px] text-[#22070B] bg-[#F9F9F9] hover:bg-[#22070B]/10 cursor-pointer"
                          onClick={() => {
                            setRole(option as UserType);
                            setDropdownOpen(false);
                          }}
                        >
                          {option}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              {errorMessage && (
                <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
              )}

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  className="border text-mainRed px-6 py-3 rounded-[4px] font-semibold"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-mainRed text-white px-6 py-3 rounded-[4px] font-semibold"
                >
                  {role === "PARTNER" ? "Next" : "Send invite link"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
