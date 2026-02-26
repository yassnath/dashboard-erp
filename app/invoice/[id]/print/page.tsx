import { notFound } from "next/navigation";

import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function InvoicePrintPage({ params }: Params) {
  const user = await requireSessionUser();
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      orgId: user.orgId,
    },
    include: {
      customer: true,
      items: true,
      branch: true,
      payments: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  const paidAmount = invoice.payments.reduce((acc, item) => acc + Number(item.amount), 0);

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-white px-6 py-10 text-black print:p-4">
      <div className="mb-8 flex items-start justify-between border-b border-slate-300 pb-5">
        <div>
          <h1 className="text-3xl font-semibold">INVOICE</h1>
          <p className="text-sm text-slate-600">{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">Solvix ERP</p>
          <p>{invoice.branch.name}</p>
          <p>{invoice.branch.address}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-500">Bill To</p>
          <p className="font-medium">{invoice.customer.name}</p>
          <p>{invoice.customer.email}</p>
          <p>{invoice.customer.phone}</p>
          <p>{invoice.customer.address}</p>
        </div>
        <div className="text-right">
          <p>
            Tanggal: <strong>{formatDate(invoice.issueDate)}</strong>
          </p>
          <p>
            Jatuh Tempo: <strong>{invoice.dueDate ? formatDate(invoice.dueDate) : "-"}</strong>
          </p>
          <p>
            Status: <strong>{invoice.status}</strong>
          </p>
        </div>
      </div>

      <table className="mb-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-slate-300">
            <th className="px-2 py-2 text-left">Deskripsi</th>
            <th className="px-2 py-2 text-right">Qty</th>
            <th className="px-2 py-2 text-right">Harga</th>
            <th className="px-2 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id} className="border-b border-slate-200">
              <td className="px-2 py-2">{item.description}</td>
              <td className="px-2 py-2 text-right">{Number(item.quantity)}</td>
              <td className="px-2 py-2 text-right">{formatCurrency(item.unitPrice.toString())}</td>
              <td className="px-2 py-2 text-right">{formatCurrency(item.lineTotal.toString())}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto w-full max-w-sm space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <strong>{formatCurrency(invoice.subtotal.toString())}</strong>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <strong>{formatCurrency(invoice.tax.toString())}</strong>
        </div>
        <div className="flex justify-between border-t border-slate-300 pt-2 text-base">
          <span>Grand Total</span>
          <strong>{formatCurrency(invoice.total.toString())}</strong>
        </div>
        <div className="flex justify-between">
          <span>Paid</span>
          <strong>{formatCurrency(paidAmount)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Outstanding</span>
          <strong>{formatCurrency(Math.max(0, Number(invoice.total) - paidAmount))}</strong>
        </div>
      </div>

      <div className="mt-10 text-xs text-slate-500">Generated from Solvix ERP. Use browser print to export PDF.</div>
    </div>
  );
}
