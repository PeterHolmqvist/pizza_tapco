import { pizzeriaConfig } from "@/config/pizzeria.config";
import { FaInstagram, FaFacebook, FaSnapchatGhost, FaLinkedin } from "react-icons/fa";
import { FaTiktok, FaXTwitter } from "react-icons/fa6";

export function ContactSection() {
  const { phone, address, googleMapsUrl, googleMapsEmbedUrl, socials, theme } =
    pizzeriaConfig;

  return (
    <section id="contact" className={`${theme.sectionBg} py-10`}>
      <div className="max-w-5xl mx-auto px-4 grid gap-6 md:grid-cols-2">
        {/* vänster */}
        <div className="space-y-4">
          <div>
            <h2 className={`${theme.h2} mb-3`}>Kontakt</h2>
            <p className={`text-sm mb-1 ${theme.bodyText}`}>
              Telefon:{" "}
              <a href={`tel:${phone}`} className="underline text-red-400">
                {phone}
              </a>
            </p>
            <p
  className={`text-sm mb-4 ${theme.bodyText}`}
  dangerouslySetInnerHTML={{ __html: `Adress: ${address}` }}
></p>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            {socials.facebook && (
              <a href={socials.facebook} target="_blank" rel="noreferrer" className="hover:text-white">
                <FaFacebook size={18} />
              </a>
            )}
            {socials.instagram && (
              <a href={socials.instagram} target="_blank" rel="noreferrer" className="hover:text-white">
                <FaInstagram size={18} />
              </a>
            )}
            {socials.tiktok && (
              <a href={socials.tiktok} target="_blank" rel="noreferrer" className="hover:text-white">
                <FaTiktok size={18} />
              </a>
            )}
            {socials.snapchat && (
              <a href={socials.snapchat} target="_blank" rel="noreferrer" className="hover:text-white">
                <FaSnapchatGhost size={18} />
              </a>
            )}
            {socials.linkedin && (
              <a href={socials.linkedin} target="_blank" rel="noreferrer" className="hover:text-white">
                <FaLinkedin size={18} />
              </a>
            )}
            {socials.x && (
              <a href={socials.x} target="_blank" rel="noreferrer" className="hover:text-white">
                <FaXTwitter size={18} />
              </a>
            )}
          </div>
        </div>

        {/* höger */}
        <div className="flex flex-col gap-3">
          <div className="h-40 md:h-56 w-full overflow-hidden rounded-lg border border-slate-700">
            <iframe
              src={googleMapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0"
            />
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className={`self-start text-xs px-3 py-2 rounded-full font-semibold ${theme.accentButton}`}
          >
            Öppna i Google Maps
          </a>
        </div>
      </div>
    </section>
  );
}





