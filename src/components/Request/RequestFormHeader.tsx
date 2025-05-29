import { Send, Loader2, Save, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { HTTP_METHODS } from "@/lib/constants";

import { UseFormReturn } from "react-hook-form";

type RequestFormHeaderProps = {
  sendForm: UseFormReturn<any>;
  sendMutation: {
    isPending: boolean;
  };
  onCancelRequest: () => void;
  setIsSaveModalOpen: (open: boolean) => void;
  collections: any[];
};

export default function RequestFormHeader({
  sendForm,
  sendMutation,
  onCancelRequest,
  setIsSaveModalOpen,
  collections,
}: RequestFormHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch">
      <div className="flex-shrink-0 w-full sm:w-32 md:w-36">
        <select
          {...sendForm.register("method")}
          className="w-full h-full rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-medium shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-300 ease-in-out appearance-none cursor-pointer pr-8 sm:pr-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.5rem center",
            backgroundSize: "1.2em",
          }}
          aria-label="Select HTTP method"
        >
          {HTTP_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </div>
      <Input
        {...sendForm.register("url")}
        placeholder="Enter URL (e.g., {{base_url}}/endpoint)"
        error={typeof sendForm.formState.errors.url?.message === "string" ? sendForm.formState.errors.url?.message : undefined}
        className="flex-1 text-sm sm:text-base py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-300 ease-in-out"
        aria-describedby={sendForm.formState.errors.url ? "url-error" : undefined}
      />
      <div className="flex flex-row gap-2 sm:gap-3">
        <Button
          type="submit"
          disabled={sendMutation.isPending}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition duration-300 ease-in-out shadow-md transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-1 sm:gap-2"
          aria-label="Send request"
        >
          {sendMutation.isPending ? (
            <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 animate-spin" />
          ) : (
            <Send className="h-4 sm:h-5 w-4 sm:w-5" />
          )}
          <span className="text-sm sm:text-base">
            {sendMutation.isPending ? "Sending..." : "Send"}
          </span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancelRequest}
          disabled={!sendMutation.isPending}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition duration-300 ease-in-out dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700 flex items-center justify-center gap-1 sm:gap-2"
          aria-label="Cancel request"
        >
          <XCircle className="h-4 sm:h-5 w-4 sm:w-5" />
          <span className="text-sm sm:text-base">Cancel</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setIsSaveModalOpen(true)}
          disabled={collections.length === 0}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition duration-300 ease-in-out dark:bg-purple-800 dark:text-purple-100 dark:hover:bg-purple-700 flex items-center justify-center gap-1 sm:gap-2"
          aria-label="Save request"
        >
          <Save className="h-4 sm:h-5 w-4 sm:w-5" />
          <span className="text-sm sm:text-base">Save</span>
        </Button>
      </div>
    </div>
  );
}