"use client";

import LoadingPage from "@/screens/LoadingScreen";
import dynamic from "next/dynamic";

export default dynamic(() => import("@/screens/HomeScreen"), {
  ssr: false,
  loading: LoadingPage,
});
