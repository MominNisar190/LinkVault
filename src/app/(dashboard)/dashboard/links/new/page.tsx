import { CreateLinkForm } from "@/components/links/create-link-form";

export const metadata = { title: "Create Link" };

export default function NewLinkPage() {
  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Link</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create a dynamic short link that you can update anytime
        </p>
      </div>
      <CreateLinkForm />
    </div>
  );
}
