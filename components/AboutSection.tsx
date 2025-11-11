import { pizzeriaConfig } from "@/config/pizzeria.config";

export function AboutSection() {
  const { about, theme } = pizzeriaConfig;

  if (!about) return null;

  return (
    <section id="about" className={`${theme.sectionBg} py-10`}>
      <div className="max-w-3xl mx-auto px-4 text-center md:text-left">
        <h2 className={`${theme.h2} mb-3`}>{about.title}</h2>
        <p className={`${theme.bodyText} text-sm mb-4`}>{about.text}</p>

        {about.bullets && about.bullets.length > 0 && (
          <ul className={`text-sm space-y-1 ${theme.bodyText}`}>
            {about.bullets.map((item: string) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
