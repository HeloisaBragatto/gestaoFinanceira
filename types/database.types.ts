// ============================================================
// Tipos gerados manualmente para o schema de planejamento
// financeiro no Supabase.
//
// Como usar:
//   import { Database } from '@/types/database.types'
//   const supabase = createClient<Database>(url, key)
// ============================================================

export type Database = {
  public: {
    Tables: {
      extratos: {
        Row: Extrato;
        Insert: ExtratoInsert;
        Update: ExtratoUpdate;
      };
      pdfs_importados: {
        Row: PdfImportado;
        Insert: PdfImportadoInsert;
        Update: PdfImportadoUpdate;
      };
    };
  };
};

// ------------------------------------------------------------
// Enums
// ------------------------------------------------------------

export type ExtratoTipo = "pagamento" | "recebimento";
export type ExtratoOrigem = "manual" | "pdf";
export type PdfStatus = "pendente" | "processando" | "concluido" | "erro";

// ------------------------------------------------------------
// Extrato
// ------------------------------------------------------------

/** Linha retornada pelo Supabase (todos os campos presentes) */
export interface Extrato {
  id: string;
  user_id: string;
  pdf_importado_id: string | null;
  tipo: ExtratoTipo;
  descricao: string;
  categoria: string | null;
  valor: number;
  data_transacao: string; // formato: 'YYYY-MM-DD'
  origem: ExtratoOrigem;
  criado_em: string; // formato ISO 8601
}

/** Payload para INSERT — campos gerados pelo banco são opcionais */
export interface ExtratoInsert {
  id?: string;
  user_id?: string; // preenchido automaticamente via RLS / auth.uid()
  pdf_importado_id?: string | null;
  tipo: ExtratoTipo;
  descricao: string;
  categoria?: string | null;
  valor: number;
  data_transacao: string;
  origem?: ExtratoOrigem;
  criado_em?: string;
}

/** Payload para UPDATE — todos os campos são opcionais */
export type ExtratoUpdate = Partial<ExtratoInsert>;

// ------------------------------------------------------------
// PDF Importado
// ------------------------------------------------------------

/** Linha retornada pelo Supabase */
export interface PdfImportado {
  id: string;
  user_id: string;
  nome_arquivo: string;
  status: PdfStatus;
  importado_em: string; // formato ISO 8601
}

/** Payload para INSERT */
export interface PdfImportadoInsert {
  id?: string;
  user_id?: string;
  nome_arquivo: string;
  status?: PdfStatus;
  importado_em?: string;
}

/** Payload para UPDATE */
export type PdfImportadoUpdate = Partial<PdfImportadoInsert>;

// ------------------------------------------------------------
// Helpers — tipos utilitários para uso nos componentes
// ------------------------------------------------------------

/** Extrato com o PDF de origem já embutido (join) */
export interface ExtratoComPdf extends Extrato {
  pdfs_importados: Pick<PdfImportado, "id" | "nome_arquivo" | "status"> | null;
}

/** Resumo financeiro usado no dashboard */
export interface ResumoDashboard {
  total_recebimentos: number;
  total_pagamentos: number;
  saldo: number;
}
