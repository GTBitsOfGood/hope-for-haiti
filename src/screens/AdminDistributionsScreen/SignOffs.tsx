import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { CgSpinner } from "react-icons/cg";
import SignOffsTable from "./SignOffsTable";
import { useFetch } from "@/hooks/useFetch";

export default function SignOffs() {
  const { partnerId } = useParams();

  const { isLoading } = useFetch(
    `/api/distributions/signOffs?partnerId=${encodeURIComponent((partnerId ?? "") as string)}`,
    {
      onError: (error) => {
        console.log(error);
        toast.error("Error fetching signOffs", {
          position: "bottom-right",
        });
      },
    }
  );

  if (isLoading) {
    return <CgSpinner className="w-16 h-16 animate-spin opacity-50" />;
  }

  return <SignOffsTable />;
}
