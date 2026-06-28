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
    accent: "from-[#0a84ff] to-[#5e5ce6]",
    title: "Grab a teacher photo",
    body: (
      <>
        Head over to{" "}
        <a
          href="https://mesivta.co.uk"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--tint)] font-medium underline-offset-4 decoration-2"
        >
          mesivta.co.uk
        </a>{" "}
        and copy your desired teacher photo to your clipboard.
      </>
    ),
  },
  {
    num: "02",
    accent: "from-[#5e5ce6] to-[#bf5af2]",
    title: "Edit it with AI",
    body: (
      <>
        Upload it to{" "}
        <span className="font-semibold text-[var(--fg)]">ChatGPT</span>
        <span className="ml-2 inline-flex items-center rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--success)] uppercase tracking-wide">
          Recommended
        </span>
        ,{" "}
        <span className="font-semibold text-[var(--fg)]">Copilot</span>, or{" "}
        <span className="font-semibold text-[var(--fg)]">Gemini</span> and describe the
        edits you want.
      </>
    ),
  },
  {
    num: "03",
    accent: "from-[#ff9500] to-[#ff3b30]",
    title: "Make it move",
    body: (
      <>
        Open{" "}
        <a
          href="https://chat.qwen.ai"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--tint)] font-medium underline-offset-4 decoration-2"
        >
          chat.qwen.ai
        </a>
        , paste your image, then tap the{" "}
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[var(--bg)] text-[var(--fg-muted)] text-[12px] font-bold align-middle">
          +
        </span>{" "}
        menu to choose{" "}
        <span className="font-semibold text-[var(--fg)]">Video</span> and describe what you want it to do.
      </>
    ),
  },
  {
    num: "04",
    accent: "from-[#34c759] to-[#30d158]",
    title: "Share it here",
    body: (
      <>
        Upload your finished clip or picture back to this site and it'll live
        alongside everything else in your library.
      </>
    ),
  },
];

export default function MakeYourOwnPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* iOS-style sticky large title */}
      <header className="sticky top-0 z-30 ios-glass">
        <div className="px-5 pt-3 pb-3 flex items-end justify-between">
          <div>
            <h1 className="ios-large-title leading-none">Workflow</h1>
            <p className="ios-subhead mt-1">Make your own · 4 steps</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--success)]/15 text-[var(--success)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
            </span>
            <span className="ios-caption uppercase tracking-wider font-semibold">
              New
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 pt-6 pb-24 md:pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <section className="text-center mb-8 ios-slide-up">
            <h2 className="ios-large-title mb-3">
              Make your{" "}
              <span className="bg-gradient-to-r from-[#0a84ff] via-[#bf5af2] to-[#ff9500] bg-clip-text text-transparent">
                own
              </span>
            </h2>
            <p className="ios-callout max-w-xl mx-auto">
              Create your own AI vids + pics + gifs in four short steps. No
              install, no setup — just a browser and a good idea.
            </p>
          </section>

          {/* CTA buttons — iOS style */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <a href="#workflow" className="ios-btn-primary flex items-center gap-2">
              Start the workflow
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </a>
            <Link href="/generate" className="ios-btn-secondary">
              Or open the generator
            </Link>
          </div>

          {/* Workflow list */}
          <section id="workflow">
            <div className="flex items-center gap-3 mb-4 px-1">
              <span className="h-px flex-1 bg-[var(--border)]" />
              <span className="ios-caption uppercase tracking-[0.2em] font-semibold text-[var(--fg-faint)]">
                The workflow
              </span>
              <span className="h-px flex-1 bg-[var(--border)]" />
            </div>

            <ol className="ios-card overflow-hidden divide-y divide-[var(--border)]">
              {steps.map((step) => (
                <li key={step.num} className="flex gap-4 p-5">
                  <span
                    className={`shrink-0 w-10 h-10 rounded-[12px] bg-gradient-to-br ${step.accent} flex items-center justify-center text-white text-[14px] font-bold shadow-sm`}
                  >
                    {step.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="ios-headline mb-1">{step.title}</h3>
                    <p className="ios-subhead leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>
    </div>
  );
}