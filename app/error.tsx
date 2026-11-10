'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="login-page"><div className="login-card"><h1>Unable to load the page</h1><p>Please try again. If this continues, contact your university administrator.</p><button className="button primary" onClick={reset}>Try Again</button></div></main>;
}
