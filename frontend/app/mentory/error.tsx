"use client";
export default function Error({ reset }: { reset: () => void }) { return <main className="container section"><h1>Não foi possível carregar a Mentory.</h1><p>Seus dados permanecem salvos. Tente novamente.</p><button className="btn btn-primary" onClick={reset}>Tentar novamente</button></main>; }
