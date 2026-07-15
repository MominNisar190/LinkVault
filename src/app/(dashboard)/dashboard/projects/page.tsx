import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { projectRepository } from "@/repositories/project.repository";
import { ProjectsGrid } from "@/components/projects/projects-grid";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const projects = await projectRepository.findAllByUser(session.user.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-muted-foreground text-sm mt-1">Organise your links into projects</p>
      </div>
      <ProjectsGrid initialProjects={projects as any} />
    </div>
  );
}
