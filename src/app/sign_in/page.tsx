"use client";

import LoadingPage from "@/screens/LoadingScreen";
import dynamic from "next/dynamic";

export default dynamic(() => import("@/screens/SignInScreen"), {
  ssr: false,
  loading: LoadingPage,
});
