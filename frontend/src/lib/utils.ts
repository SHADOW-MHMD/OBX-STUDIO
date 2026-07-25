/**
 * Parse SSE stream from OpenRouter and extract text deltas.
 * Calls onChunk for each new text piece, onDone when stream ends.
 */
export async function parseSSEStream(
  response: Response,
  onChunk: (text: string) => void,
  onDone: (fullText: string) => void
): Promise<void> {
  if (!response.body) {
    onDone("");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch {}
      }
    }
  } finally {
    reader.releaseLock();
  }

  onDone(fullText);
}

/**
 * Try to parse the AI's JSON response from the interview.
 * Returns null if not valid JSON.
 */
export function parseInterviewResponse(text: string): {
  question?: string;
  options?: string[];
  context?: string;
  done?: boolean;
  summary?: string;
} | null {
  try {
    return JSON.parse(text);
  } catch {
    // Sometimes the model wraps in ```json ... ```
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try { return JSON.parse(match[1]); } catch {}
    }
    return null;
  }
}

/**
 * Generate and trigger a .md file download.
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate and trigger a .pdf file download from markdown content.
 * ponytail: client-side PDF via jsPDF — no server needed.
 * Ceiling: complex markdown (tables, code) may not render perfectly; upgrade path is puppeteer Worker.
 */
export async function downloadPDF(content: string, filename: string): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  // Dark theme PDF
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setTextColor(220, 220, 220);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const lines = doc.splitTextToSize(content, maxWidth);
  let y = margin;

  for (const line of lines) {
    if (y > pageHeight - margin) {
      doc.addPage();
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      y = margin;
    }

    // Simple heading detection
    if (line.startsWith("# ")) {
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(line.slice(2), margin, y);
      y += 10;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
    } else if (line.startsWith("## ")) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(240, 240, 240);
      doc.text(line.slice(3), margin, y);
      y += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
    } else if (line.startsWith("### ")) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 220, 220);
      doc.text(line.slice(4), margin, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
    } else {
      doc.text(line, margin, y);
      y += 6;
    }
  }

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
