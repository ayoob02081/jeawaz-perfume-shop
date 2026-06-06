"use client";
import AppImage from "@/components/AppImage";
import app from "@/services/httpClient";
import { CloudArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import toast from "react-hot-toast";

export default function RHFUploadFile({
  label,
  onChange,
  value,
  onRemove,
  uploadUrl = "/upload/image",
  deleteUrl = "/upload/delete",
}) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("حجم فایل نباید بیشتر از ۲ مگابایت باشد");
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      const { data } = await app.post(uploadUrl, formData);

      onChange(data.url);
      toast.success("عکس با موفقیت آپلود شد");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "خطا در آپلود عکس");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!value) return;

    try {
      if (value.startsWith("/uploads/")) {
        await app.delete(deleteUrl, {
          data: { url: value },
        });
      }
      toast.success("فایل با موفقیت حذف شد");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("خطا در حذف فایل از سرور");
    } finally {
      if (onRemove) onRemove();
      else onChange("");
    }
  };

  return (
    <div className="relative group">
      <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-stroke-300 rounded-2xl cursor-pointer hover:bg-stroke-0 transition-all overflow-hidden select-none">
        {value ? (
          <AppImage
            src={value}
            alt="uploaded-file"
            priority={true}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-stroke-400">
            {isUploading ? (
              <span className="loading loading-spinner loading-sm text-primary"></span>
            ) : (
              <>
                <CloudArrowUpIcon className="size-7 text-stroke-600 group-hover:text-primary transition-colors" />
                <span className="text-[10px] mt-1 text-stroke-600 group-hover:text-primary font-medium">
                  {label}
                </span>
              </>
            )}
          </div>
        )}
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/*"
          disabled={isUploading}
        />
      </label>

      {value && (
        <button
          type="button"
          onClick={handleRemoveFile}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-lg p-1 shadow-lg transition-transform hover:scale-110 z-10"
        >
          <XMarkIcon className="size-4" />
        </button>
      )}
    </div>
  );
}
