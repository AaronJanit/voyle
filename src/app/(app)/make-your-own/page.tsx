import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Make Your Own",
};

type Step = {
  num: string;
  title: string;
  body: React.ReactNode;
  accent: string;
};

const steps: Step[] = [
  {
    num: "01",
    accent: "from-violet-500 to-fuchsia-500",
    title: "Grab a teacher photo",
    body: (
      <>
        Head over to{" "}
        <a
          href="https://mesivta.co.uk"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[#202124] underline decoration-[#dadce0] underline-offset-4 hover:decoration-[#1a73e8]"
        >
          mesivta.co.uk
        </a>{" "}
        and copy your desired teacher photo to your clipboard.
      </>
    ),
  },
  {
    num: "02",
    accent: "from-sky-500 to-indigo-500",
    title: "Edit it with AI",
    body: (
      <>
        Upload it to{" "}
        <span className="font-medium text-[#202124]">ChatGPT</span>{" "}
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200/70 align-middle">
          recommended
        </span>
        ,{" "}
        <span className="font-medium text-[#202124]">Microsoft Copilot</span>, or{" "}
        <span className="font-medium text-[#202124]">Gemini</span> and describe the
        edits you want.
      </>
    ),
  },
  {
    num: "03",
    accent: "from-amber-500 to-rose-500",
    title: "Make it move",
    body: (
      <>
        Create an account on{" "}
        <a
          href="https://chat.qwen.ai"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[#202124] underline decoration-[#dadce0] underline-offset-4 hover:decoration-[#1a73e8]"
        >
          chat.qwen.ai
        </a>
        , paste your generated picture, then use the{" "}
        <span className="inline-flex items-center gap-1 rounded-md bg-[#f1f3f4] px-1.5 py-0.5 text-[11px] font-medium text-[#3c4043] ring-1 ring-[#dadce0]">
          +
        </span>{" "}
        menu to choose <span className="font-medium text-[#202124]">video</span>{" "}
        and describe what you want it to do.
      </>
    ),
  },
  {
    num: "04",
    accent: "from-emerald-500 to-teal-500",
    title: "Share it here",
    body: (
      <>
        Upload your finished clip or picture back to this site and it&apos;ll live
        alongside everything else in your library.
      </>
    ),
  },
];

export default function MakeYourOwnPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fafbff] via-white to-[#f6f5ff]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Soft glow backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
          <div className="absolute -top-20 right-0 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute top-40 left-1/3 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-6 pt-16 pb-10 sm:pt-24 sm:pb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[#5f6368] ring-1 ring-[#e0e0e0] backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            new · 4-step workflow
          </span>

          <h1 className="mt-6 text-5xl font-light tracking-tight text-[#202124] sm:text-6xl">
            Make your{" "}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-500 bg-clip-text text-transparent font-normal">
              own
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#5f6368] sm:text-lg">
            Create your own AI vids + pics + gifs in four short steps. No
            install, no setup — just a browser and a good idea.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#workflow"
              className="inline-flex items-center gap-2 rounded-full bg-[#202124] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-black transition"
            >
              Start the workflow
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </a>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#202124] ring-1 ring-[#dadce0] hover:ring-[#1a73e8] hover:text-[#1a73e8] transition"
            >
              Or open the generator
            </Link>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="mx-auto max-w-5xl px-6 pb-20">
        <div className="mb-8 flex items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#dadce0] to-transparent" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#80868b]">
            the workflow
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#dadce0] to-transparent" />
        </div>

        <ol className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {steps.map((step, i) => (
            <li
              key={step.num}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-[#e8eaed] shadow-[0_1px_0_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition"
            >
              {/* gradient corner glow */}
              <div
                className={`pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br ${step.accent} opacity-10 blur-2xl group-hover:opacity-20 transition`}
              />

              <div className="flex items-start gap-4">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${step.accent} text-sm font-semibold text-white shadow-sm`}
                >
                  {step.num}
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-[#202124]">
                    {step.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#5f6368]">
                    {step.body}
                  </p>
                </div>
              </div>

              {/* connector arrow on desktop */}
              {i < steps.length - 1 && (
                <div
                  aria-hidden
                  className="absolute -bottom-3 left-1/2 hidden h-3 w-3 -translate-x-1/2 rotate-45 bg-white ring-1 ring-[#e8eaed] md:hidden"
                />
              )}
            </li>
          ))}
        </ol>

        {/* Final CTA */}
        <div className="mt-10 overflow-hidden rounded-3xl bg-[#202124] p-8 text-white sm:p-10">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-medium tracking-tight sm:text-2xl">
                Got something good? Bring it back.
              </h3>
              <p className="mt-1.5 text-sm text-white/70">
                Upload to <span className="font-medium text-white">voyle</span>{" "}
                and it&apos;ll show up in your library next to everything else.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#202124] hover:bg-white/90 transition"
            >
              Open my library
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}