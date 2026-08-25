// Base URL for site imagery hosted in Firebase Storage (public GCS
// objects, uploaded via scripts/upload-images-to-firebase.mjs, mirroring
// the paths these images used to have under public/). Paths passed to
// storageImage() should keep their old public/ leading slash so call
// sites didn't need to change beyond the import.
const STORAGE_BASE_URL =
  "https://storage.googleapis.com/trueloger-d4432.firebasestorage.app/site-images";

export function storageImage(publicPath: string): string {
  return STORAGE_BASE_URL + encodeURI(publicPath);
}
