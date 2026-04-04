export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Define Your Roles & Goals",
      description:
        "Identify the key roles you play in life—professional, parent, partner, individual. For each role, set one or two meaningful weekly goals.",
    },
    {
      number: "02",
      title: "Plan Tasks & Big Rocks",
      description:
        "Add tasks that support your goals. These are your 'Big Rocks'—the important things that must get scheduled first before the gravel of daily urgencies.",
    },
    {
      number: "03",
      title: "Schedule Sharpen the Saw",
      description:
        "Block time for renewal activities: exercise, reading, meditation, relationships. These aren&apos;t luxuries—they&apos;re essential for sustained effectiveness.",
    },
    {
      number: "04",
      title: "Arrange & Sync",
      description:
        "Drag and drop your activities onto your weekly calendar until the schedule feels balanced. Then export to Google Calendar with one click.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            A simple four-step process to transform your weekly planning from
            reactive to proactive.
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`relative lg:grid lg:grid-cols-2 lg:gap-16 items-center ${
                  index % 2 === 0 ? "" : "lg:direction-rtl"
                }`}
              >
                {/* Content */}
                <div
                  className={`${
                    index % 2 === 0
                      ? "lg:text-right lg:pr-16"
                      : "lg:order-2 lg:text-left lg:pl-16"
                  }`}
                >
                  <div
                    className={`inline-flex items-center gap-4 ${
                      index % 2 === 0 ? "lg:flex-row-reverse" : ""
                    }`}
                  >
                    <span className="text-5xl font-serif font-bold text-secondary-foreground/20">
                      {step.number}
                    </span>
                    <h3 className="font-serif text-2xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-4 text-muted-foreground leading-relaxed max-w-md lg:ml-auto">
                    {step.description}
                  </p>
                </div>

                {/* Timeline dot */}
                <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 bg-primary rounded-full ring-4 ring-background" />
                </div>

                {/* Visual placeholder */}
                <div
                  className={`mt-8 lg:mt-0 ${
                    index % 2 === 0 ? "lg:pl-16" : "lg:order-1 lg:pr-16"
                  }`}
                >
                  <div className="aspect-video bg-muted/50 rounded-2xl border border-border flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                        <span className="text-2xl font-serif font-bold text-primary">
                          {step.number}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Interactive preview
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
