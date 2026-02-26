import { z } from "zod";

export const idSchema = z.string().cuid();

export const customerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(32).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
});

export const invoiceItemSchema = z.object({
  productId: z.string().cuid().optional(),
  description: z.string().min(2).max(150),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

export const invoiceSchema = z.object({
  customerId: z.string().cuid(),
  dueDate: z.string().optional(),
  notes: z.string().max(255).optional(),
  taxPercent: z.number().min(0).max(100).default(11),
  items: z.array(invoiceItemSchema).min(1),
});

export const paymentSchema = z.object({
  invoiceId: z.string().cuid(),
  amount: z.number().positive(),
  method: z.string().min(2).max(60),
  reference: z.string().max(120).optional(),
});

export const productSchema = z.object({
  sku: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  categoryId: z.string().cuid().optional().or(z.literal("")),
  unit: z.string().min(1).max(20),
  cost: z.number().nonnegative(),
  price: z.number().nonnegative(),
  lowStockThreshold: z.number().int().min(0).max(9999),
});

export const stockMovementSchema = z.object({
  productId: z.string().cuid(),
  type: z.enum(["IN", "OUT", "TRANSFER"]),
  quantity: z.number().positive(),
  toBranchId: z.string().cuid().optional(),
  reference: z.string().max(120).optional(),
  note: z.string().max(255).optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(32).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
});

export const purchaseRequestSchema = z.object({
  supplierId: z.string().cuid().optional().or(z.literal("")),
  note: z.string().max(255).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().positive(),
        unitCost: z.number().nonnegative(),
      }),
    )
    .min(1),
});

export const approvalDecisionSchema = z.object({
  approvalId: z.string().cuid(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().max(255).optional(),
});

export const expenseSchema = z.object({
  vendor: z.string().min(2).max(120),
  category: z.string().min(2).max(80),
  amount: z.number().positive(),
  date: z.string(),
  note: z.string().max(255).optional(),
  attachment: z.string().url().optional().or(z.literal("")),
});

export const journalLineSchema = z.object({
  accountName: z.string().min(2).max(120),
  debit: z.number().nonnegative(),
  credit: z.number().nonnegative(),
  note: z.string().max(255).optional(),
});

export const journalEntrySchema = z
  .object({
    description: z.string().min(2).max(255),
    date: z.string(),
    lines: z.array(journalLineSchema).min(2),
  })
  .refine(
    (value) => {
      const debit = value.lines.reduce((acc, line) => acc + line.debit, 0);
      const credit = value.lines.reduce((acc, line) => acc + line.credit, 0);
      return Math.abs(debit - credit) < 0.00001;
    },
    {
      message: "Total debit dan credit harus seimbang",
      path: ["lines"],
    },
  )
  .refine(
    (value) => value.lines.every((line) => (line.debit > 0 ? line.credit === 0 : line.credit > 0)),
    {
      message: "Setiap baris hanya boleh debit atau credit",
      path: ["lines"],
    },
  );

export const employeeSchema = z.object({
  employeeCode: z.string().min(3).max(40),
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(32).optional().or(z.literal("")),
  position: z.string().min(2).max(80),
  baseSalary: z.number().nonnegative(),
});

export const attendanceSchema = z.object({
  employeeId: z.string().cuid(),
  date: z.string(),
  status: z.enum(["PRESENT", "SICK", "LEAVE", "ABSENT"]),
  hours: z.number().min(0).max(24),
  note: z.string().max(255).optional(),
});

export const projectSchema = z.object({
  code: z.string().min(3).max(40),
  name: z.string().min(2).max(120),
  client: z.string().max(120).optional().or(z.literal("")),
  budget: z.number().nonnegative(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "DONE"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const taskSchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(2).max(140),
  description: z.string().max(255).optional(),
  status: z.enum(["BACKLOG", "IN_PROGRESS", "DONE"]),
  assigneeId: z.string().cuid().optional().or(z.literal("")),
  dueDate: z.string().optional(),
});

export const branchSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(24),
  address: z.string().max(255).optional().or(z.literal("")),
});
