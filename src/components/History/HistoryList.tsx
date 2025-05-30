"use client"
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HistoryEntry } from "@/types";
import { HistoryItem } from "./HistoryItem";

interface HistoryListProps {
  history: HistoryEntry[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export const HistoryList: React.FC<HistoryListProps> = React.memo(({ history, expandedId, onToggle, onDelete, deletingId }) => {
  return (
    <motion.ul className="space-y-4" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
      <AnimatePresence>
        {history.map((entry) => (
          <HistoryItem
            key={entry._id}
            entry={entry}
            expandedId={expandedId}
            onToggle={onToggle}
            onDelete={onDelete}
            isDeleting={deletingId === entry._id}
          />
        ))}
      </AnimatePresence>
    </motion.ul>
  );
});
HistoryList.displayName = "HistoryList";

