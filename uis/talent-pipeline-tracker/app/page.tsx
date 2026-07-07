import { Suspense } from "react";

import { CandidateListPage } from "@/components/candidate-list-page";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <CandidateListPage />
    </Suspense>
  );
}
