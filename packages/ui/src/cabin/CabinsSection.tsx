import { Container, Section } from '../ui/Container';
import { CabinCard } from './CabinCard';
import { Cabin } from '@core/types/database';
import { cabinDisplayOrder } from './media';

interface CabinsSectionProps {
  cabins: Cabin[];
}

export function CabinsSection({ cabins }: CabinsSectionProps) {
  const getSortIndex = (slug: string | null) => {
    const index = cabinDisplayOrder.indexOf(slug as (typeof cabinDisplayOrder)[number]);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };

  const sortedCabins = [...cabins].sort((a, b) => getSortIndex(a.slug) - getSortIndex(b.slug));

  return (
    <Section id="cabanas" padding="lg" dark>
      <Container>
        <div className="text-center mb-16">
          <h2 className="heading-secondary mb-4">
            Nuestras <span className="text-primary-500">Cabañas</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Espacios diseñados para tu comodidad y cercanía con la naturaleza. Todas nuestras
            cabañas cuentan con capacidad para 7 personas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedCabins.map((cabin) => (
            <CabinCard key={cabin.id} cabin={cabin} />
          ))}
        </div>

        {sortedCabins.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No hay cabañas disponibles en este momento.</p>
          </div>
        )}
      </Container>
    </Section>
  );
}
