import AssetDetailClient from "./AssetDetailClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;     // ✅ unwrap params (Promise)
  const assetId = Number(id);      // ✅ aman, ga NaN kalau url bener

  return <AssetDetailClient id={assetId} />;
}
