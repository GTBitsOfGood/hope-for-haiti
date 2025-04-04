import submitHandler from "@/util/formAction";
import Link from "next/link";
import { useState } from "react";

export default function FileUploadScreen() {
  const [error, setError] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const handleUpload = submitHandler(async (data: FormData) => {
    setError("");
    setFileUrl("");
    const file = data.get("file") as File;
    if (file.name === "") {
      console.error("No file selected");
      setError("No file selected");
      return;
    }

    const response = await fetch("/api/file/upload?filename=" + file.name);
    if (!response.ok) {
      console.error("Failed to get upload URL:", response.statusText);
      setError("Failed to get upload URL");
      return;
    }

    const body = await response.json();
    console.log("Upload URL:", body.sas);
    const uploadResponse = await fetch(body.sas, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        "x-ms-blob-type": "BlockBlob",
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      console.error("Failed to upload file:", uploadResponse.statusText);
      setError("Failed to upload file");
      return;
    }

    const uploadedFileName = body.filename;

    const fileUrlResponse = await fetch(
      "/api/file/access?filename=" + uploadedFileName
    );

    if (!fileUrlResponse.ok) {
      console.error("Failed to get file URL:", fileUrlResponse.statusText);
      setError("Failed to get file URL");
      return;
    }
    const fileUrlBody = await fileUrlResponse.json();
    console.log(fileUrlBody);
    setFileUrl(fileUrlBody.sas);
  });

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">File Upload</h1>
      <form onSubmit={handleUpload}>
        <input
          type="file"
          name="file"
          className="mb-4"
          accept=".pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              console.log("File selected:", file);
            }
          }}
        />
        <button className="bg-blue-500 text-white py-2 px-4 rounded">
          Upload
        </button>
      </form>
      <div className="text-red-500">{error}</div>
      {fileUrl && <Link href={fileUrl}>View file here</Link>}
    </div>
  );
}
