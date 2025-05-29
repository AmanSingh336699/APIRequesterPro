import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Loader2, Save, XCircle, Info } from "lucide-react";

interface SaveRequestModalProps {
  isSaveModalOpen: boolean;
  setIsSaveModalOpen: (open: boolean) => void;
  saveForm: any;
  onSaveSubmit: (data: any) => void;
  collections: Array<{ _id: string; name: string }>;
  collectionsLoading: boolean;
  saveMutation: { isPending: boolean };
}

export default function SaveRequestModal({
  isSaveModalOpen,
  setIsSaveModalOpen,
  saveForm,
  onSaveSubmit,
  collections,
  collectionsLoading,
  saveMutation,
}: SaveRequestModalProps) {
  return (
    isSaveModalOpen && (
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl sm:shadow-3xl p-4 sm:p-6 max-w-[90vw] sm:max-w-md w-full max-h-[80vh] overflow-y-auto transform scale-95 opacity-0 animate-scale-in ring-1 ring-gray-100 dark:ring-gray-700">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center">
            Save Request
          </h3>
          <form onSubmit={saveForm.handleSubmit(onSaveSubmit)} className="space-y-4 sm:space-y-6">
            {collectionsLoading ? (
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm sm:text-base flex items-center justify-center gap-1 sm:gap-2">
                <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 animate-spin" /> Loading collections...
              </p>
            ) : collections.length === 0 ? (
              <p className="text-red-600 dark:text-red-400 text-sm sm:text-base text-center p-3 sm:p-4 border border-red-300 dark:border-red-700 rounded-lg sm:rounded-xl bg-red-50 dark:bg-red-900 flex items-center justify-center gap-1 sm:gap-2">
                <Info className="h-4 sm:h-5 w-4 sm:w-5" />
                No collections found. Please create a collection in the &quot;Collections&quot; tab first.
              </p>
            ) : (
              <div className="relative">
                <select
                  {...saveForm.register("collectionId")}
                  className="w-full rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-300 ease-in-out appearance-none cursor-pointer pr-8 sm:pr-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.5rem center",
                    backgroundSize: "1.2em",
                  }}
                  aria-label="Select collection"
                  aria-describedby={saveForm.formState.errors.collectionId ? "collection-error" : undefined}
                >
                  <option value="">Select Collection</option>
                  {collections.map((col) => (
                    <option key={col._id} value={col._id}>
                      {col.name}
                    </option>
                  ))}
                </select>
                {saveForm.formState.errors.collectionId && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1 sm:mt-2 flex items-center gap-1" id="collection-error">
                    <XCircle className="h-4 w-4" /> {saveForm.formState.errors.collectionId.message}
                  </p>
                )}
              </div>
            )}
            <Input
              {...saveForm.register("name")}
              placeholder="Request Name"
              error={saveForm.formState.errors.name?.message}
              className="text-sm sm:text-base py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-300 ease-in-out"
              aria-label="Request name"
              aria-describedby={saveForm.formState.errors.name ? "name-error" : undefined}
            />
            <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition duration-300 ease-in-out dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                aria-label="Cancel save"
              >
                <span className="text-sm sm:text-base">Cancel</span>
              </Button>
              <Button
                type="submit"
                disabled={collections.length === 0 || saveMutation.isPending}
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition duration-300 ease-in-out shadow-md transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-1 sm:gap-2"
                aria-label="Save request"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 animate-spin" />
                ) : (
                  <Save className="h-4 sm:h-5 w-4 sm:w-5" />
                )}
                <span className="text-sm sm:text-base">{saveMutation.isPending ? "Saving..." : "Save"}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  );
}