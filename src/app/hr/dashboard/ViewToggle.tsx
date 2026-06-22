"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function ViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "worker";

  const toggle = (v: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "worker") {
      params.delete("view");
    } else {
      params.set("view", v);
    }
    const qs = params.toString();
    router.push("/hr/dashboard" + (qs ? "?" + qs : ""));
  };

  return (
    <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden text-sm">
      <button
        onClick={() => toggle("worker")}
        className={`px-3 py-1.5 font-medium transition-colors ${
          view === "worker" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        Por trabalhador
      </button>
      <button
        onClick={() => toggle("project")}
        className={`px-3 py-1.5 font-medium transition-colors ${
          view === "project" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        Por obra
      </button>
    </div>
  );
}
