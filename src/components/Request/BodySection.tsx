import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import { XCircle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { sendRequestSchema } from "@/validators/request.schema";

type SendRequestFormData = z.infer<typeof sendRequestSchema>;

interface BodySectionProps {
  sendForm: UseFormReturn<SendRequestFormData>;
}

export default function BodySection({ sendForm }: BodySectionProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-inner border border-gray-100 dark:border-gray-700">
      <label className="block text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
        Body
      </label>
      <AceEditor
        mode="json"
        theme="monokai"
        name="body-editor"
        onChange={(value) => sendForm.setValue("body", value, { shouldValidate: true })}
        value={sendForm.watch("body") || ""}
        fontSize={14}
        width="100%"
        height="160px"
        showPrintMargin={false}
        showGutter={true}
        highlightActiveLine={true}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          tabSize: 2,
        }}
        className="rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
        aria-label="Request body JSON editor"
        aria-describedby={sendForm.formState.errors.body ? "body-error" : undefined}
      />
      {sendForm.formState.errors.body && (
        <p className="text-red-600 dark:text-red-400 text-sm mt-1 sm:mt-2 flex items-center gap-1" id="body-error">
          <XCircle className="h-4 w-4" /> {sendForm.formState.errors.body.message}
        </p>
      )}
    </div>
  );
}