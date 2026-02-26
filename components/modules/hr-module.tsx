"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { PlusCircle } from "lucide-react";
import { toast } from "@/lib/toast";

import { DataTable } from "@/components/tables/data-table";
import { EmptyState } from "@/components/modules/empty-state";
import { KpiCard } from "@/components/modules/kpi-card";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { toNumber } from "@/lib/utils";

async function fetchEmployees() {
  const response = await fetch("/api/hr/employees");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat employee");
  return payload.data as Array<{
    id: string;
    employeeCode: string;
    name: string;
    position: string;
    email: string | null;
    baseSalary: string | number;
    branch: { code: string; name: string };
    isActive: boolean;
  }>;
}

async function fetchAttendance() {
  const response = await fetch("/api/hr/attendance");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat attendance");
  return payload.data as Array<{
    id: string;
    employeeId: string;
    date: string;
    status: string;
    hours: string | number;
    employee: { name: string; employeeCode: string };
  }>;
}

export function HrModule() {
  const queryClient = useQueryClient();

  const [openEmployee, setOpenEmployee] = useState(false);
  const [openAttendance, setOpenAttendance] = useState(false);

  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: fetchEmployees });
  const { data: attendances = [] } = useQuery({ queryKey: ["attendance"], queryFn: fetchAttendance });

  const createEmployee = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menambah employee");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setOpenEmployee(false);
      toast.success("Employee berhasil ditambahkan.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const createAttendance = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/hr/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menyimpan attendance");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setOpenAttendance(false);
      toast.success("Attendance berhasil disimpan.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const payrollTotal = employees.reduce((acc, employee) => acc + toNumber(employee.baseSalary), 0);
  const presentCount = attendances.filter((attendance) => attendance.status === "PRESENT").length;

  const employeeColumns = useMemo<ColumnDef<(typeof employees)[number]>[]>(
    () => [
      { accessorKey: "employeeCode", header: "Code" },
      { accessorKey: "name", header: "Nama" },
      { accessorKey: "position", header: "Posisi" },
      { accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email || "-" },
      { accessorKey: "baseSalary", header: "Base Salary", cell: ({ row }) => formatCurrency(row.original.baseSalary) },
      { accessorKey: "branch", header: "Branch", cell: ({ row }) => row.original.branch.code },
    ],
    [],
  );

  const attendanceColumns = useMemo<ColumnDef<(typeof attendances)[number]>[]>(
    () => [
      { accessorKey: "employee", header: "Employee", cell: ({ row }) => row.original.employee.name },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { accessorKey: "hours", header: "Hours" },
      { accessorKey: "date", header: "Date", cell: ({ row }) => formatDate(row.original.date) },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="HR"
        description="Kelola employee, attendance summary, dan payroll summary sederhana."
        actions={
          <>
            <Dialog open={openAttendance} onOpenChange={setOpenAttendance}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusCircle className="h-4 w-4" /> Attendance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Input Attendance</DialogTitle>
                </DialogHeader>
                <form
                  id="attendance-form"
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    createAttendance.mutate({
                      employeeId: String(formData.get("employeeId") ?? ""),
                      date: String(formData.get("date") ?? ""),
                      status: String(formData.get("status") ?? "PRESENT"),
                      hours: toNumber(String(formData.get("hours") ?? "8")),
                    });
                  }}
                >
                  <div className="space-y-1.5">
                    <Label>Employee</Label>
                    <Select name="employeeId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.employeeCode} - {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select name="status" defaultValue="PRESENT">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRESENT">PRESENT</SelectItem>
                        <SelectItem value="SICK">SICK</SelectItem>
                        <SelectItem value="LEAVE">LEAVE</SelectItem>
                        <SelectItem value="ABSENT">ABSENT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="attendance-hours">Hours</Label>
                      <Input id="attendance-hours" name="hours" type="number" min={0} max={24} step="0.5" defaultValue={8} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="attendance-date">Date</Label>
                      <Input id="attendance-date" name="date" type="date" required />
                    </div>
                  </div>
                </form>
                <DialogFooter>
                  <Button type="submit" form="attendance-form" disabled={createAttendance.isPending}>
                    Simpan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={openEmployee} onOpenChange={setOpenEmployee}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4" /> Employee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Employee</DialogTitle>
                </DialogHeader>
                <form
                  id="employee-form"
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    createEmployee.mutate({
                      employeeCode: String(formData.get("employeeCode") ?? ""),
                      name: String(formData.get("name") ?? ""),
                      email: String(formData.get("email") ?? "") || undefined,
                      phone: String(formData.get("phone") ?? "") || undefined,
                      position: String(formData.get("position") ?? ""),
                      baseSalary: toNumber(String(formData.get("baseSalary") ?? "0")),
                    });
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="employee-code">Code</Label>
                      <Input id="employee-code" name="employeeCode" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="employee-position">Posisi</Label>
                      <Input id="employee-position" name="position" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="employee-name">Nama</Label>
                    <Input id="employee-name" name="name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="employee-email">Email</Label>
                    <Input id="employee-email" name="email" type="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="employee-phone">Phone</Label>
                    <Input id="employee-phone" name="phone" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="employee-salary">Base Salary</Label>
                    <Input id="employee-salary" name="baseSalary" type="number" min={0} required />
                  </div>
                </form>
                <DialogFooter>
                  <Button type="submit" form="employee-form" disabled={createEmployee.isPending}>
                    Simpan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <KpiCard label="Total Employees" value={String(employees.length)} variant="violet" />
        <KpiCard label="Present Records" value={String(presentCount)} variant="teal" />
        <KpiCard label="Payroll Summary" value={formatCurrency(payrollTotal)} variant="amber" />
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            {employees.length === 0 ? (
              <EmptyState title="Belum ada employee" description="Tambahkan employee pertama untuk mulai HR tracking." />
            ) : (
              <DataTable columns={employeeColumns} data={employees} searchColumn="name" searchPlaceholder="Cari employee..." />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            {attendances.length === 0 ? (
              <EmptyState title="Belum ada attendance" description="Input attendance manual per employee." />
            ) : (
              <DataTable columns={attendanceColumns} data={attendances} searchColumn="status" searchPlaceholder="Cari status..." />
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

