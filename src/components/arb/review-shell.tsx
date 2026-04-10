import Link from "next/link";
import type { ReactNode } from "react";
import type { ArbReviewStep, ArbReviewSummary } from "@/arb/types";

export function ArbReviewShell(props: {
  review: ArbReviewSummary;
  steps: ArbReviewStep[];
  activeStep: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { review, steps, activeStep, title, description, children } = props;

  return (
    <main>
      <section>
        <h1>{title}</h1>
        <p>{description}</p>
        <ul>
          {steps.map((step) => (
            <li key={step.key}>
              <Link href={step.href}>{step.key === activeStep ? `[${step.label}]` : step.label}</Link>
            </li>
          ))}
        </ul>
        <ul>
          <li>Project: {review.projectName}</li>
          <li>Review ID: {review.reviewId}</li>
          <li>Workflow State: {review.workflowState}</li>
          <li>Evidence State: {review.evidenceReadinessState}</li>
          <li>Recommendation: {review.recommendation}</li>
          <li>Score: {review.overallScore ?? "TBD"}</li>
        </ul>
      </section>
      <section>{children}</section>
    </main>
  );
}
