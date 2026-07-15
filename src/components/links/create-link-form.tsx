"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, Eye, EyeOff, ChevronDown, ChevronUp, Loader2, Link2 } from "lucide-react";
import { createLinkSchema, type CreateLinkInput } from "@/lib/validations";
import { useCreateLink } from "@/hooks/use-links";
import { buildShortUrl, generateSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export function CreateLinkForm() {
  const router = useRouter();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const { mutateAsync, isPending } = useCreateLink();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateLinkInput>({
    resolver: zodResolver(createLinkSchema),
    defaultValues: { tags: [], redirectDelay: 0, slug: generateSlug(6) },
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

  async function onSubmit(data: CreateLinkInput) {
    const link = await mutateAsync(data as Record<string, unknown>);
    if (link) router.push("/dashboard/links");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Destination URL */}
          <div className="space-y-2">
            <Label htmlFor="destinationUrl">
              Destination URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="destinationUrl"
              placeholder="https://example.com/your-long-url"
              {...register("destinationUrl")}
              className={errors.destinationUrl ? "border-destructive" : ""}
            />
            {errors.destinationUrl && (
              <p className="text-xs text-destructive">{errors.destinationUrl.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="My awesome link" {...register("title")} />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Short URL Slug</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="slug"
                  placeholder="auto-generated"
                  {...register("slug")}
                  className={errors.slug ? "border-destructive" : ""}
                />
                {errors.slug && (
                  <p className="text-xs text-destructive mt-1">{errors.slug.message}</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setValue("slug", generateSlug(6))}
                title="Generate random slug"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
            {/* Live URL preview */}
            {watch("slug") && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <a
                  href={buildShortUrl(watch("slug")!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-primary hover:underline break-all"
                >
                  {buildShortUrl(watch("slug")!)}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options Toggle */}
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
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-6 space-y-5">
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional notes about this link"
                    {...register("description")}
                    rows={3}
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password Protection</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Leave blank for no password"
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
                    <Label htmlFor="expiresAt">Expiration Date</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      {...register("expiresAt")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxClicks">Max Clicks</Label>
                    <Input
                      id="maxClicks"
                      type="number"
                      min={1}
                      placeholder="Unlimited"
                      {...register("maxClicks", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {/* Redirect Delay */}
                <div className="space-y-2">
                  <Label htmlFor="redirectDelay">Redirect Delay (seconds)</Label>
                  <Input
                    id="redirectDelay"
                    type="number"
                    min={0}
                    max={30}
                    defaultValue={0}
                    {...register("redirectDelay", { valueAsNumber: true })}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tagInput">Tags</Label>
                  <Input
                    id="tagInput"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder="Press Enter or comma to add tag"
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
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Private notes (not shown publicly)"
                    {...register("notes")}
                    rows={2}
                  />
                </div>

                {/* OG Image */}
                <div className="space-y-2">
                  <Label htmlFor="ogImage">Open Graph Image URL</Label>
                  <Input
                    id="ogImage"
                    placeholder="https://example.com/og-image.png"
                    {...register("ogImage")}
                  />
                </div>

                {/* UTM */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                    UTM Parameters
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="utmSource" className="text-xs">Source</Label>
                      <Input id="utmSource" placeholder="google" {...register("utmSource")} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="utmMedium" className="text-xs">Medium</Label>
                      <Input id="utmMedium" placeholder="cpc" {...register("utmMedium")} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="utmCampaign" className="text-xs">Campaign</Label>
                      <Input id="utmCampaign" placeholder="spring_sale" {...register("utmCampaign")} />
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
          {isPending ? "Creating..." : "Create Link"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
