import axios from "axios";
import FormData from "form-data";

interface TmpFilesResponse {
  url: string;
  name: string;
  size?: number;
  expires?: string;
}

export async function uploadToTmpFiles(
  fileUrl: string,
  filename?: string
): Promise<TmpFilesResponse> {
  if (!fileUrl) {
    throw new Error("File URL is required");
  }

  const response = await axios.get<ArrayBuffer>(fileUrl, {
    responseType: "arraybuffer",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  const buffer = Buffer.from(response.data);

  const form = new FormData();
  form.append("file", buffer, {
    filename: filename || "file",
    contentType: response.headers["content-type"] || "application/octet-stream",
  });

  const upload = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
    headers: {
      ...form.getHeaders(),
    },
  });

  const data = upload.data?.data;

  if (!data?.url) {
    throw new Error("Failed to upload file to tmpfiles");
  }

  return {
    url: data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/"),
    name: data.filename || filename || "file",
    size: data.size,
    expires: data.expires,
  };
}
