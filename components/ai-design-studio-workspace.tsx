import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type StudioWorkspaceProps = {
  mode: "upload" | "design";
};

const content = {
  upload: {
    title: "Upload Sketch",
    previewTitle: "Preview",
    previewDescription: "Sketch preview",
  },
  design: {
    title: "Design Your Way",
    previewTitle: "Preview",
    previewDescription: "Generated result",
  },
} as const;

export function AIDesignStudioWorkspace({ mode }: StudioWorkspaceProps) {
  const config = content[mode];

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-350 flex-col overflow-x-hidden px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-start">
        <Button
          asChild
          variant="outline"
          className="rounded-full border-slate-200 bg-white/90 px-4 text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <Link href="/dashboard/ai-design-studio">
            <ArrowLeft className="h-4 w-4" />
            Studio
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid min-h-0 flex-1 gap-5 lg:grid-cols-2">
        <Card className="flex h-full min-h-0 min-w-0 flex-col rounded-[1.9rem] border-amber-200/90 bg-[#fffdf8] shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
          <CardHeader className="px-6 py-5 md:px-8 md:py-6">
            <CardTitle className="text-2xl text-slate-950">
              {mode === "upload" ? "Upload" : "Prompt"}
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-600">
              {mode === "upload"
                ? "Start from a sketch or reference image."
                : "Describe the jewelry piece clearly."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6 md:px-8 md:pb-6">
            {mode === "upload" ? (
              <>
                <div className="flex min-h-55 w-full flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-amber-200 bg-amber-50/35 px-6 py-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-white text-amber-800 shadow-sm">
                    <Upload className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-950">
                    Drop image here
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                    Drag and drop or choose a file.
                  </p>
                  <Button className="mt-5 rounded-full bg-slate-900 px-6 text-white shadow-sm transition-colors hover:bg-slate-800">
                    Choose File
                  </Button>
                </div>

                <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-sm font-medium text-slate-700">
                    Optional suggestion
                  </p>
                  <Textarea
                    placeholder="Add a short prompt or styling note for this sketch."
                    className="mt-3 min-h-24 rounded-3xl border-slate-200 bg-white text-sm shadow-none focus-visible:ring-amber-200"
                  />
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-90 w-full flex-1 flex-col rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 lg:min-h-0">
                <p className="text-sm font-medium text-slate-700">Prompt</p>
                <Textarea
                  placeholder="Elegant 22k gold necklace with a modern lotus motif."
                  className="mt-4 min-h-55 flex-1 rounded-[1.1rem] border-slate-200 bg-white text-sm shadow-none focus-visible:ring-amber-200 lg:min-h-0"
                />
                <div className="mt-4 flex justify-start">
                  <Button className="rounded-full bg-slate-900 px-6 text-white shadow-sm transition-colors hover:bg-slate-800">
                    Start Designing
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-0 min-w-0 flex-col rounded-[1.9rem] border-slate-200 bg-slate-50/80 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
          <CardHeader className="px-6 py-5 md:px-8 md:py-6">
            <CardTitle className="text-2xl text-slate-950">
              {config.previewTitle}
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-600">
              {config.previewDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 px-6 pb-6 md:px-8 md:pb-8">
            <div className="flex h-full min-h-90 w-full flex-1 flex-col items-center justify-center rounded-[1.5rem] border border-slate-200 bg-white px-6 py-8 text-center lg:min-h-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-slate-100 text-slate-500">
                {mode === "upload" ? (
                  <ImageIcon className="h-7 w-7" />
                ) : (
                  <Sparkles className="h-7 w-7" />
                )}
              </div>
              <p className="mt-5 text-sm font-medium text-slate-700">
                {mode === "upload" ? "No preview yet" : "Generated result"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type StudioChoiceCardProps = {
  href: string;
  title: string;
  description: string;
  icon: "upload" | "design";
};

export function StudioChoiceCard({
  href,
  title,
  description,
  icon,
}: StudioChoiceCardProps) {
  const Icon = icon === "upload" ? Upload : Sparkles;

  return (
    <Link href={href} className="group block h-full">
      <Card className="flex h-full min-h-80 flex-col justify-between rounded-[2rem] border-amber-200/90 bg-[linear-gradient(180deg,rgba(255,253,248,1),rgba(255,248,235,0.82))] shadow-[0_24px_60px_rgba(15,23,42,0.05)] transition-transform duration-300 group-hover:shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
        <CardHeader className="px-7 py-7 md:px-8 md:py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white text-amber-800 shadow-sm">
            <Icon className="h-7 w-7" />
          </div>
          <CardTitle className="pt-6 text-3xl text-slate-950">
            {title}
          </CardTitle>
          <CardDescription className="max-w-md text-sm leading-6 text-slate-600">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-7 pb-7 md:px-8 md:pb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors group-hover:bg-slate-800">
            Open
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}