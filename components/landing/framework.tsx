export function Framework() {
  const quadrants = [
    {
      quadrant: "I",
      title: "Urgent & Important",
      description: "Crises, deadlines, pressing problems",
      color: "bg-red-500/10 border-red-500/30",
      textColor: "text-red-600",
      items: ["Emergencies", "Last-minute deadlines", "Pressing issues"],
    },
    {
      quadrant: "II",
      title: "Not Urgent & Important",
      description: "Prevention, planning, improvement, relationships",
      color: "bg-primary/10 border-primary/30",
      textColor: "text-primary",
      items: ["Goal setting", "Relationship building", "Personal development"],
      highlight: true,
    },
    {
      quadrant: "III",
      title: "Urgent & Not Important",
      description: "Interruptions, some calls, some meetings",
      color: "bg-yellow-500/10 border-yellow-500/30",
      textColor: "text-yellow-600",
      items: ["Interruptions", "Some emails", "Some meetings"],
    },
    {
      quadrant: "IV",
      title: "Not Urgent & Not Important",
      description: "Time wasters, pleasant activities",
      color: "bg-muted border-border",
      textColor: "text-muted-foreground",
      items: ["Excessive TV", "Mindless scrolling", "Trivial busy work"],
    },
  ];

  return (
    <section id="framework" className="py-20 lg:py-32 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-balance">
              Built on the Time Management Matrix
            </h2>
            <p className="mt-6 text-lg text-background/70 leading-relaxed text-pretty">
              The 7 Habits framework teaches us to focus on Quadrant II—the
              important but not urgent activities that lead to long-term success
              and fulfillment.
            </p>
            <p className="mt-4 text-background/70 leading-relaxed">
              HabitFlow helps you identify and prioritize these activities,
              ensuring they get scheduled before the urgent (but often less
              important) tasks take over your calendar.
            </p>

            <div className="mt-8 p-6 bg-background/5 rounded-2xl border border-background/10">
              <blockquote className="font-serif text-xl italic text-background/90">
                &ldquo;The key is not to prioritize what&apos;s on your schedule, but to
                schedule your priorities.&rdquo;
              </blockquote>
              <cite className="mt-4 block text-sm text-background/60">
                — Stephen R. Covey
              </cite>
            </div>
          </div>

          {/* Matrix Visual */}
          <div className="grid grid-cols-2 gap-4">
            {quadrants.map((q) => (
              <div
                key={q.quadrant}
                className={`p-6 rounded-2xl border ${q.color} ${
                  q.highlight ? "ring-2 ring-primary ring-offset-2 ring-offset-foreground" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-sm font-bold ${q.textColor} bg-background/80 px-2 py-1 rounded`}
                  >
                    Q{q.quadrant}
                  </span>
                  {q.highlight && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Focus Here
                    </span>
                  )}
                </div>
                <h3
                  className={`font-serif font-semibold text-sm ${q.textColor} mb-2`}
                >
                  {q.title}
                </h3>
                <ul className="space-y-1">
                  {q.items.map((item) => (
                    <li key={item} className="text-xs text-foreground/60">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Sharpen the Saw */}
        <div className="mt-20 pt-16 border-t border-background/10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-balance">
              Sharpen the Saw: The Four Dimensions
            </h3>
            <p className="mt-4 text-background/70 text-pretty">
              Habit 7 reminds us to preserve and enhance our greatest
              asset—ourselves. HabitFlow helps you schedule activities across
              all four dimensions of renewal.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                dimension: "Physical",
                icon: "🏃",
                activities: ["Exercise", "Nutrition", "Sleep", "Rest"],
              },
              {
                dimension: "Mental",
                icon: "📚",
                activities: ["Reading", "Learning", "Writing", "Planning"],
              },
              {
                dimension: "Social/Emotional",
                icon: "❤️",
                activities: [
                  "Relationships",
                  "Service",
                  "Empathy",
                  "Connection",
                ],
              },
              {
                dimension: "Spiritual",
                icon: "🧘",
                activities: [
                  "Meditation",
                  "Reflection",
                  "Nature",
                  "Purpose",
                ],
              },
            ].map((dim) => (
              <div
                key={dim.dimension}
                className="p-6 bg-background/5 rounded-2xl border border-background/10 text-center"
              >
                <span className="text-3xl">{dim.icon}</span>
                <h4 className="font-serif font-semibold text-lg mt-4 mb-3 text-background">
                  {dim.dimension}
                </h4>
                <ul className="space-y-1">
                  {dim.activities.map((activity) => (
                    <li key={activity} className="text-sm text-background/60">
                      {activity}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
