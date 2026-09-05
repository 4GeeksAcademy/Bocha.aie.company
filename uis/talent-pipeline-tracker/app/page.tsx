import { Suspense } from "react";

import { IncidentManagerPage } from "@/components/incident-manager-page";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <IncidentManagerPage />
    </Suspense>
  );
}
