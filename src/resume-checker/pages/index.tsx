"use client";

import ErrorBadge from "@/resume-checker/components/error-badge";
import { useFormState } from "@/resume-checker/hooks/form-context";
import { useMutationState } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useDropzone } from "react-dropzone";

function usePasteEvent(pasteListener: (event: ClipboardEvent) => void) {
  useEffect(() => {
    document.addEventListener("paste", pasteListener);

    return () => {
      document.removeEventListener("paste", pasteListener);
    };
  }, [pasteListener]);
}

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<Error | null>(null);
  const [, setFormState] = useFormState();

  const onDrop = useCallback(
    (files: File[]) => {
      const formData = new FormData();
      const [cvFile] = files;

      if (!cvFile) return;

      formData.set("resume", cvFile);
      setFormState({ formData });
      router.push("/resume-checker/review");
    },
    [router, setFormState]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [] },
    multiple: false,
  });

  usePasteEvent(async (event: ClipboardEvent) => {
    event.preventDefault();
    const data = event.clipboardData;
    if (!data) {
      return;
    }

    const url = data.getData("text").toString();
    if (!url.startsWith("https") || !url.endsWith(".pdf")) {
      setError(
        new Error("El URL tiene que empezar con 'https' y terminar con 'pdf'")
      );
      return;
    }
    setFormState({ url });
    router.push("/resume-checker/review");
  });

  function submitWithResumeUrl(letter: string) {
    const url = `public/${letter}_resume.pdf`;
    console.log("Setting URL:", url);
    setFormState({ url });
    router.push(`/resume-checker/review?url=${encodeURIComponent(url)}`);
  }

  async function handleFormSubmission(event: ChangeEvent) {
    const formElement = event.currentTarget.parentElement;
    if (!formElement || !(formElement instanceof HTMLFormElement)) return;
    const formData = new FormData(formElement);
    const honeypot = formData.get("name");

    if (honeypot) {
      return;
    }

    setFormState({ formData });
    router.push("/resume-checker/review");
  }

  function prevent(event: FormEvent) {
    event.preventDefault();
  }

  const mutations = useMutationState({
    filters: { mutationKey: ["resume-check"] },
    select: (mutation) => mutation.state.error,
  });

  const mutationError = mutations[mutations.length - 1];

  return (
    <>
      <ErrorBadge error={error || mutationError} />

      <div
        className={"container grid w-full h-full p-8 relative justify-center"}
      >
        <div className="grid gap-8 md:grid-cols-4 lg:self-center max-w-4xl">
          <div className="md:col-span-4 md:mb-8">
            <h1 className="text-center text-3xl lg:text-5xl font-bold mb-4">
              Subí tu CV y recibí feedback inmediato
            </h1>
            <p className="text-center text-black/80 dark:text-white/80">
              Resume checker está entrenado por recruiters e ingenieros de{" "}
              <Link
                href="https://silver.dev/"
                className="text-indigo-400 cursor-pointer hover:text-indigo-300"
              >
                Silver.dev
              </Link>
              .
            </p>
          </div>
          <form
            {...getRootProps()}
            onSubmit={prevent}
            method="POST"
            action="/api/grade"
            encType="multipart/form-data"
            className={`w-full overflow-hidden md:col-span-3 h-full p-8 relative border-2 rounded-lg ${isDragActive ? "cursor-grabbing dark:border-gray-400 border-gray-800" : "border-gray-400 dark:border-gray-500"}  border-dashed flex items-center justify-center flex-col gap-1`}
          >
            <span className="px-10 py-2 text-center block rounded-lg bg-indigo-800 font-bold hover:bg-indigo-600 cursor-pointer text-white">
              Hacé click para subir tu CV
            </span>
            <span className="text-gray-700 dark:text-gray-300 mt-4 text-center">
              o arrastrá tu CV
            </span>
            <input
              className="sr-only"
              onChange={handleFormSubmission}
              id="resume"
              name="resume"
              {...getInputProps()}
            />
            {/* honeypot */}
            <input className="hidden" type="text" name="name" />
          </form>
          <div className="self-end">
            <p className="mb-4 text-center md:text-left">O usá un ejemplo:</p>
            <div className="grid grid-cols-1 gap-6 justify-center lg:justify-start">
              {[
                { letter: "s", name: "Victor Vigon" },
                { letter: "a", name: "Gabriel Benmergui" },
                { letter: "b", name: "Horacio Consultora" },
                { letter: "c", name: "Claudia Alves" },
              ].map(({ letter, name }) => (
                <button
                  key={letter}
                  className="relative"
                  onClick={() => submitWithResumeUrl(letter)}
                >
                  <div
                    className={`${letter} absolute transition-colors inset-0 rounded-lg`}
                  ></div>
                  <div className="m-1 pointer-events-none flex flex-col gap-2 text-center items-center justify-center rounded-lg p-4 relative bg-[var(--background)]">
                    <span className="font-semibold tracking-wider">{name}</span>
                    <span>Grade: {letter.toUpperCase()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
