import { prisma } from '@/lib/prisma'
import { createId } from '@paralleldrive/cuid2'

export async function logAudit(entry: {
  actorId: string
  actorEmail: string
  action: string
  targetId?: string
  targetEmail?: string
  summary: string
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      id: createId(),
      actorId: entry.actorId,
      actorEmail: entry.actorEmail,
      action: entry.action,
      targetId: entry.targetId ?? null,
      targetEmail: entry.targetEmail ?? null,
      summary: entry.summary,
    },
  })
}
