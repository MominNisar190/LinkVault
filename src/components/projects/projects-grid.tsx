"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, FolderOpen, Trash2, Edit2, Link2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, type CreateProjectInput } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

const PRESET_COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#14b8a6"];

interface ProjectsGridProps {
  initialProjects: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    isDefault: boolean;
    _count: { links: number };
  }[];
}

export function ProjectsGrid({ initialProjects }: ProjectsGridProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const { data: projects = initialProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      const json = await res.json();
      return json.data ?? [];
    },
    initialData: initialProjects,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Project created" });
      setOpen(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Project deleted" });
    },
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { color: PRESET_COLORS[0] },
  });

  function onSubmit(data: CreateProjectInput) {
    createMutation.mutate({ ...data, color: selectedColor });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...register("name")} placeholder="My Project" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input {...register("description")} placeholder="Optional description" />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setSelectedColor(c); setValue("color", c); }}
                      className="h-7 w-7 rounded-full transition-all"
                      style={{
                        backgroundColor: c,
                        outline: selectedColor === c ? `2px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full gap-2">
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {projects.map((project: any, i: number) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:border-border transition-colors group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <FolderOpen className="h-5 w-5" style={{ color: project.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      {project.isDefault && (
                        <span className="text-xs text-muted-foreground">Default</span>
                      )}
                    </div>
                  </div>
                  {!project.isDefault && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(project.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Link2 className="h-3.5 w-3.5" />
                    <span>{project._count?.links ?? 0} links</span>
                  </div>
                  <Link href={`/dashboard/links?projectId=${project.id}`}>
                    <Button size="sm" variant="ghost" className="text-xs h-7 px-2">
                      View Links
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No projects yet. Create one to organise your links.</p>
        </div>
      )}
    </div>
  );
}
