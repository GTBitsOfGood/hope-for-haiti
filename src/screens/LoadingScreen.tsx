import { CgSpinner } from "react-icons/cg";

export default function LoadingScreen() {
  return (
    <div className="w-full h-screen flex justify-center items-center">
      <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
    </div>
  );
}
