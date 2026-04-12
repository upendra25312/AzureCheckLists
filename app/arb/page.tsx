import { ArbReviewLibrary } from "@/components/arb/review-library";

export default function ArbLandingPage() {
  return (
    <main className="arb-page">

      {/* Page header */}
      <section className="arb-page-header">
        <h1 className="arb-page-title">AI Architecture Review</h1>
        <p className="arb-page-sub">
          Upload your design documents and get findings checked against all Azure frameworks.
        </p>
      </section>

      {/* Create form + review list */}
      <ArbReviewLibrary />

      {/* How it works — below fold, secondary context */}
      <section className="arb-how-band">
        <h2 className="arb-how-title">How it works</h2>
        <ol className="arb-how-steps">
          <li>
            <span>01</span>
            <div>
              <strong>Upload review material</strong>
              <p>Bring the design pack, diagrams, and supporting material into the review.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Run AI agent review</strong>
              <p>
                The Azure ARB Agent reads your documents and checks them against WAF, CAF, ALZ,
                HA/DR, Security, Networking, and Monitoring using live Microsoft Learn docs.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Review findings and scorecard</strong>
              <p>Every finding is grounded in evidence from your documents and linked to a Microsoft Learn URL.</p>
            </div>
          </li>
          <li>
            <span>04</span>
            <div>
              <strong>Human sign-off and export</strong>
              <p>
                AI recommends the posture. Reviewers record the final decision and export the board pack
                as CSV, HTML, or Markdown.
              </p>
            </div>
          </li>
        </ol>
      </section>

    </main>
  );
}
