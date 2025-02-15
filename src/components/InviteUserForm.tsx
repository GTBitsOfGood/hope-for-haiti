"use client";

import { useState } from "react";
import { UserType } from "@prisma/client";

interface InviteUserFormProps {
  closeModal: () => void;
  onSubmit: (role: UserType) => void;
}

export default function InviteUserForm({ closeModal, onSubmit }: InviteUserFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserType | "">("");
  const [step, setStep] = useState(1);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!role) {
      console.error("Role is not selected");
      return;
    }

    if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "STAFF") {
      onSubmit(role as UserType);
      setStep(2);
    } else {
      onSubmit(role as UserType);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        {step === 1 ? (
          <>
            <h2 className="text-xl font-bold mb-4">Add new account</h2>
            <button className="absolute top-4 right-4" onClick={closeModal}>✕</button>
            <form onSubmit={handleSubmit}>
              <label className="block mb-2">Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded mb-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <label className="block mb-2">Email</label>
              <input
                type="email"
                className="w-full p-2 border rounded mb-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label className="block mb-2">Role</label>
              <select
                className="w-full p-2 border rounded mb-4"
                value={role}
                onChange={(e) => setRole(e.target.value as UserType)}
                required
              >
                <option value="" disabled>Select a role</option>
                {Object.values(UserType).map((roleOption) => (
                  <option key={roleOption} value={roleOption}>{roleOption}</option>
                ))}
              </select>

              <div className="flex justify-between">
                <button
                  type="button"
                  className="border border-mainRed text-mainRed px-4 py-2 rounded"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-mainRed text-white px-4 py-2 rounded"
                >
                  {role === "PARTNER" ? "Next" : "Send invite link"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">Add new account</h2>
            <button className="absolute top-4 right-4" onClick={closeModal}>✕</button>
            <p className="mb-4">An email has been sent to finalize account creation. This account is currently pending.</p>
            <p className="mb-4">You can view the current status from the account management page.</p>
            <div className="flex justify-center mb-4">
              <img src="/assets/blue_arrow.svg" alt="Blue Arrow" className="w-12 h-12" />
            </div>
            <button
              className="bg-mainRed text-white px-4 py-2 rounded w-full"
              onClick={closeModal}
            >
              Back to account management
            </button>
          </>
        )}
      </div>
    </div>
  );
}
