import Link from "next/link";
import { AlertTriangle, FileText, ShieldAlert } from "lucide-react";
import { sameMedication, sourceText, type ClinicalCatalog, type ClinicalEntry } from "@/lib/clinical-resources";

export function ReviewBadge() {
  return <span className="cr-badge"><ShieldAlert aria-hidden="true" />Pendente de validação</span>;
}
export function DocumentaryNotice() {
  return <div className="cr-notice"><AlertTriangle aria-hidden="true" /><p><strong>Consulta documental · conteúdo não validado.</strong> Os textos abaixo são transcrições da fonte, não recomendações de administração. Cálculos e prescrições não estão disponíveis.</p></div>;
}

const medicationFields = [
  ["dose", "Dose habitual original"], ["interval", "Intervalo"], ["maximumDose", "Dose máxima"],
  ["route", "Via"], ["preparation", "Preparo / diluição"], ["mnemonic", "Macete original"], ["warnings", "Alertas / restrições"], ["reference", "Referência declarada na fonte"],
];
const infusionFields = [
  ["dose", "Faixa de dose original"], ["formula", "Fórmula textual original · volume/24h"],
  ["dilution", "Diluição textual original"], ["concentration", "Concentração textual original"], ["mnemonic", "Macete textual original · ml/h"],
];

export function DocumentDetail({ entry, catalog, infusion = false, heading = "h2" }: {
  entry: ClinicalEntry; catalog: ClinicalCatalog; infusion?: boolean; heading?: "h1" | "h2";
}) {
  const Heading = heading;
  const source = catalog.sources.find(s => s.id === entry.sourceId)!;
  const peers = infusion ? [] : sameMedication(catalog.entries, entry);
  const issues = catalog.issues.filter(i => i.entryId === entry.id && i.code !== "HOMOLOGATION_REQUIRED" && i.code !== "MISSING_SOURCE_FIELDS");
  const fields = infusion ? infusionFields : medicationFields;
  return <article className="cr-detail" aria-label={`Ficha documental de ${entry.raw.name?.trim()}`}>
    <header className="cr-detail-header">
      <p className="cr-eyebrow">{infusion ? "Drogas de choque / infusão contínua" : entry.raw.category}</p>
      <Heading tabIndex={-1} className="cr-detail-title">{entry.raw.name}</Heading>
      <p className="cr-presentation">{sourceText(entry.raw.presentation)}</p>
      <ReviewBadge />
      {!infusion && <p className="cr-route">Via: <strong>{sourceText(entry.raw.route)}</strong></p>}
    </header>
    <DocumentaryNotice />
    {peers.length > 1 && <nav className="cr-presentations" aria-label="Apresentações deste medicamento">
      <h3>Apresentações na fonte ({peers.length})</h3>
      {peers.map(peer => <Link key={peer.id} href={`/dashboard/biblioteca-medicamentos/${peer.id}`} aria-current={peer.id === entry.id ? "page" : undefined}>{sourceText(peer.raw.presentation)}{peers.filter(p => p.search.presentation === peer.search.presentation).length > 1 ? ` · ${sourceText(peer.raw.route)} · ${peer.raw.category}` : ""}</Link>)}
    </nav>}
    {infusion && entry.search.name === "vasopressina" && <p className="cr-unit-alert"><strong>Unidades diferentes: vasopressina.</strong> A fonte usa ui, mui e mUI. Não aplicar a fórmula de mcg/kg/min nem converter unidades sem revisão médica.</p>}
    <dl className="cr-fields">
      {fields.map(([field, label]) => <div key={field}>
        <dt>{label}<span className="cr-cell">{entry.sheet} · {entry.cells[field]}</span></dt>
        <dd>{sourceText(entry.raw[field])}</dd>
      </div>)}
    </dl>
    {issues.length > 0 && <section className="cr-issues" aria-label="Pendências de revisão">
      <h3><AlertTriangle aria-hidden="true" />Pendências de revisão</h3>
      <ul>{issues.map(issue => <li key={issue.id}><strong>{issue.sheet} · {issue.cells.join(", ")}: </strong>{issue.message}</li>)}</ul>
    </section>}
    <details className="cr-provenance">
      <summary><FileText aria-hidden="true" />Fonte e rastreabilidade · linha {entry.row}</summary>
      <dl>
        <div><dt>Arquivo original</dt><dd>{source.file}</dd></div>
        <div><dt>Aba / linha</dt><dd>{entry.sheet} / {entry.row}</dd></div>
        <div><dt>Versão da fonte</dt><dd>{entry.version}</dd></div>
        <div><dt>SHA-256</dt><dd className="cr-hash">{entry.sourceHash}</dd></div>
        <div><dt>Data da importação</dt><dd>{new Date(source.importedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília)</dd></div>
        <div><dt>Revisores / homologação</dt><dd>Nenhum revisor registrado. Homologação não documentada.</dd></div>
      </dl>
      <details><summary>Texto bruto de cada célula</summary><dl>{Object.entries(entry.raw).map(([field, text]) => <div key={field}><dt>{entry.cells[field]} · {source.columns[field]}</dt><dd>{text === null || text === "" ? "Célula vazia" : text}</dd></div>)}</dl></details>
    </details>
    <p className="cr-footnote">Este registro não substitui o catálogo nem os protocolos dos calculadores existentes. A fonte bibliográfica não é uma homologação institucional.</p>
  </article>;
}
