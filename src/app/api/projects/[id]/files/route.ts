import crypto from "node:crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

const textTypes = new Set(["text/plain", "text/markdown", "text/csv"]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id: projectId } = await params;
    await requireProjectAccess(userId, projectId, "MEMBER");
    const form = await req.formData(); const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Please attach a file");
    if (file.size > 20 * 1024 * 1024) throw new HttpError(413, "Files must be 20 MB or smaller");
    const key = `${projectId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const root = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
    await mkdir(path.dirname(path.join(root, key)), { recursive: true });
    await writeFile(path.join(root, key), Buffer.from(await file.arrayBuffer()));
    let transcript = "";
    if (textTypes.has(file.type)) transcript = await file.text();
    if (file.type.startsWith("audio/") && process.env.OPENAI_API_KEY) {
      const audio = new FormData(); audio.append("file", file); audio.append("model", process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-mini-transcribe");
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: audio });
      if (!response.ok) throw new HttpError(502, "Audio transcription failed");
      transcript = (await response.json() as { text?: string }).text ?? "";
    }
    const evidence = transcript.trim() ? await prisma.evidence.create({ data: { projectId, authorId: userId, kind: "DOCUMENT", title: file.name, sourceName: file.type.startsWith("audio/") ? "Audio transcription" : "Uploaded file", content: transcript } }) : null;
    const source = await prisma.sourceFile.create({ data: { projectId, evidenceId: evidence?.id, originalName: file.name, mimeType: file.type || "application/octet-stream", storageKey: key, sizeBytes: file.size, transcript } });
    await prisma.auditLog.create({ data: { projectId, actorId: userId, action: "file.uploaded", target: source.id, detail: file.name } });
    return created({ source, evidence, transcriptionPending: file.type.startsWith("audio/") && !process.env.OPENAI_API_KEY });
  });
}
