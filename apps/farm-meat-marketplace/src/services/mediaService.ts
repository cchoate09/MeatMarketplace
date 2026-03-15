import { hasSupabaseConfig, requireSupabase } from "./supabase";

export async function uploadListingImage(listingId: string, fileUri: string, filename: string) {
  if (!hasSupabaseConfig) {
    return {
      listingId,
      storagePath: fileUri,
      publicUrl: fileUri
    };
  }

  const supabase = requireSupabase();
  const storagePath = `listing-images/${listingId}/${Date.now()}-${filename}`;
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const { error } = await supabase.storage.from("listing-images").upload(storagePath, blob, {
    contentType: blob.type || "image/jpeg",
    upsert: true
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("listing-images").getPublicUrl(storagePath);

  return {
    listingId,
    storagePath,
    publicUrl: data.publicUrl
  };
}
