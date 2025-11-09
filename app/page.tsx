import { pizzeriaConfig } from "@/config/pizzeria.config";
import { HeroSection } from "@/components/HeroSection";
import { MenuSection } from "@/components/MenuSection";
import { OpeningHoursSection } from "@/components/OpeningHoursSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { AboutSection } from "@/components/AboutSection";
import { ReviewsSection } from "@/components/ReviewsSection";
import { GallerySection } from "@/components/GallerySection";
import { CartBar } from "@/components/CartBar";

export default function Home() {
  const { theme } = pizzeriaConfig;

  return (
    <main className={`${theme.pageBg} ${theme.bodyText} ${theme.font} min-h-screen`}>
      <HeroSection />
      <MenuSection />
      <GallerySection />
      <OpeningHoursSection />
      <AboutSection />
      <ReviewsSection />
      <ContactSection />
      <Footer />
      <CartBar />
    </main>
  );
}





