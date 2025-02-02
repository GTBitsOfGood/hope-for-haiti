"use client";

import LoadingScreen from "@/screens/LoadingScreen";
import dynamic from "next/dynamic";

export default dynamic(() => import("@/screens/WishlistsScreen"), {
  ssr: false,
  loading: LoadingScreen,
});
