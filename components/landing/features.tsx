import {
  Target,
  ListTodo,
  Heart,
  GripVertical,
  Calendar,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Define Your Goals",
    description:
      "Start with your roles and mission. Set meaningful goals that align with your values and long-term vision.",
    color: "bg-primary",
  },
  {
    icon: ListTodo,
    title: "Task Association",
    description:
      "Link every task to a specific goal. Ensure your daily actions always move you toward what matters most.",
    color: "bg-accent",
  },
  {
    icon: Heart,
    title: "Sharpen the Saw",
    description:
      "Schedule activities for renewal across all dimensions: physical, mental, social/emotional, and spiritual.",
    color: "bg-primary",
  },
  {
    icon: GripVertical,
    title: "Drag & Drop Planning",
    description:
      "Intuitive calendar interface lets you arrange your week visually. Move tasks around until your schedule feels right.",
    color: "bg-accent",
  },
  {
    icon: Calendar,
    title: "Google Calendar Sync",
    description:
      "Export your weekly plan directly to Google Calendar. Keep everything in sync across all your devices.",
    color: "bg-primary",
  },
  {
    icon: Sparkles,
    title: "Weekly Review",
    description:
      "Reflect on your progress, celebrate wins, and adjust your plans. Continuous improvement built into your workflow.",
    color: "bg-accent",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            Everything you need for principle-centered planning
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Built on timeless principles of effectiveness, designed for modern
            life. Plan with purpose, not just productivity.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-card p-8 rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div
                className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
