import { NextRequest } from "next/server";
import { z } from "zod";

import { createAuditLog } from "@/lib/audit";
import { decimal } from "@/lib/decimal";
import { nextDocNumber } from "@/lib/doc-number";
import { fail, handleApiError, ok } from "@/lib/api";
import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { journalEntrySchema } from "@/lib/schemas";

const actionSchema = z.object({
  id: z.string().cuid(),
  action: z.enum(["POST"]),
});

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const entries = await prisma.journalEntry.findMany({
      where: {
        orgId: user.orgId,
      },
      include: {
        lines: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return ok(entries);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);
    if (!user.branchId) return fail("User tidak terikat branch", 400);

    const body = await request.json();
    const parsed = journalEntrySchema.parse(body);

    const count = await prisma.journalEntry.count({ where: { orgId: user.orgId } });
    const entryNumber = nextDocNumber("JR", count);

    const entry = await prisma.journalEntry.create({
      data: {
        orgId: user.orgId,
        branchId: user.branchId,
        entryNumber,
        date: new Date(parsed.date),
        description: parsed.description,
        createdById: user.id,
        lines: {
          create: parsed.lines.map((line) => ({
            accountName: line.accountName,
            debit: decimal(line.debit),
            credit: decimal(line.credit),
            note: line.note || null,
          })),
        },
      },
      include: {
        lines: true,
      },
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: user.branchId,
      userId: user.id,
      action: "CREATE",
      entity: "JOURNAL_ENTRY",
      entityId: entry.id,
      details: { entryNumber: entry.entryNumber },
    });

    return ok(entry, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return fail("Unauthorized", 401);

    const body = await request.json();
    const parsed = actionSchema.parse(body);

    const journal = await prisma.journalEntry.findFirst({
      where: {
        id: parsed.id,
        orgId: user.orgId,
      },
      include: {
        lines: true,
      },
    });

    if (!journal) {
      return fail("Journal tidak ditemukan", 404);
    }

    if (journal.postedAt) {
      return fail("Journal sudah diposting", 400);
    }

    const debit = journal.lines.reduce((acc, line) => acc + Number(line.debit), 0);
    const credit = journal.lines.reduce((acc, line) => acc + Number(line.credit), 0);

    if (Math.abs(debit - credit) > 0.0001) {
      return fail("Debit dan credit tidak seimbang", 400);
    }

    const posted = await prisma.journalEntry.update({
      where: { id: journal.id },
      data: {
        postedAt: new Date(),
        postedById: user.id,
      },
      include: {
        lines: true,
      },
    });

    await createAuditLog({
      orgId: user.orgId,
      branchId: journal.branchId,
      userId: user.id,
      action: "POST",
      entity: "JOURNAL_ENTRY",
      entityId: journal.id,
      details: { entryNumber: journal.entryNumber },
    });

    return ok(posted);
  } catch (error) {
    return handleApiError(error);
  }
}
