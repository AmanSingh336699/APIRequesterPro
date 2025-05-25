import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="mb-4">
      {label && <label className="block mb-1">{label}</label>}
      <input className={`input ${className}`} {...props} />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}