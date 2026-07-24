// Client-side unsigned Cloudinary upload.
export async function uploadToCloudinary(
  file: File,
  cloudName: string,
  uploadPreset: string,
): Promise<string> {
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary is not configured. Ask an admin to set Cloud Name and Upload Preset.");
  }
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Upload failed [${res.status}]: ${t}`);
  }
  const data = (await res.json()) as { secure_url?: string; url?: string };
  const url = data.secure_url || data.url;
  if (!url) throw new Error("Upload succeeded but no URL returned.");
  return url;
}
