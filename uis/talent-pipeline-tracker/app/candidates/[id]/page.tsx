import { Suspense } from "react";

import { CandidateDetailPage } from "@/components/candidate-detail-page";

type CandidateDetailRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CandidateDetailRoute({
  params,
}: CandidateDetailRouteProps) {
  const { id } = await params;

  return (
    <Suspense fallback={null}>
      <CandidateDetailPage candidateId={id} />
    </Suspense>
  );
}