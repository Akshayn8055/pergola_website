import { StructureType, PergolaType, RoofType } from '@/types/configurator';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

// Structure images
import pergolaHeroImg from '@/assets/structures/pergola-hero.png';
import carportHeroImg from '@/assets/structures/carport-hero.jpg';
import fabricHeroImg from '@/assets/structures/outdoor-blinds-hero.jpg';
import enclosureHeroImg from '@/assets/structures/enclosure-hero.png';
import louvreBuilderHeroImg from '@/assets/structures/louvre-builder-hero.jpg';
import customDeckHeroImg from '@/assets/structures/custom-deck-hero.jpg';


interface StructureOption {
  type: StructureType;
  pergolaType?: PergolaType;
  roofType?: RoofType;
  title: string;
  description: string;
  image: string;
  badge?: {
    text: string;
    icon: React.ReactNode;
  };
}

const structureOptions: StructureOption[] = [
  {
    type: 'pergola',
    pergolaType: 'pro',
    roofType: 'insulated',
    title: 'Patio / Pergola',
    description: 'Design a covered outdoor entertaining area with insulated or non-insulated roofing.',
    image: pergolaHeroImg,
    badge: {
      text: 'Most popular',
      icon: <Star className="w-3.5 h-3.5" />,
    },
  },
  {
    type: 'pergola',
    pergolaType: 'builder',
    roofType: 'louvered-200',
    title: '\u00a0Louvre Roof',
    description: 'Premium motorised opening louvre roof for year-round outdoor living.',
    image: louvreBuilderHeroImg,
  },
  {
    type: 'pergola',
    pergolaType: 'fabric',
    roofType: 'insulated',
    title: 'Outdoor Blinds & Screens',
    description: 'Add outdoor blinds or privacy screens for weather protection, shade and privacy.',
    image: fabricHeroImg,
  },
  {
    type: 'pergola',
    pergolaType: 'luxe',
    roofType: 'insulated',
    title: 'Carport',
    description: 'Design a single, double or custom carport to protect your vehicles.',
    image: carportHeroImg,
  },
  {
    type: 'pergola',
    pergolaType: 'enclosure',
    title: 'Outdoor Room / Enclosure',
    description: 'Create an enclosed outdoor living space with glass, insulated wall panels, windows, doors, blinds and screens.',
    image: enclosureHeroImg,
  },
  {
    type: 'deck',
    title: 'Decking',
    description: 'Design a composite or timber deck to suit your outdoor space.',
    image: customDeckHeroImg,
  },
];

interface StructureSelectionProps {
  onSelect: (type: StructureType, pergolaType?: PergolaType, roofType?: RoofType) => void;
}

export const StructureSelection = ({ onSelect }: StructureSelectionProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            What would you like to build?
          </h1>
        </div>

        {/* Structure Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
          {structureOptions.map((option, index) => (
            <div
              key={`${option.type}-${option.pergolaType}-${index}`}
              className={cn(
                "group cursor-pointer relative overflow-hidden rounded-xl",
                "transition-all duration-300 ease-out",
                "border border-border/40 hover:border-border",
                "shadow-sm hover:shadow-xl",
                "hover:-translate-y-1",
                "bg-card"
              )}
              onClick={() => onSelect(option.type, option.pergolaType, option.roofType)}
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={option.image} 
                  alt={option.title}
                  className="w-full h-full object-cover object-[center_30%] transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  width={1408}
                  height={1056}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Badge */}
                {option.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-foreground shadow-lg">
                      {option.badge.icon}
                      {option.badge.text}
                    </span>
                  </div>
                )}
                
                {/* Title on Image */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h2 className="text-xl md:text-2xl font-semibold text-white drop-shadow-lg">
                    {option.title}
                  </h2>
                </div>
              </div>
              
              {/* Description */}
              <div className="p-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-6 mt-12 md:mt-16">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-accent" />
            Real-time 3D preview
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-accent" />
            Instant pricing
          </div>
          <div className="w-px h-4 bg-border hidden md:block" />
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-accent" />
            Free quote
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
