import { CgSpinner } from "react-icons/cg";

export default function LoadingPage() {
  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
    </div>
  );
}
