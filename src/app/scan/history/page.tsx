import HistoryTable from "@/components/scanner/HistoryTable";

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <HistoryTable />
    </div>
  );
}