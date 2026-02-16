import { VideoForm } from "@/components/VideoForm";

export default function NewVideoPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">
        Add Manual Video
      </h1>
      <VideoForm />
    </div>
  );
}
