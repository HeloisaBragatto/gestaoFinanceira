import { useState } from "react";
import { FileUp } from "lucide-react";

interface UploadZonaProps {
  /** Quantidade de arquivos já selecionados. */
  total: number;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Arquivos soltos na área (arrastar e soltar). */
  onArquivos: (files: File[]) => void;
}

export function UploadZona({
  total,
  disabled,
  onChange,
  onArquivos,
}: UploadZonaProps) {
  const [arrastando, setArrastando] = useState(false);

  return (
    <label
      htmlFor="file-input"
      onDragOver={(e) => {
        e.preventDefault();
        setArrastando(true);
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastando(false);
        if (!disabled) onArquivos(Array.from(e.dataTransfer.files));
      }}
      className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all duration-200 ${
        arrastando || total > 0
          ? "border-darkBlue bg-darkBlue/5"
          : "border-gray-200 hover:border-darkBlue/40 hover:bg-gray-50"
      } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
    >
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
          total > 0 ? "bg-darkBlue/10" : "bg-gray-100"
        }`}
      >
        <FileUp
          size={26}
          className={total > 0 ? "text-darkBlue" : "text-gray-400"}
        />
      </div>

      {total > 0 ? (
        <div className="text-center">
          <span className="text-sm font-semibold text-gray-900 block">
            {total}{" "}
            {total === 1 ? "arquivo selecionado" : "arquivos selecionados"}
          </span>
          <span className="text-xs text-balance text-gray-500 mt-1 block">
            Clique ou arraste para adicionar mais
          </span>
        </div>
      ) : (
        <div className="text-center">
          <span className="text-sm text-balance font-semibold text-gray-900 block">
            Arraste ou clique para selecionar
          </span>
          <span className="text-xs text-balance text-gray-500 mt-1 block">
            Você pode escolher vários arquivos de uma vez
          </span>
          <div className="flex gap-2 justify-center mt-3">
            {["PDF", "JPG", "PNG", "WEBP"].map((f) => (
              <span
                key={f}
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-gray-200 bg-white text-gray-500"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      <input
        id="file-input"
        type="file"
        multiple
        accept=".pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={onChange}
      />
    </label>
  );
}
