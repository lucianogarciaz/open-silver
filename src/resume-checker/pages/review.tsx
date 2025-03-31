import FeedbackForm from "@/resume-checker/components/feedback-form";
import Flags from "@/resume-checker/components/flags";
import PDF from "@/resume-checker/components/pdf";
import Score from "@/resume-checker/components/score";
import Skeleton from "@/resume-checker/components/skeleton";
import { useFormState } from "@/resume-checker/hooks/form-context";
import type { FormState } from "@/resume-checker/types";
import { sendGAEvent } from "@next/third-parties/google";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Review() {
  const router = useRouter();
  const [formState] = useFormState();
  const searchParams = useSearchParams();
  const [isFeedbackFormOpen, setFeedbackFormOpen] = useState(false);

  const urlFromQuery = searchParams?.get("url");

  const mutation = useMutation<
    FormState,
    Error,
    | { url: string; formData?: undefined }
    | { formData: FormData; url?: undefined }
  >({
    mutationKey: ["resume-check"],
    mutationFn: async ({ url, formData }) => {
      let res;

      if (formData) {
        res = await fetch("/api/grade", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/grade?url=" + url, {
          method: "GET",
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          "error" in err ? err.error : "Hubo un error inesperado"
        );
      }

      return res.json();
    },
    onMutate: () => {
      sendGAEvent("event", "resume-checker-submission");
    },
    onSuccess: (data) => {
      sendGAEvent("event", "resume-checker-success", data);
    },
    onError: (e) => {
      sendGAEvent("event", "resume-checker-error", e);
      router.push("/resume-checker");
    },
  });

  useEffect(() => {
    if (urlFromQuery) {
      mutation.mutate({ url: urlFromQuery });
    } else if (formState.url) {
      mutation.mutate({ url: formState.url });
    } else if (formState.formData) {
      mutation.mutate({ formData: formState.formData });
    } else {
      router.push("/resume-checker");
    }
  }, [formState.formData, formState.url, urlFromQuery]);

  const isExample = (url: string) => {
    return url?.startsWith("public/") && url?.endsWith("_resume.pdf");
  };

  const isVictorVigon = isExample(formState.url || urlFromQuery || "");

  return (
    <>
      <div className="mt-6 animate-fly-in container mx-auto px-4 grid lg:grid-cols-2 gap-6">
        <PDF />
        <div>
          <h2 className="text-2xl mb-4">El Puntaje de tu CV</h2>
          <div className="mb-8">
            <Score letter={mutation?.data?.grade} />
          </div>
          <div className="mb-8">
            {mutation.isPending ? <Skeleton /> : null}
            {!mutation.isPending && isVictorVigon ? (
              <p>
                Este resume fue elaborado en{" "}
                <Link
                  href="https://ready.silver.dev"
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Interview Ready
                </Link>{" "}
                con la siguiente{" "}
                <Link
                  target="_blank"
                  href="https://docs.silver.dev/interview-ready/soft-fundamentals/preparando-el-cv"
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  guía
                </Link>
              </p>
            ) : null}
            {mutation.data && mutation.data?.red_flags.length > 0 ? (
              <Flags
                flags={mutation.data.red_flags}
                color="red"
                label={`Red
                flag${mutation.data.red_flags.length > 1 ? "s" : ""}`}
              />
            ) : null}
            {mutation.data && mutation.data?.yellow_flags.length > 0 ? (
              <Flags
                flags={mutation.data.yellow_flags}
                color="yellow"
                label={`Yellow flag${mutation.data.yellow_flags.length > 1 ? "s" : ""}`}
              />
            ) : null}
          </div>

          {mutation.isPending ? (
            <p className="opacity-0 animate-[fadeIn_200ms_ease-in_3s_forwards] px-4 py-2 text-center bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-semibold rounded-lg shadow-md border border-gray-300 dark:border-gray-700">
              <span className="mr-2 text-blue-500 dark:text-blue-400">●</span>
              El proceso puede tardar un hasta 2 minutos...
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <Link
                href="/resume-checker"
                className="px-10 py-2 text-center block rounded-lg bg-indigo-800 font-bold hover:bg-indigo-600 cursor-pointer text-white"
              >
                Probá otra vez
              </Link>
              <button onClick={() => setFeedbackFormOpen(true)}>
                Dijo cualquiera?{" "}
                <span className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200 cursor-pointer">
                  Avisanos...
                </span>
              </button>
            </div>
          )}
        </div>
        <hr className="w-full my-8 lg:col-span-2" />
        <h2 className="w-full my-6 text-3xl text-center lg:col-span-2">
          Resume Checker es de{" "}
          <Link
            href="https://ready.silver.dev"
            className="text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            Interview Ready
          </Link>
        </h2>
        <p className="mt-0 text-center lg:col-span-2">
          Esta herramienta es parte de un programa integral de preparación de
          entrevistas.
          <br />
          Podes ver el formato y más contenido en el video.
        </p>
        <iframe
          className="rounded-lg shadow-lg mt-4 max-w-xs md:max-w-none mx-auto lg:col-span-2"
          width="560"
          height="315"
          src="https://www.youtube.com/embed/D-OYA2UzlJQ?si=p3dHHaOvHH8VrN1Z"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        ></iframe>
      </div>
      {mutation.isSuccess ? (
        <FeedbackForm
          data={mutation.data}
          setFeedbackFormOpen={setFeedbackFormOpen}
          isFeedbackFormOpen={isFeedbackFormOpen}
        />
      ) : null}
    </>
  );
}
