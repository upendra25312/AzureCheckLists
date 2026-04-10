import type { ReactNode } from "react";

export function ArbPlaceholderPage(props: {
  intro: string;
  bullets: string[];
  footer?: ReactNode;
}) {
  const { intro, bullets, footer } = props;

  return (
    <div>
      <p>{intro}</p>
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      {footer ? <div>{footer}</div> : null}
    </div>
  );
}
