import { pizzeriaConfig } from "@/config/pizzeria.config";

export function Footer() {
  const { name, theme } = pizzeriaConfig;

  return (
    <footer className="bg-black text-xs py-4 mt-8">
      <div
        className={`max-w-5xl mx-auto px-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between ${theme.bodyText} ${theme.font}`}
      >
        <span>© {new Date().getFullYear()} {name}</span>

        <a
          href="https://brandmerchlab.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 self-start md:self-auto hover:text-white"
        >
          <span>©</span>
          <span>BrandMerchLab</span>
        </a>
      </div>
    </footer>
  );
}



