import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireAuth();

    const [links, projects] = await Promise.all([
      prisma.dynamicLink.findMany({
        where: { userId: user.id, deletedAt: null },
        include: {
          history: { orderBy: { createdAt: "desc" } },
          _count: { select: { analytics: true } },
        },
      }),
      prisma.project.findMany({
        where: { userId: user.id, deletedAt: null },
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      stats: {
        totalLinks: links.length,
        totalProjects: projects.length,
        totalClicks: links.reduce((sum, l) => sum + l.totalClicks, 0),
      },
      projects,
      links,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="linkvault-export-${Date.now()}.json"`,
      },
    });
  } catch (err) {
    return NextResponse.json(handleApiError(err), { status: 500 });
  }
}

