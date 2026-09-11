import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_CONFIG } from "@/lib/businessConfig";
import pergolaHero from "@/assets/structures/pergola-hero.png";
import louvreHero from "@/assets/structures/louvre-builder-hero.jpg";
import deckHero from "@/assets/structures/custom-deck-hero.jpg";
import carportHero from "@/assets/structures/carport-hero.jpg";
import blindsHero from "@/assets/structures/outdoor-blinds-hero.jpg";
import enclosureHero from "@/assets/structures/enclosure-hero.png";

const services = [
  { title: "Patios & Pergolas", copy: "Covered outdoor entertaining areas designed for Australian homes.", image: pergolaHero },
  { title: "Louvre Roofs", copy: "Adjustable shade and rain protection with premium opening roof systems.", image: louvreHero },
  { title: "Decking", copy: "Composite and timber decking options with instant design estimates.", image: deckHero },
  { title: "Carports", copy: "Single, double and custom carport designs to protect vehicles.", image: carportHero },
  { title: "Outdoor Blinds", copy: "Privacy, shade, wind and rain control for outdoor living areas.", image: blindsHero },
  { title: "Outdoor Rooms", copy: "Enclosed alfresco spaces with glass, panels, doors and screens.", image: enclosureHero },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-20 px-5 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-white">
          <Link to="/" className="text-lg font-bold tracking-tight">{BUSINESS_CONFIG.appName}</Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#services" className="hover:text-white/80">Services</a>
            <a href="#process" className="hover:text-white/80">Process</a>
            <a href="#contact" className="hover:text-white/80">Contact</a>
            <Link to="/admin/login" className="hover:text-white/80">Staff Login</Link>
          </nav>
        </div>
      </header>

      <section className="relative min-h-[88vh] overflow-hidden text-white">
        <img src={pergolaHero} alt="Outdoor pergola" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-end px-5 pb-14 pt-28">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm backdrop-blur">
              <Star className="h-4 w-4" />
              Servicing {BUSINESS_CONFIG.serviceArea}
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Premium Outdoor Living Built To Last</h1>
            <p className="max-w-2xl text-lg text-white/90">
              Design patios, pergolas, louvre roofs, decks, carports, blinds and outdoor rooms with a live 3D estimate flow.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2 bg-accent hover:bg-accent/90">
                <Link to="/configurator">
                  Start 3D Configurator <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href={`mailto:${BUSINESS_CONFIG.contactEmail}`}>Contact the Team</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-card px-5 py-5">
        <div className="mx-auto grid max-w-7xl gap-4 text-sm font-medium text-muted-foreground md:grid-cols-4">
          {["35+ years building experience", "Licensed & insured", "Trained installation teams", "Up to 25-year warranties"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Outdoor Living Solutions</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">Choose a project type, configure dimensions and finishes, then send the design through as a real lead.</p>
            </div>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/configurator">Open Configurator <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Link key={service.title} to="/configurator" className="group overflow-hidden rounded-lg border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <img src={service.image} alt={service.title} className="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="p-5">
                  <h3 className="text-lg font-semibold">{service.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{service.copy}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="bg-muted/40 px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold tracking-tight">From Estimate To Handover</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {["Design your project in 3D", "Submit details for a quote", "Admin team follows up"].map((step, index) => (
              <div key={step} className="rounded-lg border bg-card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</div>
                <h3 className="font-semibold">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-foreground px-5 py-10 text-background">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="font-semibold">{BUSINESS_CONFIG.clientName}</p>
            <p className="mt-1 text-sm text-background/75">{BUSINESS_CONFIG.serviceArea}</p>
          </div>
          <div className="text-sm text-background/85">
            <p>{BUSINESS_CONFIG.contactPhone}</p>
            <p>{BUSINESS_CONFIG.contactEmail}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-background/75">
            <ShieldCheck className="h-4 w-4" />
            Staff dashboard is admin-only
          </div>
        </div>
      </footer>
    </main>
  );
}
