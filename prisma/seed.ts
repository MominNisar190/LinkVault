import { PrismaClient, UserRole, LinkStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  const passwordHash = await bcrypt.hash("Admin@1234", 12);

  // First user → SUPER_ADMIN + auto-approved
  const admin = await prisma.user.upsert({
    where: { email: "admin@linkvault.dev" },
    update: {},
    create: {
      email:         "admin@linkvault.dev",
      name:          "Admin User",
      passwordHash,
      role:          UserRole.SUPER_ADMIN,
      status:        "ACTIVE",
      emailVerified: true,
      settings: { create: {} },
    },
  });

  console.log(`✅ Admin created → admin@linkvault.dev / Admin@1234`);

  // Default project
  const project = await prisma.project.upsert({
    where: { id: "default_project_seed" },
    update: {},
    create: {
      id:          "default_project_seed",
      userId:      admin.id,
      name:        "My Links",
      description: "Default project",
      isDefault:   true,
      color:       "#6366f1",
    },
  });

  // Sample links
  const sampleLinks = [
    { slug: "google",  destinationUrl: "https://google.com",       title: "Google Search",    tags: ["search"]      },
    { slug: "github",  destinationUrl: "https://github.com",       title: "GitHub",           tags: ["dev", "code"] },
    { slug: "docs",    destinationUrl: "https://nextjs.org/docs",  title: "Next.js Docs",     tags: ["docs"]        },
  ];

  for (const linkData of sampleLinks) {
    await prisma.dynamicLink.upsert({
      where: { slug: linkData.slug },
      update: {},
      create: {
        userId:       admin.id,
        projectId:    project.id,
        status:       LinkStatus.ACTIVE,
        totalClicks:  Math.floor(Math.random() * 200),
        uniqueClicks: Math.floor(Math.random() * 100),
        ...linkData,
      },
    });
  }

  console.log("✅ Sample links created");
  console.log("\n📋 Login credentials:");
  console.log("   Email:    admin@linkvault.dev");
  console.log("   Password: Admin@1234");
  console.log("\n🚀 Run: npm run dev");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
