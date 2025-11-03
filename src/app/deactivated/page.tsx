"use client";

import { signOut } from "next-auth/react";

export default function DeactivatedPage() {
  return (
    <main 
      className="w-screen h-screen flex flex-col justify-center items-center"
      style={{
        background: 'linear-gradient(to top right, #4AA6EB, #F0424E)'
      }}
    >
      <div className="bg-white py-8 px-8 rounded-xl max-w-md shadow-lg">
        <div className="flex flex-col justify-center items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Hope for Haiti Logo" className="mb-4" />

          <h1 className="mb-3 text-2xl font-semibold text-center text-gray-primary">
            Account Deactivated
          </h1>
          <div className="mb-6 text-gray-700 text-sm font-light text-center space-y-4">
            <p>
              Your account has been deactivated.
            </p>
            <p>
              If you have any questions or believe this is an error, please contact:
            </p>
            <p className="font-medium">
              Yvette
              <br />
              <a 
                href="mailto:yvette@hopeforhaiti.org" 
                className="text-mainRed hover:text-red-primary transition-colors"
              >
                yvette@hopeforhaiti.org
              </a>
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/signIn" })}
            className="w-full bg-mainRed hover:bg-red-primary text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-mainRed focus:ring-offset-2 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
