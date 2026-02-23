export default function App() {
  async function handleFileChange(file: File | null) {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("branchId", "9");
      formData.append("categoryId", "14");

      const res = await fetch("/savey-api/api/partner/product-imports/upload", {
        method: "POST",
        headers: {
          "X-API-Key":
            "57ff1003070f4801bfb8f66bb5b09ef7cd17474ba6b1ace6c21eec32e71e59fe",
        },
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || `Server xətası: ${res.status}`);
      }

      console.log("Uğurla göndərildi ✅");
      console.log("Response:", data);

      alert("Uğurla yükləndi!");
    } catch (err: any) {
      console.error("Xəta:", err);
      alert(err.message || "Xəta baş verdi");
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <input
        type="file"
        accept=".txt"
        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
