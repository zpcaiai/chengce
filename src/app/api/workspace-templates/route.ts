import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { created, HttpError, parseBody, route } from "@/lib/http";
import { getWorkspaceTemplate, workspaceTemplates } from "@/lib/workspace-templates";

const slugify = (name: string) => `${name.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "")}-${Math.random().toString(36).slice(2, 7)}`;

export async function GET() {
  return route(async () => ({ templates: workspaceTemplates.map(({ evidence, capabilities, assets, actions, experiment, ...item }) => ({ ...item, counts: { evidence: evidence.length, capabilities: capabilities.length, assets: assets.length, actions: actions.length, experiments: experiment ? 1 : 0 } })) }));
}

export async function POST(req: Request) {
  return route(async () => {
    const userId = await getUserId();
    const body = await parseBody(req, z.object({ templateId: z.string().min(1).max(80), workspaceName: z.string().min(2).max(80) }));
    const template = getWorkspaceTemplate(body.templateId);
    if (!template) throw new HttpError(404, "Template not found");

    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({ data: { name: body.workspaceName.trim(), slug: slugify(body.workspaceName), members: { create: { userId, role: "OWNER" } } } });
      const project = await tx.transformationProject.create({ data: { workspaceId: workspace.id, ...template.project } });
      await Promise.all(template.evidence.map((item) => tx.evidence.create({ data: { projectId: project.id, authorId: userId, kind: "NOTE", ...item } })));
      const capabilities = await Promise.all(template.capabilities.map((item) => tx.criticalCapability.create({ data: { projectId: project.id, ...item, dependencyScore: 0.5, repeatabilityScore: 0.3, status: "CANDIDATE" } })));
      const assets = await Promise.all(template.assets.map((item) => tx.systemAsset.create({ data: { projectId: project.id, ...item, status: "DRAFT" } })));
      // Template notes deliberately do not become citations: an asset cannot be
      // treated as an organisation standard until the user adds real evidence.
      await tx.transferAction.createMany({ data: template.actions.map((item, index) => ({ projectId: project.id, ...item, capabilityId: capabilities[index % capabilities.length]?.id, assetId: assets[index % assets.length]?.id })) });
      await tx.projectExperiment.create({ data: { projectId: project.id, ...template.experiment, status: "PLANNED" } });
      await tx.auditLog.create({ data: { projectId: project.id, actorId: userId, action: "workspace.template.instantiated", target: template.id, detail: `${template.name} → ${workspace.name}` } });
      return { workspace, project };
    });
    return created(result);
  });
}
