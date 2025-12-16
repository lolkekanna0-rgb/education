"use client";

import { useState, DragEvent } from "react";
import Image from "next/image";
import s from "./UploadPhoto.module.scss";

type UploadPhotoProps = {
  label?: string;
  multiple?: boolean;
  accept?: string;
  onFilesSelected?: (files: File[]) => void;
};

export default function UploadPhoto({
  label = "Загрузите фото*",
  multiple = false,
  accept = "image/png, image/jpeg",
  onFilesSelected,
}: UploadPhotoProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const isAllowedType = (candidate: string, file: File) => {
    if (!candidate) return true;
    if (candidate === "*/*") return true;
    if (candidate.endsWith("/*")) {
      const prefix = candidate.replace("/*", "");
      return file.type.startsWith(prefix);
    }
    if (candidate.startsWith(".")) {
      return file.name.toLowerCase().endsWith(candidate.toLowerCase());
    }
    return file.type === candidate;
  };

  const validateAndCollect = (files: FileList | File[]): File[] => {
    const valid: File[] = [];
    const allowed = accept.split(",").map((t) => t.trim()).filter(Boolean);
    for (const f of Array.from(files)) {
      if (allowed.length && !allowed.some((candidate) => isAllowedType(candidate, f))) {
        setError("Неверный тип файла");
        continue;
      }
      if (f.size > 20 * 1024 * 1024) {
        setError("Файл не должен превышать 20MB");
        continue;
      }
      valid.push(f);
    }
    if (valid.length) setError("");
    return valid;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      const files = validateAndCollect(e.dataTransfer.files);
      if (files.length) {
        setFile(files[0]);
        onFilesSelected?.(multiple ? files : [files[0]]);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const files = validateAndCollect(e.target.files);
      if (files.length) {
        setFile(files[0]);
        onFilesSelected?.(multiple ? files : [files[0]]);
      }
    }
  };

  return (
    <div className={s.upload}>
      <label className={s.label}>{label}</label>

      <div
        className={s.dropzone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {file ? (
          <div className={s.preview}>
            <Image
              src={URL.createObjectURL(file)}
              alt="preview"
              width={100}
              height={100}
            />
            <p>{file.name}</p>
          </div>
        ) : (
          <>
            <Image
              src="/photo.png"
              alt="icon"
              width={40}
              height={40}
            />
            <p className={s.text}>
              <span className={s.red}>Загрузите файл</span> или перенесите в эту область
            </p>
            <p className={s.subtext}>PNG, HEX, JPG не более 10MB</p>
          </>
        )}

        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className={s.input}
          onChange={handleChange}
        />
      </div>

      {error && <p className={s.error}>{error}</p>}
    </div>
  );
}
