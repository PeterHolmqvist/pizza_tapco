import { Navbar } from "@/components/Navbar";
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
import { FacebookSection } from "@/components/FacebookSection";
import { PressSection } from "@/components/PressSection";



export default function Home() {
  const { theme } = pizzeriaConfig;

  return ( 
   <>
    <Navbar />
    <main className={`${theme.pageBg} ${theme.bodyText} ${theme.font} min-h-screen`}>
      <HeroSection />
      <MenuSection />
      <GallerySection />
      <OpeningHoursSection />
      <AboutSection />
      <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-6 md:gap-10 px-4">
      <div className="flex-1">
      <FacebookSection />
      </div>
      <div className="flex-1">
      <PressSection />
      </div>
      </div>
      <ReviewsSection />
      <ContactSection />
      <Footer />
      <CartBar />
    </main>
    </>
  );
}





