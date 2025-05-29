import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Plus, Trash2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { SendRequestFormData } from "../forms/RequestForm";
import { ApiRequest } from "@/stores/requestStore";


interface HeadersSectionProps {
  request: ApiRequest;
  setRequest: (request: Partial<ApiRequest>) => void;
  sendForm: UseFormReturn<SendRequestFormData>;
}

export default function HeadersSection({ request, setRequest, sendForm }: HeadersSectionProps) {
  const addHeader = () => {
    setRequest({ headers: [...(request.headers || []), { key: "", value: "" }] });
  };

  const removeHeader = (indexToRemove: number) => {
    const updatedHeaders = (request.headers || []).filter((_, index) => index !== indexToRemove);
    setRequest({ headers: updatedHeaders });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-inner border border-gray-100 dark:border-gray-700 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
      <label className="block text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
        Headers
      </label>
      <div className="space-y-2 sm:space-y-3">
        {request.headers?.map((_, index) => (
          <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
            <Input
              {...sendForm.register(`headers.${index}.key`)}
              placeholder="Key"
              className="flex-1 text-sm sm:text-base py-2 px-3 sm:px-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition duration-200"
              aria-label={`Header ${index + 1} key`}
            />
            <Input
              {...sendForm.register(`headers.${index}.value`)}
              placeholder="Value"
              className="flex-1 text-sm sm:text-base py-2 px-3 sm:px-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition duration-200"
              aria-label={`Header ${index + 1} value`}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => removeHeader(index)}
              className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition duration-200 ease-in-out rounded-lg"
              aria-label={`Remove header ${index + 1}`}
            >
              <Trash2 className="h-4 sm:h-5 w-4 sm:w-5" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={addHeader}
        className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition duration-300 ease-in-out dark:bg-indigo-800 dark:text-indigo-100 dark:hover:bg-indigo-700 flex items-center justify-center gap-1 sm:gap-2"
        aria-label="Add new header"
      >
        <Plus className="h-4 sm:h-5 w-4 sm:w-5" />
        <span className="text-sm sm:text-base">Add Header</span>
      </Button>
    </div>
  );
}