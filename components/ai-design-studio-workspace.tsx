import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, Upload } from "lucide-react";
import { AIDesignStudioEditor } from "@/components/ai-design-studio-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StudioWorkspaceProps = {
  mode: "upload" | "design";
};

export function AIDesignStudioWorkspace({ mode }: StudioWorkspaceProps) {
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

      <div className="mt-6 flex min-h-0 flex-1">
        <AIDesignStudioEditor mode={mode} />
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
          <CardTitle className="pt-6 text-3xl text-slate-950">{title}</CardTitle>
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