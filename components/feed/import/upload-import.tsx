import { FileUp } from "lucide-react";

interface UploadZonaProps {
  file: File | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadZona({ file, onChange }: UploadZonaProps) {
  return (
    <label
      htmlFor="file-input"
      className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all duration-200 ${
        file
          ? "border-darkBlue bg-darkBlue/5"
          : "border-gray-200 hover:border-darkBlue/40 hover:bg-gray-50"
      }`}
    >
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
          file ? "bg-darkBlue/10" : "bg-gray-100"
        }`}
      >
        <FileUp
          size={26}
          className={file ? "text-darkBlue" : "text-gray-400"}
        />
      </div>

      {file ? (
        <div className="text-center">
          <span className="text-sm font-semibold text-gray-900 block">
            {file.name}
          </span>
          <span className="text-xs text-gray-500 mt-1 block">
            Clique para trocar o arquivo
          </span>
        </div>
      ) : (
        <div className="text-center">
          <span className="text-sm font-semibold text-gray-900 block">
            Arraste ou clique para selecionar
          </span>
          <span className="text-xs text-gray-500 mt-1 block">
            PDF, JPG ou PNG
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
        accept=".pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onChange}
      />
    </label>
  );
}
