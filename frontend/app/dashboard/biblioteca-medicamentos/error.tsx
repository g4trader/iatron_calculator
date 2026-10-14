"use client";
export default function ClinicalResourceError({ reset }: { reset: () => void }) {
  return <section className="p-8" role="alert"><h2>Não foi possível carregar o catálogo</h2><p>Tente novamente. Os outros módulos permanecem independentes deste recurso.</p><button className="min-h-12 px-4 underline" onClick={reset}>Tentar novamente</button></section>;
}
