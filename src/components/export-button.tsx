"use client";

import { CalendarArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { generateIcsContent } from "@/lib/ics-export";

export function ExportButton() {
  const { data: tasks = [] } = useTasks({});

  function handleExport() {
    try {
      const result = generateIcsContent(tasks);

      if (result === null) {
        toast("No tasks to export");
        return;
      }

      const blob = new Blob([result.content], { type: "text/calendar" });
      const filename = `tapo1-tasks-${new Date().toISOString().slice(0, 10)}.ics`;

      const isSafariStandalone =
        (navigator as Navigator & { standalone?: boolean }).standalone === true;

      if (isSafariStandalone && navigator.share) {
        const file = new File([blob], filename, { type: "text/calendar" });
        if (navigator.canShare?.({ files: [file] })) {
          toast.success(`Exported ${result.count} tasks to calendar`);
          navigator
            .share({ files: [file], title: filename })
            .catch((err: Error) => {
              if (err.name !== "AbortError") {
                toast.error("Export failed. Try again.");
              }
            });
        } else {
          toast.error("Export failed. Try again.");
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${result.count} tasks to calendar`);
      }
    } catch {
      toast.error("Export failed. Try again.");
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleExport}
      aria-label="Export to calendar"
      title="Export to calendar"
    >
      <CalendarArrowDown className="size-4" />
    </Button>
  );
}
