import { Prisma, PrismaClient, Role, InvoiceStatus, PurchaseRequestStatus, PurchaseOrderStatus, ApprovalStatus, StockMovementType, ExpenseStatus, AttendanceStatus, ProjectStatus, TaskStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("solvix123", 12);

  await prisma.auditLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.journalLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.purchaseRequestItem.deleteMany();
  await prisma.purchaseRequest.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockLevel.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.org.deleteMany();

  const org = await prisma.org.create({
    data: {
      name: "Solvix Coffee & Retail Indonesia",
      code: "SOLVIX-ID",
    },
  });

  const [hqBranch, retailBranch] = await Promise.all([
    prisma.branch.create({
      data: {
        orgId: org.id,
        name: "Kopi Nusantara HQ",
        code: "HQ",
        address: "Jl. Sudirman No. 88, Jakarta",
      },
    }),
    prisma.branch.create({
      data: {
        orgId: org.id,
        name: "Solvix Retail Plaza",
        code: "RTL",
        address: "Bandung Trade Center, Bandung",
      },
    }),
  ]);

  const [superAdmin, orgAdmin, manager, staff, viewer] = await Promise.all([
    prisma.user.create({
      data: {
        orgId: org.id,
        name: "Super Admin",
        email: "super@solvix.id",
        passwordHash,
        role: Role.SUPER_ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        orgId: org.id,
        branchId: hqBranch.id,
        name: "Ayu Org Admin",
        email: "admin@solvix.id",
        passwordHash,
        role: Role.ORG_ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        orgId: org.id,
        branchId: hqBranch.id,
        name: "Bima Manager",
        email: "manager@solvix.id",
        passwordHash,
        role: Role.MANAGER,
      },
    }),
    prisma.user.create({
      data: {
        orgId: org.id,
        branchId: retailBranch.id,
        name: "Citra Staff",
        email: "staff@solvix.id",
        passwordHash,
        role: Role.STAFF,
      },
    }),
    prisma.user.create({
      data: {
        orgId: org.id,
        branchId: retailBranch.id,
        name: "Dewa Viewer",
        email: "viewer@solvix.id",
        passwordHash,
        role: Role.VIEWER,
      },
    }),
  ]);

  const [beverages, beans, pastry, merch] = await Promise.all([
    prisma.category.create({ data: { orgId: org.id, name: "Beverages" } }),
    prisma.category.create({ data: { orgId: org.id, name: "Coffee Beans" } }),
    prisma.category.create({ data: { orgId: org.id, name: "Pastry" } }),
    prisma.category.create({ data: { orgId: org.id, name: "Merchandise" } }),
  ]);

  const products = await Promise.all([
    prisma.product.create({
      data: {
        orgId: org.id,
        sku: "BEV-ESP-001",
        name: "Espresso Shot",
        categoryId: beverages.id,
        unit: "cup",
        cost: new Prisma.Decimal(8000),
        price: new Prisma.Decimal(22000),
        lowStockThreshold: 30,
      },
    }),
    prisma.product.create({
      data: {
        orgId: org.id,
        sku: "BEV-LAT-002",
        name: "Cafe Latte",
        categoryId: beverages.id,
        unit: "cup",
        cost: new Prisma.Decimal(12000),
        price: new Prisma.Decimal(32000),
        lowStockThreshold: 25,
      },
    }),
    prisma.product.create({
      data: {
        orgId: org.id,
        sku: "BNS-ARAB-003",
        name: "Arabica Beans 1kg",
        categoryId: beans.id,
        unit: "bag",
        cost: new Prisma.Decimal(130000),
        price: new Prisma.Decimal(215000),
        lowStockThreshold: 8,
      },
    }),
    prisma.product.create({
      data: {
        orgId: org.id,
        sku: "PAS-CRM-004",
        name: "Croissant Butter",
        categoryId: pastry.id,
        unit: "pcs",
        cost: new Prisma.Decimal(9000),
        price: new Prisma.Decimal(22000),
        lowStockThreshold: 20,
      },
    }),
    prisma.product.create({
      data: {
        orgId: org.id,
        sku: "MRC-TMB-005",
        name: "Tumbler Solvix",
        categoryId: merch.id,
        unit: "pcs",
        cost: new Prisma.Decimal(45000),
        price: new Prisma.Decimal(95000),
        lowStockThreshold: 12,
      },
    }),
  ]);

  for (const product of products) {
    await prisma.stockLevel.createMany({
      data: [
        {
          orgId: org.id,
          branchId: hqBranch.id,
          productId: product.id,
          quantity: new Prisma.Decimal(product.sku.startsWith("BNS") ? 20 : 100),
        },
        {
          orgId: org.id,
          branchId: retailBranch.id,
          productId: product.id,
          quantity: new Prisma.Decimal(product.sku.startsWith("BNS") ? 10 : 60),
        },
      ],
    });
  }

  const [supplierBeans, supplierBakery] = await Promise.all([
    prisma.supplier.create({
      data: {
        orgId: org.id,
        name: "PT Nusantara Beans",
        email: "sales@beans.co.id",
        phone: "+62-21-778899",
        address: "Bogor, Jawa Barat",
      },
    }),
    prisma.supplier.create({
      data: {
        orgId: org.id,
        name: "CV Roti Harian",
        email: "order@rotiharian.id",
        phone: "+62-22-313131",
        address: "Bandung, Jawa Barat",
      },
    }),
  ]);

  const [customerA, customerB] = await Promise.all([
    prisma.customer.create({
      data: {
        orgId: org.id,
        name: "PT Aruna Teknologi",
        email: "finance@aruna.co.id",
        phone: "+62-812-2222-3333",
        address: "Jakarta Selatan",
      },
    }),
    prisma.customer.create({
      data: {
        orgId: org.id,
        name: "Nadia Pratama",
        email: "nadia@gmail.com",
        phone: "+62-813-4444-5555",
        address: "Bandung",
      },
    }),
  ]);

  const invoice1 = await prisma.invoice.create({
    data: {
      orgId: org.id,
      branchId: retailBranch.id,
      customerId: customerA.id,
      invoiceNumber: "INV-2026-0001",
      status: InvoiceStatus.PAID,
      issueDate: new Date("2026-02-10"),
      dueDate: new Date("2026-02-17"),
      subtotal: new Prisma.Decimal(640000),
      tax: new Prisma.Decimal(70400),
      total: new Prisma.Decimal(710400),
      notes: "Corporate coffee package",
      items: {
        create: [
          {
            productId: products[1].id,
            description: "Cafe Latte",
            quantity: new Prisma.Decimal(20),
            unitPrice: new Prisma.Decimal(32000),
            lineTotal: new Prisma.Decimal(640000),
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orgId: org.id,
      branchId: retailBranch.id,
      invoiceId: invoice1.id,
      amount: new Prisma.Decimal(710400),
      method: "Bank Transfer",
      reference: "TRF-INV-0001",
      paidAt: new Date("2026-02-12"),
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      orgId: org.id,
      branchId: hqBranch.id,
      customerId: customerB.id,
      invoiceNumber: "INV-2026-0002",
      status: InvoiceStatus.ISSUED,
      issueDate: new Date("2026-02-18"),
      dueDate: new Date("2026-02-25"),
      subtotal: new Prisma.Decimal(285000),
      tax: new Prisma.Decimal(31350),
      total: new Prisma.Decimal(316350),
      items: {
        create: [
          {
            productId: products[2].id,
            description: "Arabica Beans 1kg",
            quantity: new Prisma.Decimal(1),
            unitPrice: new Prisma.Decimal(215000),
            lineTotal: new Prisma.Decimal(215000),
          },
          {
            productId: products[4].id,
            description: "Tumbler Solvix",
            quantity: new Prisma.Decimal(1),
            unitPrice: new Prisma.Decimal(95000),
            lineTotal: new Prisma.Decimal(95000),
          },
        ],
      },
    },
  });

  const prSubmitted = await prisma.purchaseRequest.create({
    data: {
      orgId: org.id,
      branchId: retailBranch.id,
      supplierId: supplierBeans.id,
      number: "PR-2026-0001",
      status: PurchaseRequestStatus.SUBMITTED,
      submittedAt: new Date("2026-02-20"),
      createdById: staff.id,
      note: "Restock arabica for weekend campaign",
      items: {
        create: [
          {
            productId: products[2].id,
            quantity: new Prisma.Decimal(12),
            unitCost: new Prisma.Decimal(130000),
            lineTotal: new Prisma.Decimal(1560000),
          },
        ],
      },
    },
  });

  await prisma.approval.create({
    data: {
      orgId: org.id,
      branchId: retailBranch.id,
      entityType: "PURCHASE_REQUEST",
      entityId: prSubmitted.id,
      status: ApprovalStatus.PENDING,
      requestedById: staff.id,
      purchaseRequestId: prSubmitted.id,
    },
  });

  const prApproved = await prisma.purchaseRequest.create({
    data: {
      orgId: org.id,
      branchId: hqBranch.id,
      supplierId: supplierBakery.id,
      number: "PR-2026-0002",
      status: PurchaseRequestStatus.APPROVED,
      submittedAt: new Date("2026-02-12"),
      approvedAt: new Date("2026-02-13"),
      createdById: orgAdmin.id,
      note: "Weekly pastry procurement",
      items: {
        create: [
          {
            productId: products[3].id,
            quantity: new Prisma.Decimal(120),
            unitCost: new Prisma.Decimal(9000),
            lineTotal: new Prisma.Decimal(1080000),
          },
        ],
      },
    },
  });

  await prisma.approval.create({
    data: {
      orgId: org.id,
      branchId: hqBranch.id,
      entityType: "PURCHASE_REQUEST",
      entityId: prApproved.id,
      status: ApprovalStatus.APPROVED,
      note: "Approved for HQ weekly demand",
      requestedById: orgAdmin.id,
      approverId: manager.id,
      actedAt: new Date("2026-02-13"),
      purchaseRequestId: prApproved.id,
    },
  });

  const po = await prisma.purchaseOrder.create({
    data: {
      orgId: org.id,
      branchId: hqBranch.id,
      supplierId: supplierBakery.id,
      purchaseRequestId: prApproved.id,
      number: "PO-2026-0001",
      status: PurchaseOrderStatus.RECEIVED,
      issuedAt: new Date("2026-02-13"),
      receivedAt: new Date("2026-02-14"),
      total: new Prisma.Decimal(1080000),
      createdById: manager.id,
      items: {
        create: [
          {
            productId: products[3].id,
            quantity: new Prisma.Decimal(120),
            unitCost: new Prisma.Decimal(9000),
            lineTotal: new Prisma.Decimal(1080000),
          },
        ],
      },
    },
  });

  await prisma.stockMovement.create({
    data: {
      orgId: org.id,
      branchId: hqBranch.id,
      productId: products[3].id,
      type: StockMovementType.IN,
      quantity: new Prisma.Decimal(120),
      reference: po.number,
      note: "Goods receipt from PO",
    },
  });

  await prisma.stockLevel.update({
    where: {
      orgId_branchId_productId: {
        orgId: org.id,
        branchId: hqBranch.id,
        productId: products[3].id,
      },
    },
    data: {
      quantity: {
        increment: new Prisma.Decimal(120),
      },
    },
  });

  await prisma.expense.createMany({
    data: [
      {
        orgId: org.id,
        branchId: hqBranch.id,
        vendor: "PLN",
        category: "Utilities",
        amount: new Prisma.Decimal(2500000),
        status: ExpenseStatus.PAID,
        date: new Date("2026-02-15"),
        note: "Electricity HQ",
        createdById: orgAdmin.id,
        approvedById: manager.id,
      },
      {
        orgId: org.id,
        branchId: retailBranch.id,
        vendor: "GoFood Ads",
        category: "Marketing",
        amount: new Prisma.Decimal(1200000),
        status: ExpenseStatus.APPROVED,
        date: new Date("2026-02-19"),
        note: "Campaign spend",
        createdById: staff.id,
        approvedById: manager.id,
      },
    ],
  });

  const journal = await prisma.journalEntry.create({
    data: {
      orgId: org.id,
      branchId: hqBranch.id,
      entryNumber: "JR-2026-0001",
      date: new Date("2026-02-15"),
      description: "Monthly utilities posting",
      postedAt: new Date("2026-02-15"),
      postedById: manager.id,
      createdById: orgAdmin.id,
      lines: {
        create: [
          {
            accountName: "Utilities Expense",
            debit: new Prisma.Decimal(2500000),
            credit: new Prisma.Decimal(0),
          },
          {
            accountName: "Cash",
            debit: new Prisma.Decimal(0),
            credit: new Prisma.Decimal(2500000),
          },
        ],
      },
    },
  });

  const [employeeA, employeeB] = await Promise.all([
    prisma.employee.create({
      data: {
        orgId: org.id,
        branchId: hqBranch.id,
        employeeCode: "EMP-HQ-001",
        name: "Rani Barista",
        email: "rani@solvix.id",
        position: "Head Barista",
        baseSalary: new Prisma.Decimal(6500000),
      },
    }),
    prisma.employee.create({
      data: {
        orgId: org.id,
        branchId: retailBranch.id,
        employeeCode: "EMP-RTL-001",
        name: "Tono Cashier",
        email: "tono@solvix.id",
        position: "Cashier",
        baseSalary: new Prisma.Decimal(4800000),
      },
    }),
  ]);

  await prisma.attendance.createMany({
    data: [
      {
        orgId: org.id,
        branchId: hqBranch.id,
        employeeId: employeeA.id,
        date: new Date("2026-02-24"),
        status: AttendanceStatus.PRESENT,
        hours: new Prisma.Decimal(8),
      },
      {
        orgId: org.id,
        branchId: retailBranch.id,
        employeeId: employeeB.id,
        date: new Date("2026-02-24"),
        status: AttendanceStatus.PRESENT,
        hours: new Prisma.Decimal(8),
      },
    ],
  });

  const project = await prisma.project.create({
    data: {
      orgId: org.id,
      branchId: hqBranch.id,
      code: "PRJ-2026-001",
      name: "POS Integration Upgrade",
      client: "Internal",
      budget: new Prisma.Decimal(85000000),
      status: ProjectStatus.ACTIVE,
      startDate: new Date("2026-02-01"),
      createdById: orgAdmin.id,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        orgId: org.id,
        branchId: hqBranch.id,
        projectId: project.id,
        title: "Define API contract",
        description: "POS to ERP sales sync",
        status: TaskStatus.DONE,
        assigneeId: employeeA.id,
      },
      {
        orgId: org.id,
        branchId: hqBranch.id,
        projectId: project.id,
        title: "Implement webhook retries",
        description: "Handle payment reconciliation",
        status: TaskStatus.IN_PROGRESS,
        assigneeId: employeeA.id,
      },
      {
        orgId: org.id,
        branchId: hqBranch.id,
        projectId: project.id,
        title: "UAT for retail branch",
        status: TaskStatus.BACKLOG,
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        orgId: org.id,
        branchId: retailBranch.id,
        userId: staff.id,
        action: "CREATE",
        entity: "PURCHASE_REQUEST",
        entityId: prSubmitted.id,
        details: { number: "PR-2026-0001", status: "SUBMITTED" },
      },
      {
        orgId: org.id,
        branchId: hqBranch.id,
        userId: manager.id,
        action: "APPROVE",
        entity: "PURCHASE_REQUEST",
        entityId: prApproved.id,
        details: { number: "PR-2026-0002", status: "APPROVED" },
      },
      {
        orgId: org.id,
        branchId: hqBranch.id,
        userId: manager.id,
        action: "POST",
        entity: "JOURNAL_ENTRY",
        entityId: journal.id,
        details: { entryNumber: "JR-2026-0001" },
      },
      {
        orgId: org.id,
        branchId: hqBranch.id,
        userId: orgAdmin.id,
        action: "STATUS_CHANGE",
        entity: "INVOICE",
        entityId: invoice2.id,
        details: { from: "DRAFT", to: "ISSUED" },
      },
    ],
  });

  console.log("Seed completed.");
  console.log("Demo users: super@solvix.id / admin@solvix.id / manager@solvix.id / staff@solvix.id / viewer@solvix.id");
  console.log("Password: solvix123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
