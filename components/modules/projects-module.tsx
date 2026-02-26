"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";

import { DataTable } from "@/components/tables/data-table";
import { EmptyState } from "@/components/modules/empty-state";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { toNumber } from "@/lib/utils";

async function fetchProjects() {
  const response = await fetch("/api/projects/projects");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat projects");
  return payload.data as Array<{
    id: string;
    code: string;
    name: string;
    client: string | null;
    budget: string | number;
    status: string;
    tasks: Array<{
      id: string;
      title: string;
      description: string | null;
      status: "BACKLOG" | "IN_PROGRESS" | "DONE";
      assignee: { name: string } | null;
    }>;
  }>;
}

async function fetchEmployees() {
  const response = await fetch("/api/hr/employees");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Gagal memuat employee");
  return payload.data as Array<{ id: string; name: string; employeeCode: string }>;
}

const taskColumns: Array<{ id: "BACKLOG" | "IN_PROGRESS" | "DONE"; label: string }> = [
  { id: "BACKLOG", label: "Backlog" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "DONE", label: "Done" },
];

export function ProjectsModule() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [openProject, setOpenProject] = useState(false);
  const [openTask, setOpenTask] = useState(false);

  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: fetchEmployees });

  const createProject = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/projects/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal membuat project");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpenProject(false);
      toast.success("Project berhasil dibuat.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const createTask = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/projects/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_TASK", payload }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal membuat task");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpenTask(false);
      toast.success("Task berhasil ditambahkan.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const moveTask = useMutation({
    mutationFn: async (payload: { taskId: string; status: "BACKLOG" | "IN_PROGRESS" | "DONE" }) => {
      const response = await fetch("/api/projects/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MOVE_TASK", payload }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal memindahkan task");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Status task berhasil diubah.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch("/api/projects/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_TASK",
          payload: { taskId },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menghapus task");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Task berhasil dihapus.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Terjadi kesalahan."),
  });

  const projectColumns = useMemo<ColumnDef<(typeof projects)[number]>[]>(
    () => [
      { accessorKey: "code", header: "Code" },
      { accessorKey: "name", header: "Project" },
      { accessorKey: "client", header: "Client", cell: ({ row }) => row.original.client || "Internal" },
      { accessorKey: "budget", header: "Budget", cell: ({ row }) => formatCurrency(row.original.budget) },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { id: "tasks", header: "Tasks", cell: ({ row }) => row.original.tasks.length },
    ],
    [projects],
  );

  const selectedProject = projects[0] ?? null;

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Project CRUD + task kanban board Backlog / In Progress / Done."
        actions={
          <>
            <Dialog open={openTask} onOpenChange={setOpenTask}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusCircle className="h-4 w-4" /> Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Task</DialogTitle>
                  <DialogDescription>Pilih project lalu assign task ke employee.</DialogDescription>
                </DialogHeader>
                <form
                  id="task-form"
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    createTask.mutate({
                      projectId: String(formData.get("projectId") ?? ""),
                      title: String(formData.get("title") ?? ""),
                      description: String(formData.get("description") ?? "") || undefined,
                      status: String(formData.get("status") ?? "BACKLOG"),
                      assigneeId: String(formData.get("assigneeId") ?? "") || undefined,
                    });
                  }}
                >
                  <div className="space-y-1.5">
                    <Label>Project</Label>
                    <Select name="projectId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.code} - {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="task-title">Title</Label>
                    <Input id="task-title" name="title" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea id="task-description" name="description" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select name="status" defaultValue="BACKLOG">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BACKLOG">Backlog</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="DONE">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Assignee</Label>
                      <Select name="assigneeId">
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
                  </div>
                </form>
                <DialogFooter>
                  <Button form="task-form" type="submit" disabled={createTask.isPending}>
                    Simpan Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={openProject} onOpenChange={setOpenProject}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4" /> Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Project</DialogTitle>
                </DialogHeader>
                <form
                  id="project-form"
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    createProject.mutate({
                      code: String(formData.get("code") ?? ""),
                      name: String(formData.get("name") ?? ""),
                      client: String(formData.get("client") ?? "") || undefined,
                      budget: toNumber(String(formData.get("budget") ?? "0")),
                      status: String(formData.get("status") ?? "PLANNING"),
                      startDate: String(formData.get("startDate") ?? "") || undefined,
                      endDate: String(formData.get("endDate") ?? "") || undefined,
                    });
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="project-code">Code</Label>
                      <Input id="project-code" name="code" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select name="status" defaultValue="PLANNING">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PLANNING">Planning</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="ON_HOLD">On Hold</SelectItem>
                          <SelectItem value="DONE">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="project-name">Nama</Label>
                    <Input id="project-name" name="name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="project-client">Client</Label>
                    <Input id="project-client" name="client" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="project-budget">Budget</Label>
                    <Input id="project-budget" name="budget" type="number" min={0} required />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="project-start">Start Date</Label>
                      <Input id="project-start" name="startDate" type="date" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="project-end">End Date</Label>
                      <Input id="project-end" name="endDate" type="date" />
                    </div>
                  </div>
                </form>
                <DialogFooter>
                  <Button form="project-form" type="submit" disabled={createProject.isPending}>
                    Simpan Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Project List</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            {projects.length === 0 ? (
              <EmptyState title="Belum ada project" description="Buat project baru untuk mulai task tracking." />
            ) : (
              <DataTable columns={projectColumns} data={projects} searchColumn="name" searchPlaceholder="Cari project..." />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="kanban">
          {!selectedProject ? (
            <EmptyState title="Belum ada project" description="Kanban tersedia setelah project dibuat." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {taskColumns.map((column) => {
                const tasks = selectedProject.tasks.filter((task) => task.status === column.id);

                return (
                  <Card key={column.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{column.label}</h3>
                      <StatusBadge status={column.id} />
                    </div>
                    {tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Tidak ada task.</p>
                    ) : (
                      tasks.map((task) => (
                        <div key={task.id} className="rounded-2xl border border-border/70 bg-background/45 p-3">
                          <p className="font-medium">{task.title}</p>
                          {task.description ? <p className="mt-1 text-xs text-muted-foreground">{task.description}</p> : null}
                          <p className="mt-2 text-xs text-muted-foreground">{task.assignee?.name ?? "Unassigned"}</p>
                          <div className="mt-2 flex gap-1">
                            {column.id !== "BACKLOG" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const targetStatus = column.id === "DONE" ? "IN_PROGRESS" : "BACKLOG";
                                  const proceed = await confirm({
                                    title: "Ubah Status Task",
                                    description: `Ubah status task ke ${targetStatus.replace("_", " ")}?`,
                                    confirmText: "Ubah",
                                    cancelText: "Batal",
                                  });
                                  if (!proceed) return;
                                  moveTask.mutate({
                                    taskId: task.id,
                                    status: targetStatus,
                                  });
                                }}
                              >
                                ←
                              </Button>
                            ) : null}
                            {column.id !== "DONE" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const targetStatus = column.id === "BACKLOG" ? "IN_PROGRESS" : "DONE";
                                  const proceed = await confirm({
                                    title: "Ubah Status Task",
                                    description: `Ubah status task ke ${targetStatus.replace("_", " ")}?`,
                                    confirmText: "Ubah",
                                    cancelText: "Batal",
                                  });
                                  if (!proceed) return;
                                  moveTask.mutate({
                                    taskId: task.id,
                                    status: targetStatus,
                                  });
                                }}
                              >
                                →
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const proceed = await confirm({
                                  title: "Hapus Task",
                                  description: "Yakin ingin menghapus task ini?",
                                  confirmText: "Hapus",
                                  cancelText: "Batal",
                                  intent: "danger",
                                });
                                if (!proceed) return;
                                deleteTask.mutate(task.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

