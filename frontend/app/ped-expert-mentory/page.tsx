import Link from "next/link";

export const metadata = {
  title: "Ped Expert Mentory | Mentoria em Urgência Pediátrica",
  description: "Conheça a Ped Expert Mentory, mentoria de seis meses em urgência pediátrica com o Dr. Aristóteles Pires. Acesse o sistema pela área de login.",
};

const items = [
  { title: "Encontros semanais ao vivo", description: "Discussões educacionais coletivas com o Dr. Aristóteles Pires durante os seis meses de mentoria." },
  { title: "Conteúdo para rever", description: "Aulas gravadas e materiais de apoio para aprofundar o aprendizado ao longo do ciclo." },
  { title: "Comunidade Fechada Iatron", description: "Acesso à comunidade premium por seis meses, com espaço para trocas profissionais." },
  { title: "Folha PCR", description: "Acesso por doze meses ao recurso educacional complementar." },
];

export default function PedExpertMentoryPage() {
  return (
    <main className="min-h-screen bg-[#f3f9fd] text-[#12344d]">
      <header className="border-b border-[#0a4260] bg-[#052843]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/ped-expert-mentory" className="inline-flex items-center gap-3 text-xl font-black tracking-tight text-white"><img src="/mentory-brand-symbol.svg" alt="" aria-hidden="true" className="h-12 w-12 object-contain" /><span>Ped Expert Mentory</span></Link>
          <Link href="/mentory/login" className="rounded-full bg-[#0be0e0] px-5 py-3 text-sm font-bold text-[#052843] hover:bg-[#4cf0ed]">Acessar o sistema</Link>
        </div>
      </header>
      <section className="relative overflow-hidden bg-[#052843] text-white" style={{background:"radial-gradient(ellipse at 75% 52%, #0877a0 0%, #063b61 33%, #05243d 73%)"}}>
        <div className="relative mx-auto grid max-w-6xl gap-4 px-5 pt-12 md:min-h-[620px] md:grid-cols-[1.1fr_.9fr] md:items-center md:pt-14">
          <div className="relative z-10 pb-10 md:pb-24">
            <p className="text-xs font-bold uppercase tracking-[.23em] text-[#17e1e4]">Mentoria em pediatria</p>
            <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[62px]">Decisões clínicas mais seguras, <span className="text-[#13e4e3]">na prática.</span></h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#e0eef6]">Mentoria para médicos que buscam atualização, raciocínio clínico e mais confiança na condução dos casos do dia a dia.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/mentory/login" className="rounded-full bg-[#0be0e0] px-6 py-4 text-sm font-extrabold text-[#062c47] shadow-lg hover:bg-[#4cf0ed]">Quero participar da mentoria →</Link><a href="#programa" className="rounded-full border border-white/70 px-6 py-4 text-sm font-bold text-white hover:bg-white/10">Conheça o programa</a></div>
          </div>
          <div className="relative flex min-h-[350px] items-end justify-center self-stretch md:min-h-[580px]"><div className="absolute inset-x-4 bottom-10 top-14 rotate-[23deg] rounded-[48%] bg-gradient-to-tr from-[#03548d] via-[#048db7] to-[#00e1d8] opacity-75 blur-[1px]"/><img src="/images/dr-aristoteles-pires.png" alt="Dr. Aristóteles Pires" className="relative z-10 h-[390px] w-full rounded-t-[45%] object-cover object-top [mask-image:linear-gradient(to_bottom,black_72%,transparent_100%)] md:absolute md:bottom-0 md:h-[570px] md:rounded-none" /></div>
        </div>
        <div className="relative z-20 border-t border-white/10 bg-[#062e4b]/80"><div className="mx-auto grid max-w-6xl grid-cols-2 gap-5 px-5 py-7 text-sm font-semibold text-white md:grid-cols-4"><span>✧ &nbsp; Mentoria com especialistas</span><span>▤ &nbsp; Conteúdo prático e atualizado</span><span>◎ &nbsp; Discussão de casos reais</span><span>✓ &nbsp; Mais segurança na prática clínica</span></div></div>
      </section>
      <section id="programa" className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-xs font-extrabold uppercase tracking-widest text-[#0877aa]">O programa</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-black md:text-4xl">Formação complementar com acompanhamento e continuidade.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[#526d80]">Voltada especialmente a médicos recém-formados e em início de carreira, a mentoria combina encontros, conteúdo e recursos de apoio.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {items.map((item) => <article key={item.title} className="rounded-2xl border border-[#dbe8f1] bg-white p-7 shadow-sm"><h3 className="text-xl font-bold">{item.title}</h3><p className="mt-3 leading-7 text-[#526d80]">{item.description}</p></article>)}
        </div>
      </section>
      <section className="bg-[#0c395a] px-5 py-16 text-center text-white" style={{ color: "#ffffff" }}>
        <h2 className="text-3xl font-black" style={{ color: "#ffffff" }}>Já faz parte da Ped Expert Mentory?</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7" style={{ color: "#d0e4ef" }}>Entre com suas credenciais na tela de login do sistema para acessar os recursos disponíveis na sua conta.</p>
        <Link href="/mentory/login" className="mt-8 inline-block rounded-lg bg-white px-8 py-4 font-bold text-[#006da7]">Acessar tela de login →</Link>
      </section>
      <footer className="bg-[#082a43] px-5 py-7 text-center text-xs text-[#bdd5e3]">© Ped Expert Mentory · PEDIATRON · Conteúdo educacional; não substitui supervisão clínica ou atendimento assistencial.</footer>
    </main>
  );
}
