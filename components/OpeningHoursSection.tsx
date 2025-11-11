import { pizzeriaConfig } from "@/config/pizzeria.config";

const labels: Record<string, string> = {
  monday: "Måndag",
  tuesday: "Tisdag",
  wednesday: "Onsdag",
  thursday: "Torsdag",
  friday: "Fredag",
  saturday: "Lördag",
  sunday: "Söndag",
};

export function OpeningHoursSection() {
  const { openingHours, theme } = pizzeriaConfig;

  return (
    <section id="opening-hours" className={`${theme.sectionBg} py-8`}>
      <div className="max-w-md mx-auto px-4">
        <h2 className={`${theme.h2} text-center mb-4`}>Öppettider</h2>
        <div className={`space-y-1 text-sm ${theme.bodyText}`}>
          {Object.entries(openingHours).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span>{labels[key]}</span>
              <span className="font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
