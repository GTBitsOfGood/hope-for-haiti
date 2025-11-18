"use client";

import {
  Cube,
  HandHeart,
  House,
  List,
  Package,
  UserCircle,
  X,
  UserList,
  ClipboardText,
  Chat,
  SignOut,
  ArrowClockwise,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "./context/UserContext";
import { useEffect, useState } from "react";
import { hasAnyPermission, hasPermission, isPartner } from "@/lib/userUtils";
import { signOut } from "next-auth/react";
import { useApiClient } from "@/hooks/useApiClient";

function NavLink({
  href,
  icon,
  label,
  onClick,
  placeLast = false,
  className: customClassName,
  liClassName,
  noWrapper = false,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label?: string;
  placeLast?: boolean;
  className?: string;
  liClassName?: string;
  noWrapper?: boolean;
}) {
  const path = usePathname();
  let className =
    "mb-2 w-full px-2 py-2 flex justify-start items-center space-x-2 rounded-xl";
  if (path === href) className += " bg-white";

  if (customClassName) className += ` ${customClassName}`;

  const children = (
    <>
      {icon}
      {label && (
        <p className="font-light sm:hidden md:block whitespace-nowrap">
          {label}
        </p>
      )}
    </>
  );

  const liClass = [
    placeLast ? "mt-auto" : "",
    liClassName || "",
  ].filter(Boolean).join(" ");

  const content = href ? (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  ) : (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );

  if (noWrapper) {
    return content;
  }

  return (
    <li className={liClass || undefined}>
      {content}
    </li>
  );
}

function NavLinks() {
  const { user } = useUser();
  const isPartnerUser = isPartner(user?.type);
  const canViewSupport = isPartnerUser || hasPermission(user, "supportRead");
  const canViewAccounts = hasPermission(user, "userRead");
  const canViewUnallocated = hasPermission(user, "allocationRead");
  const canViewDonorOffers = hasAnyPermission(user, [
    "requestRead",
    "requestWrite",
    "allocationRead",
    "archivedRead",
    "offerWrite",
  ]);
  const canViewWishlists = isPartnerUser || hasPermission(user, "wishlistRead");
  const canViewDistributions = hasAnyPermission(user, [
    "distributionRead",
    "shipmentRead",
  ]);

  return (
    <>
      <NavLink href="/" label="Home" icon={<House size={22} />} />
      {canViewSupport && (
        <NavLink href="/support" label="Support" icon={<Chat size={22} />} />
      )}
      {canViewAccounts && (
        <NavLink
          href="/accountManagement"
          label="Account Management"
          icon={<UserList size={22} />}
        />
      )}
      {canViewUnallocated && (
        <NavLink
          href="/unallocatedItems"
          label="Unallocated Items"
          icon={<Cube size={22} />}
        />
      )}
      {canViewDonorOffers && (
        <NavLink
          href="/donorOffers"
          label="Donor Offers"
          icon={<HandHeart size={22} />}
        />
      )}
      {isPartnerUser && (
        <>
          <NavLink href="/items" label="Items" icon={<Cube size={22} />} />
          <NavLink
            href="/requests"
            label="Requests"
            icon={<List size={22} />}
          />
        </>
      )}
      {canViewWishlists && (
        <NavLink
          href="/wishlists"
          label="Wishlists"
          icon={<ClipboardText size={22} />}
        />
      )}
      {canViewDistributions && (
        <NavLink
          href="/distributions"
          label="Distributions"
          icon={<Package size={22} />}
        />
      )}
      {/* Spacer to push the profile and sign out buttons to the bottom */}
      <li className="flex-grow" />
      <ul className="flex gap-2">
        <li className="flex-1 mt-auto">
          <NavLink
            href="/profile"
            label="Profile"
            icon={<UserCircle size={22} />}
            noWrapper
          />
        </li>
        {user?.isSuper && (
          <li className="flex-shrink-0 mt-auto">
            <ResetButton />
          </li>
        )}
        <li className="flex-shrink-0 mt-auto">
          <NavLink
            onClick={signOut}
            icon={<SignOut size={22} />}
            className="border-red-primary border rounded text-red-primary hover:bg-red-primary/10 transition-all duration-100 !w-auto"
            noWrapper
          />
        </li>
      </ul>
    </>
  );
}

function ResetButton() {
  const { user } = useUser();
  const { apiClient } = useApiClient();
  const [isResetting, setIsResetting] = useState(false);

  if (!user?.isSuper) {
    return null;
  }

  const handleReset = async () => {
    if (
      !confirm(
        "Are you sure you want to reset the database? This will delete all data and cannot be undone."
      )
    ) {
      return;
    }

    try {
      setIsResetting(true);
      await apiClient.post("/api/reset");
      alert("Database reset successfully! Please refresh the page.");
      window.location.reload();
    } catch (error) {
      alert(
        `Failed to reset database: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <button
      onClick={handleReset}
      disabled={isResetting}
      className="border-red-primary border rounded text-red-primary hover:bg-red-primary/10 transition-all duration-100 !w-auto disabled:opacity-50 disabled:cursor-not-allowed px-2 py-2 flex justify-center items-center"
      title="Reset Database"
    >
      <ArrowClockwise size={22} className={isResetting ? "animate-spin" : ""} />
    </button>
  );
}

function DesktopNavbar() {
  const { user } = useUser();
  const isPartnerUser = isPartner(user?.type);

  return (
    <nav
      id="navbar"
      className="h-screen fixed flex-0 bg-blue-light w-16 md:min-w-60 p-2 sm:flex flex-col items-center md:rounded-r-3xl hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="Hope for Haiti Logo" className="mt-6 mb-2" />

      <h1 className="mt-2 font-bold hidden md:block">
        {isPartnerUser ? "Partner Portal" : "Staff Portal"}
      </h1>

      <hr className="mt-2 mb-4 h-1 bg-blue-dark border-t-0 w-full" />

      <ul className="p-1 w-full flex flex-col flex-1 flex-grow">
        <NavLinks />
      </ul>
    </nav>
  );
}

function MobileNavbar() {
  const { user } = useUser();
  const isPartnerUser = isPartner(user?.type);
  const path = usePathname();

  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen((prev) => !prev);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <nav
      className={`fixed top-4 right-4 p-4 rounded-lg sm:hidden overflow-hidden transition-all ${open ? "w-64 h-[30rem] bg-blue-light" : "w-12 h-12"}`}
    >
      <div
        className={`w-full h-full flex flex-col items-start transition-all ${open ? "opacity-100" : "opacity-0"}`}
      >
        <h1 className="m-1.5 mb-1 font-semibold whitespace-nowrap">
          {isPartnerUser ? "Partner Portal" : "Staff Portal"}
        </h1>

        <hr className="mt-4 mb-3 h-0.5 bg-blue-dark border-t-0 w-full" />

        <ul className="flex-1 flex flex-col w-full">
          <NavLinks />
        </ul>
      </div>

      <button
        onClick={toggleOpen}
        className="absolute top-0 right-0 w-12 h-12 flex justify-center items-center"
      >
        <List
          size={28}
          className={`absolute top-5 right-5 text-gray-500 hover:text-gray-700 transition-all ${open ? "-rotate-45 opacity-0" : "rotate-0 opacity-100"}`}
        />
        <X
          size={28}
          className={`absolute top-5 right-5 text-gray-500 hover:text-gray-700 transition-all ${open ? "rotate-0 opacity-100" : "rotate-45 opacity-0"}`}
        />
      </button>
    </nav>
  );
}

export default function NavbarLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = useUser();
  const pathname = usePathname();
  const hideNavPaths = [
    "/reset-password",
    "/createPartnerAccount",
    "/deactivated",
    "/pending",
    "/signIn",
  ];
  const hideNav = hideNavPaths.some((path) => pathname.startsWith(path));

  return (
    <div className="flex">
      {user && !hideNav ? (
        <>
          <DesktopNavbar />
          <MobileNavbar />
          <main className="ml-16 md:ml-60 flex-1 px-6 py-8 min-h-screen overflow-scroll">
            {children}
          </main>
        </>
      ) : (
        <>{children}</>
      )}
    </div>
  );
}
