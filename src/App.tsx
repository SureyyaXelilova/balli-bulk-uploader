import { useEffect, useMemo, useState } from "react";
import "./App.css";

type BalliProduct = {
  name: string;
  description: string;
  brand: string;
  barcode: string;
  categoryId: number;
  subCategory: "MISCELLANEOUS";
  currentPrice: number;
  originalPrice: number;
  isInStock: boolean;
  stockQuantity: number;
};

type ParseError = { line: number; raw: string; reason: string };
type ToastType = "success" | "error";

function parseGoodsTxt(text: string): {
  products: BalliProduct[];
  errors: ParseError[];
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const products: BalliProduct[] = [];
  const errors: ParseError[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const parts = raw.split("|").map((p) => p.trim());

    if (parts.length < 6) {
      errors.push({ line: i + 1, raw, reason: "Sütun sayı 6-dan azdır" });
      continue;
    }

    const name = parts[2];
    const barcode = parts[3];
    const price = Number((parts[4] ?? "").replace(",", "."));
    const qty = Number((parts[5] ?? "").replace(",", "."));

    if (!name) {
      errors.push({ line: i + 1, raw, reason: "name boşdur" });
      continue;
    }
    if (!barcode) {
      errors.push({ line: i + 1, raw, reason: "barcode boşdur" });
      continue;
    }
    if (!Number.isFinite(price)) {
      errors.push({ line: i + 1, raw, reason: "price yanlışdır/boşdur" });
      continue;
    }
    if (!Number.isFinite(qty)) {
      errors.push({ line: i + 1, raw, reason: "qty yanlışdır/boşdur" });
      continue;
    }

    products.push({
      name,
      description: name,
      brand: name,
      barcode,
      categoryId: 14,
      subCategory: "MISCELLANEOUS",
      currentPrice: price,
      originalPrice: price,
      isInStock: qty > 0,
      stockQuantity: qty,
    });
  }

  return { products, errors };
}

export default function App() {
  const [fileLabel, setFileLabel] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const parsed = useMemo(() => parseGoodsTxt(rawText), [rawText]);

  // toast 20 saniyə qalsın
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 20000);
    return () => clearTimeout(t);
  }, [toast]);

  async function sendAllAtOnce(products: BalliProduct[]) {
    const res = await fetch(
      "https://savey.az/api/partner/balli-products/bulk",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(products),
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Server xətası: ${res.status} ${res.statusText}` +
          (text ? ` — ${text}` : ""),
      );
    }
  }

  async function onFileSelect(file: File | null) {
    if (!file) return;

    setToast(null);
    setFileLabel(file.name);
    setLoading(true);

    try {
      const text = await file.text();
      setRawText(text);

      const { products } = parseGoodsTxt(text);
      if (products.length === 0) {
        throw new Error(
          "Valid məhsul tapılmadı (name/barcode/price/qty yoxlanıldı).",
        );
      }

      await sendAllAtOnce(products);

      setToast({
        type: "success",
        message: `Uğurlu ✅ Göndərildi: ${products.length} məhsul | Xəta: ${parsed.errors.length}`,
      });
    } catch (e: any) {
      setToast({
        type: "error",
        message: e?.message ?? "Naməlum xəta baş verdi",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h2 className="title">Balli Products Bulk Upload</h2>

      <div className="uploadRow">
        <input
          className="fileInput"
          type="file"
          accept=".txt,text/plain"
          onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
        />
        {fileLabel ? (
          <span className="fileLabel">File: {fileLabel}</span>
        ) : null}
      </div>

      {/* Məhsul sayı + xəta sayı */}
      {rawText ? (
        <div className="stats">
          <div className="statCard">
            <div className="statLabel">Məhsul sayı</div>
            <div className="statValue">{parsed.products.length}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Xəta sayı</div>
            <div className="statValue">{parsed.errors.length}</div>
          </div>
        </div>
      ) : null}

      {/* Loader */}
      {loading ? (
        <div className="overlay">
          <div className="loaderCard">
            <div className="loaderTitle">Göndərilir...</div>
            <div className="loaderSub">Zəhmət olmasa gözləyin</div>
          </div>
        </div>
      ) : null}

      {/* Toast (sağda) */}
      {toast ? (
        <div className={`toast toast--${toast.type}`}>
          {toast.message}
          <button
            className="toastClose"
            onClick={() => setToast(null)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      ) : null}
    </div>
  );
}
