import Link from 'next/link';

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-6 inline-block">
        ← Voltar para o início
      </Link>
      
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Política de Privacidade (LGPD)</h1>
      
      <div className="space-y-4 text-zinc-300 text-sm md:text-base leading-relaxed">
        <p>
          Esta aplicação foi desenvolvida como parte de um projeto acadêmico do curso de Engenharia de Computação. Comprometemo-nos com a transparência e a segurança no tratamento dos dados pessoais de nossos usuários, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">1. Coleta de Dados</h2>
        <p>
          Coletamos dados cadastrais (como nome e e-mail) para autenticação do usuário através do serviço Supabase, além dos registros das transações financeiras inseridas voluntariamente na plataforma.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">2. Uso e Armazenamento</h2>
        <p>
          Os dados armazenados são utilizados estritamente para o funcionamento e exibição dos recursos de gestão financeira dentro do próprio sistema. Nenhuma informação é compartilhada com terceiros ou vendida.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">3. Seus Direitos</h2>
        <p>
          O usuário possui o direito de consultar, alterar ou solicitar a exclusão definitiva de seus dados de nossa base a qualquer momento durante o período de testes do projeto.
        </p>
      </div>
    </main>
  );
}
