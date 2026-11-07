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
      <header className="border-b border-[#d8e8f2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/ped-expert-mentory" className="inline-flex items-center gap-3 text-xl font-black tracking-tight text-[#006da7]"><img src="/mentory-brand-symbol.svg" alt="" aria-hidden="true" className="h-12 w-12 object-contain" /><span>Ped Expert Mentory</span></Link>
          <Link href="/mentory/login" className="rounded-lg bg-[#006da7] px-5 py-3 text-sm font-bold text-white hover:bg-[#005781]">Acessar o sistema</Link>
        </div>
      </header>
      <section className="bg-gradient-to-br from-[#eaf7ff] to-[#cfe9f8]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#0877aa]">Mentoria médica em urgência pediátrica</p>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight md:text-6xl">Ped Expert Mentory</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#45667c]">Uma jornada de seis meses para médicos que desejam aprofundar conhecimentos e desenvolver o raciocínio clínico diante dos desafios dos plantões pediátricos.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/mentory/login" className="rounded-lg bg-[#006da7] px-7 py-4 font-bold text-white hover:bg-[#005781]">Entrar na plataforma →</Link>
              <a href="#programa" className="rounded-lg border border-[#b5d4e7] bg-white px-7 py-4 font-bold text-[#006da7]">Conhecer a mentoria</a>
            </div>
          </div>
          <div className="rounded-3xl bg-[#0c395a] p-7 text-white shadow-xl md:p-9" style={{ color: "#ffffff" }}>
            <div className="mb-6 flex items-center gap-5"><img src="/images/dr-aristoteles-pires.png" alt="Retrato do Dr. Aristóteles Pires" className="h-28 w-28 shrink-0 rounded-2xl border-2 border-white/20 bg-white object-cover shadow-lg sm:h-36 sm:w-36" /><div><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#a9dcf5" }}>Seu mentor</p><p className="mt-2 text-xl font-extrabold leading-snug" style={{ color: "#ffffff" }}>Dr. Aristóteles Pires</p></div></div>
            <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl" style={{ color: "#ffffff" }}>Experiência para orientar o aprendizado.</h2>
            <p className="mt-5 text-base font-bold leading-7" style={{ color: "#ffffff" }}>+28 anos de experiência | MD, PhD | Mentor de carreira médica</p><p className="mt-3 text-sm leading-6" style={{ color: "#d0e4ef" }}>Especialista em Pediatria, com doutorado em Pediatria e Telemedicina.</p>
            <div className="mt-8 border-t border-white/20 pt-6 text-sm" style={{ color: "#d0e4ef" }}>Encontros coletivos ao vivo todas as semanas.</div>
          </div>
        </div>
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
