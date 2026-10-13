/**
 * Turns a CV file into plain text, entirely in the browser. The PDF and Word
 * readers are large, so each is only downloaded when a file of its type is picked.
 */

export const CV_ACCEPT = ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 10;

export async function readCv(file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error("That file is over 10 MB. Try a smaller PDF or paste the text instead.");
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return readPdf(file);
  if (name.endsWith(".docx")) return readDocx(file);
  if (name.endsWith(".doc")) throw new Error("Old .doc files aren't supported. Save it as .docx or PDF, or paste the text.");
  return file.text();
}

async function readPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc ||= new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const doc = await task.promise;
    const pages: string[] = [];
    for (let i = 1; i <= Math.min(doc.numPages, MAX_PAGES); i++) {
      const content = await (await doc.getPage(i)).getTextContent();
      pages.push(content.items.map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : "") : "")).join(""));
    }
    const text = pages.join("\n").trim();
    if (!text) throw new Error("This PDF has no readable text (it may be a scan). Paste the text instead.");
    return text;
  } finally {
    void task.destroy();
  }
}

async function readDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value.trim();
}
