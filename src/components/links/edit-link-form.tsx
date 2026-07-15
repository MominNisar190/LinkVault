"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronDown, ChevronUp, Shuffle, Eye, EyeOff } from "lucide-react";
import { updateLinkSchema, type UpdateLinkInput } from "@/lib/validations";
import { useUpdateLink } from "@/hooks/use-links";
import { generateSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface EditLinkFormProps {
  link: {
    id: string;
    slug: string;
    destinationUrl: string;
    title: string | null;
    description: string | null;
    notes: string | null;
    redirectDelay: number;
    maxClicks: number | null;
    expiresAt: Date | null;
    tags: string[];
    ogImage: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    faviconUrl: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
  };
}

export function EditLinkForm({ link }: EditLinkFormProps) {
  const router = useRouter();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const { mutateAsync, isPending } = useUpdateLink();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateLinkInput>({
    resolver: zodResolver(updateLinkSchema),
    defaultValues: {
      id: link.id,
      destinationUrl: link.destinationUrl,
      title: link.title ?? "",
      description: link.description ?? "",
      notes: link.notes ?? "",
      redirectDelay: link.redirectDelay,
      maxClicks: link.maxClicks ?? undefined,
      expiresAt: link.expiresAt ?? undefined,
      tags: link.tags ?? [],
      ogImage: link.ogImage ?? "",
      ogTitle: link.ogTitle ?? "",
      ogDescription: link.ogDescription ?? "",
      faviconUrl: link.faviconUrl ?? "",
      utmSource: link.utmSource ?? "",
      utmMedium: link.utmMedium ?? "",
      utmCampaign: link.utmCampaign ?? "",
    },
  });

  const tags = watch("tags") ?? [];

  function addTag(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag) && tags.length < 10) {
        setValue("tags", [...tags, tag]);
        setTagInput("");
      }
    }
  }

  function removeTag(tag: string) {
    setValue("tags", tags.filter((t) => t !== tag));
  }

  async function onSubmit(data: UpdateLinkInput) {
    await mutateAsync({ ...data });
    router.push(`/dashboard/links/${link.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register("id")} />

      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Destination URL */}
          <div className="space-y-2">
            <Label htmlFor="destinationUrl">
              Destination URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="destinationUrl"
              placeholder="https://example.com"
              {...register("destinationUrl")}
              className={errors.destinationUrl ? "border-destructive" : ""}
            />
            {errors.destinationUrl && (
              <p className="text-xs text-destructive">{errors.destinationUrl.message}</p>
            )}
          </div>

          {/* Change note */}
          <div className="space-y-2">
            <Label htmlFor="changeNote">Change Note (optional)</Label>
            <Input
              id="changeNote"
              placeholder="Why are you updating this link?"
              {...register("changeNote")}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="My awesome link" {...register("title")} />
          </div>
        </CardContent>
      </Card>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Advanced Options
        <Separator className="flex-1" />
      </button>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-6 space-y-5">
                {/* Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea {...register("description")} rows={3} />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label>Password (leave blank to keep current)</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="New password or leave blank"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expiry + Max clicks */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiration Date</Label>
                    <Input type="datetime-local" {...register("expiresAt")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Clicks</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Unlimited"
                      {...register("maxClicks", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {/* Redirect Delay */}
                <div className="space-y-2">
                  <Label>Redirect Delay (seconds)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    {...register("redirectDelay", { valueAsNumber: true })}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder="Press Enter to add tag"
                  />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer gap-1"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Internal Notes</Label>
                  <Textarea {...register("notes")} rows={2} />
                </div>

                {/* OG */}
                <div className="space-y-2">
                  <Label>Open Graph Image URL</Label>
                  <Input placeholder="https://..." {...register("ogImage")} />
                </div>

                {/* UTM */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                    UTM Parameters
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Source</Label>
                      <Input placeholder="google" {...register("utmSource")} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Medium</Label>
                      <Input placeholder="cpc" {...register("utmMedium")} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Campaign</Label>
                      <Input placeholder="spring_sale" {...register("utmCampaign")} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="flex-1 gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
