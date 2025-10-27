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
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "./context/UserContext";
import { useEffect, useState } from "react";

function NavLink({
  href,
  icon,
  label,
  placeLast = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  placeLast?: boolean;
}) {
  const path = usePathname();
  let className =
    "mb-2 w-full px-2 py-2 flex justify-start items-center space-x-2 rounded-xl";
  if (path === href) className += " bg-white";

  return (
    <li className={placeLast ? "mt-auto" : ""}>
      <Link href={href} className={className}>
        {icon}
        <p className="font-light sm:hidden md:block whitespace-nowrap">
          {label}
        </p>
      </Link>
    </li>
  );
}

function NavLinks() {
  const { user } = useUser();
  const isPartner = user?.type === "PARTNER";
  const isStaff =
    user?.type === "STAFF" ||
    user?.type === "ADMIN" ||
    user?.type === "SUPER_ADMIN";

  return (
    <>
      <NavLink href="/" label="Home" icon={<House size={22} />} />
      {isStaff && (
        <NavLink
          href="/accountManagement"
          label="Account Management"
          icon={<UserList size={22} />}
        />
      )}
      {isStaff && (
        <NavLink
          href="/unallocatedItems"
          label="Unallocated Items"
          icon={<Cube size={22} />}
        />
      )}
      {isStaff && (
        <NavLink
          href="/donorOffers"
          label="Donor Offers"
          icon={<HandHeart size={22} />}
        />
      )}
      {isPartner && (
        <>
          <NavLink
            href="/items"
            label="Items"
            icon={<Cube size={22} />}
          />
          <NavLink
            href="/requests"
            label="Requests"
            icon={<List size={22} />}
          />
        </>
      )}
      <NavLink
        href="/wishlists"
        label="Wishlists"
        icon={<ClipboardText size={22} />}
      />
      {isStaff && (
        <NavLink
          href="/distributions"
          label="Distributions"
          icon={<Package size={22} />}
        />
      )}
      {isPartner && (
        <NavLink
          href="/distributions"
          label="My Distributions"
          icon={<Package size={22} />}
        />
      )}
      <NavLink
        href="/profile"
        label="Profile"
        icon={<UserCircle size={22} />}
        placeLast
      />
    </>
  );
}

function DesktopNavbar() {
  const { user } = useUser();
  const isStaff =
    user?.type === "STAFF" ||
    user?.type === "ADMIN" ||
    user?.type === "SUPER_ADMIN";

  return (
    <nav
      id="navbar"
      className="h-screen fixed flex-0 bg-blue-light w-16 md:min-w-60 p-2 sm:flex flex-col items-center md:rounded-r-3xl hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="Hope for Haiti Logo" className="mt-6 mb-2" />

      <h1 className="mt-2 font-bold hidden md:block">
        {isStaff ? "Admin Portal" : "Partner Portal"}
      </h1>

      <hr className="mt-2 mb-4 h-1 bg-blue-dark border-t-0 w-full" />

      <ul className="p-1 w-full flex flex-col flex-1">
        <NavLinks />
      </ul>
    </nav>
  );
}

function MobileNavbar() {
  const path = usePathname();

  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen((prev) => !prev);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <nav
      className={`fixed top-4 right-4 p-4 rounded-lg sm:hidden overflow-hidden transition-all ${open ? "w-64 h-[28rem] bg-blue-light" : "w-12 h-12"}`}
    >
      <div
        className={`w-full h-full flex flex-col items-start transition-all ${open ? "opacity-100" : "opacity-0"}`}
      >
        <h1 className="m-1.5 mb-1 font-semibold whitespace-nowrap">
          Partner Portal
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
  const hideNavPaths = ["/reset-password", "/createPartnerAccount"];
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
