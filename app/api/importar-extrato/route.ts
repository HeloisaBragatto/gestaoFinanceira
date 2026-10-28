import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buscarTodosExtratos } from "@/lib/finance/consulta";
import { FILTROS_INICIAIS, isDataValida } from "@/lib/finance/filtros";
import { removerDuplicadas } from "@/lib/finance/duplicadas";

type Transacao = {
  tipo: "pagamento" | "recebimento";
  descricao: string;
  categoria: string;
  valor: number;
  data_transacao: string;
};

// Extração de texto do PDF
async function extrairTextoPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const fn = pdfParse.default ?? pdfParse;
  const data = await fn(buffer);
  return data.text ?? "";
}

// Categorização
function inferirCategoria(desc: string): string {
  const d = desc.toLowerCase();

  // RECEITA
  if (
    d.match(
      /salário|salario|holerite|freelance|pagamento recebido|renda|bonus|bônus|comissão|comissao/
    )
  )
    return "salário";

  // ALIMENTAÇÃO
  if (
    d.match(
      /mercado|supermercado|padaria|açougue|hortifruti|ifood|rappi|uber eats|burger|pizza|restaurante|lanchonete|café|cafe|bar/
    )
  )
    return "alimentação";

  // TRANSPORTE
  if (
    d.match(
      /uber|99|taxi|posto|combustível|combustivel|gasolina|etanol|diesel|estacionamento|ônibus|onibus|metrô|metro|passagem|transporte/
    )
  )
    return "transporte";

  // SAÚDE
  if (
    d.match(
      /farmácia|farmacia|hospital|médico|medico|consulta|exame|plano de saúde|unimed|drogaria|remédio|remedio/
    )
  )
    return "saúde";

  // LAZER
  if (
    d.match(
      /netflix|spotify|amazon|disney|youtube|prime|hbo|assinatura|ingresso|cinema|show|evento|viagem|hotel|airbnb/
    )
  )
    return "lazer";

  // MORADIA
  if (
    d.match(
      /aluguel|condomínio|condominio|iptu|energia|luz|água|agua|gás|gas|internet|telefone|celular|conta/
    )
  )
    return "moradia";

  // TRANSFERÊNCIAS
  if (d.match(/transferência|transferencia|pix|ted|doc|envio|recebido de/))
    return "transferência";

  // COMPRAS (GERAL)
  if (
    d.match(
      /shopping|loja|magazine|americanas|renner|zara|hm|marisa|compra|pedido/
    )
  )
    return "compras";

  // EDUCAÇÃO
  if (
    d.match(
      /faculdade|escola|curso|udemy|alura|mensalidade|matrícula|matricula|educação|educacao/
    )
  )
    return "educação";

  // SERVIÇOS FINANCEIROS
  if (d.match(/juros|taxa|tarifa|anuidade|banco|manutenção|manutencao|saque/))
    return "financeiro";

  // TECNOLOGIA / SOFTWARE
  if (
    d.match(
      /google|apple|microsoft|github|aws|azure|domínio|dominio|hosting|servidor/
    )
  )
    return "tecnologia";

  // TELECOM (mantive separado pra você poder mudar depois se quiser)
  if (d.match(/tim|claro|vivo|oi|sky/)) return "telecom";

  return "outro";
}

// ── Normaliza valor: "R$ 70,99" → 70.99 ──────────────────────
function normalizarValor(str: string): number | null {
  const match = str.match(/([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{2}))/);
  if (!match) return null;
  const valor = parseFloat(match[1].replace(/\./g, "").replace(",", "."));
  return isNaN(valor) || valor <= 0 ? null : valor;
}

// ── Normaliza data para YYYY-MM-DD ────────────────────────────
function normalizarData(str: string): string | null {
  // DD/MM/YYYY ou DD/MM/YY
  const m1 = str.match(/\b(\d{2})\/(\d{2})\/(\d{2,4})\b/);
  if (m1) {
    const [, dia, mes, anoRaw] = m1;
    const ano = anoRaw.length === 2 ? `20${anoRaw}` : anoRaw;
    return `${ano}-${mes}-${dia}`;
  }
  return null;
}

// Parser: comprovante de transação única (Inter, Nubank etc)

function parsearComprovante(texto: string): Transacao | null {
  const linhas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let valor: number | null = null;
  let data_transacao: string | null = null;
  let descricao = "";
  let tipo: "pagamento" | "recebimento" = "pagamento";
  let nomeRecebedor = "";
  let tipoTransacao = "";

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const linhaBaixa = linha.toLowerCase();

    // Tipo da transação
    if (
      linhaBaixa.includes("pix enviado") ||
      linhaBaixa.includes("transferência enviada") ||
      linhaBaixa.includes("pagamento realizado")
    ) {
      tipo = "pagamento";
      tipoTransacao = linha;
    }
    if (
      linhaBaixa.includes("pix recebido") ||
      linhaBaixa.includes("transferência recebida") ||
      linhaBaixa.includes("depósito")
    ) {
      tipo = "recebimento";
      tipoTransacao = linha;
    }

    // Valor: linha que começa com R$
    if (!valor && linha.startsWith("R$")) {
      valor = normalizarValor(linha);
    }

    // Data
    if (!data_transacao) {
      data_transacao = normalizarData(linha);
    }

    // Nome de quem recebeu (linha após "Nome" dentro de "Quem recebeu")
    if (linhaBaixa === "nome" && i + 1 < linhas.length && !nomeRecebedor) {
      nomeRecebedor = linhas[i + 1];
    }
  }

  if (!valor || !data_transacao) return null;

  descricao =
    tipoTransacao && nomeRecebedor
      ? `${tipoTransacao} - ${nomeRecebedor}`
      : tipoTransacao || nomeRecebedor || "Transação";

  return {
    tipo,
    descricao,
    categoria: inferirCategoria(descricao + " " + texto),
    valor,
    data_transacao,
  };
}

// Parser: extrato com múltiplas transações

function parsearExtrato(texto: string): Transacao[] {
  const linhas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const transacoes: Transacao[] = [];

  const reData = /\b(\d{2})\/(\d{2})\/(\d{2,4})\b/;
  const reValor = /\(?([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{2}))\)?[-]?/;

  for (const linha of linhas) {
    const matchData = linha.match(reData);
    const matchValor = linha.match(reValor);

    if (!matchData || !matchValor) continue;

    const [, dia, mes, anoRaw] = matchData;
    const ano = anoRaw.length === 2 ? `20${anoRaw}` : anoRaw;
    const data_transacao = `${ano}-${mes}-${dia}`;

    const valorStr = matchValor[1].replace(/\./g, "").replace(",", ".");
    const valor = parseFloat(valorStr);
    if (isNaN(valor) || valor <= 0) continue;

    const descricao = linha
      .replace(reData, "")
      .replace(reValor, "")
      .replace(/R\$\s*/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!descricao || descricao.length < 3) continue;

    const descLower = descricao.toLowerCase();
    const isRecebimento =
      descLower.match(
        /salário|salario|depósito|deposito|crédito|credito|recebimento|pix recebido|transferência recebida|transferencia recebida/
      ) !== null;

    transacoes.push({
      tipo: isRecebimento ? "recebimento" : "pagamento",
      descricao,
      categoria: inferirCategoria(descricao),
      valor,
      data_transacao,
    });
  }

  return transacoes;
}

//  Decide qual parser usar

function parsearTransacoes(texto: string): Transacao[] {
  const textoLower = texto.toLowerCase();

  // Detecta comprovante de transação única
  const isComprovante =
    textoLower.includes("pix enviado") ||
    textoLower.includes("pix recebido") ||
    textoLower.includes("comprovante") ||
    textoLower.includes("quem recebeu") ||
    textoLower.includes("quem pagou") ||
    textoLower.includes("identificador") ||
    textoLower.includes("id da transação");

  if (isComprovante) {
    const transacao = parsearComprovante(texto);
    return transacao ? [transacao] : [];
  }

  // Extrato com múltiplas transações
  return parsearExtrato(texto);
}

//  Route Handler

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const formData = await req.formData();

    const textoExtraido = formData.get("texto") as string | null;
    const nomeArquivo = formData.get("nomeArquivo") as string | null;
    const file = formData.get("file") as File | null;

    let texto = "";
    let nomeFinal = "";

    if (textoExtraido && nomeArquivo) {
      texto = textoExtraido;
      nomeFinal = nomeArquivo;
    } else if (file) {
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: "Formato inválido. Envie um PDF ou imagem (JPG, PNG)." },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      texto = await extrairTextoPdf(buffer);
      nomeFinal = file.name;
    } else {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    if (!texto || texto.trim().length < 20) {
      return NextResponse.json(
        {
          error:
            "Não foi possível extrair texto do arquivo. Tente com um arquivo de melhor qualidade.",
        },
        { status: 422 }
      );
    }

    // Descarta transações com data impossível (ex.: 99/99/2026), que o banco recusaria.
    const transacoesLidas = parsearTransacoes(texto).filter((t) =>
      isDataValida(t.data_transacao)
    );

    if (transacoesLidas.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhuma transação encontrada. Verifique se o arquivo é um extrato ou comprovante bancário válido.",
        },
        { status: 422 }
      );
    }

    // Evita duplicar movimentações já cadastradas (ex.: reimportar o mesmo extrato).
    const datas = transacoesLidas.map((t) => t.data_transacao).sort();
    const existentes = await buscarTodosExtratos(
      supabase,
      {
        ...FILTROS_INICIAIS,
        dataInicio: datas[0],
        dataFim: datas[datas.length - 1],
      },
      { userId: user.id, colunas: "id,tipo,descricao,valor,data_transacao" }
    );
    const { unicas: transacoes, ignoradas } = removerDuplicadas(
      transacoesLidas,
      existentes
    );

    if (transacoes.length === 0) {
      return NextResponse.json({ transacoes: [], duplicadas: ignoradas });
    }

    const { data: pdfImportado, error: pdfError } = await supabase
      .from("pdfs_importados")
      .insert({
        user_id: user.id,
        nome_arquivo: nomeFinal,
        status: "processando",
      })
      .select()
      .single();

    if (pdfError || !pdfImportado) {
      return NextResponse.json(
        { error: "Erro ao registrar o arquivo." },
        { status: 500 }
      );
    }

    const extratos = transacoes.map((t) => ({
      user_id: user.id,
      pdf_importado_id: pdfImportado.id,
      tipo: t.tipo,
      descricao: t.descricao,
      categoria: t.categoria,
      valor: t.valor,
      data_transacao: t.data_transacao,
      origem: "pdf" as const,
    }));

    const { error: extratosError } = await supabase
      .from("extratos")
      .insert(extratos);

    if (extratosError) {
      await supabase
        .from("pdfs_importados")
        .update({ status: "erro" })
        .eq("id", pdfImportado.id);
      return NextResponse.json(
        { error: "Erro ao salvar as transações." },
        { status: 500 }
      );
    }

    await supabase
      .from("pdfs_importados")
      .update({ status: "concluido" })
      .eq("id", pdfImportado.id);

    return NextResponse.json({ transacoes, duplicadas: ignoradas });
  } catch (err: unknown) {
    console.error("Erro na importação:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar o arquivo." },
      { status: 500 }
    );
  }
}
