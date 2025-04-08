import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CgSpinner } from "react-icons/cg";
import SignOffsTable from "./SignOffsTable";

export default function SignOffs() {
  const { partnerId } = useParams();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/distributions/signOffs?partnerId=${encodeURIComponent((partnerId ?? "") as string)}`,
        );

        if (!response.ok) {
          throw new Error();
        }

        // const data = await response.json();
      } catch (e) {
        toast.error("Error fetching signOffs", {
          position: "bottom-right",
        });
        console.log(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [partnerId]);

  if (isLoading) {
    return <CgSpinner className="w-16 h-16 animate-spin opacity-50" />;
  }

  return <SignOffsTable />;
}
