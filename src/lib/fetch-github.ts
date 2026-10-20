const PROXY =
  "https://lingering-disk-fddf.zequez.workers.dev/?repo=$REPO&ref=$REF";

export async function fetchRepo(repo: string, ref: string): Promise<Blob> {
  console.log("Fetching repo ", repo, ref);
  const url = PROXY.replace("$REPO", repo).replace("$REF", ref);
  const response = await fetch(url);
  if (!response.ok) throw new Error(await response.text());
  const zip = await response.blob();
  console.log(zip.size, zip.type);
  const kb = Math.round((zip.size / 1024) * 100) / 100;
  const mb = Math.round((zip.size / 1024 / 1024) * 100) / 100;
  const unit = kb > 1024 ? `${mb}MB` : `${kb}KB`;
  console.log("Downloaded ZIP ", unit);
  return zip;
}
