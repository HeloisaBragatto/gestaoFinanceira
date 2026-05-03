import { Status } from "@/lib/use-imports";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface FeedbackStatusProps {
  status: Status;
  mensagem: string;
}

export function FeedbackStatus({ status, mensagem }: FeedbackStatusProps) {
  if (status === "idle" || !mensagem) return null;

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium ${
        status === "loading"
          ? "bg-blue-50 text-blue-700 border border-blue-100"
          : status === "success"
            ? "bg-green-50 text-green-700 border border-green-100"
            : "bg-red-50 text-red-600 border border-red-100"
      }`}
    >
      {status === "loading" && (
        <Loader2 size={15} className="animate-spin shrink-0" />
      )}
      {status === "success" && <CheckCircle size={15} className="shrink-0" />}
      {status === "error" && <AlertCircle size={15} className="shrink-0" />}
      {mensagem}
    </div>
  );
}
