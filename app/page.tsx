import Dashboard from "@/components/Dashboard";
import dataset from "./data/dataset.json";
import type { Dataset } from "./lib/types";

export default function Page() {
  return <Dashboard dataset={dataset as Dataset} />;
}
