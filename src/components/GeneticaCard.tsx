import React from "react";
import Link from "next/link";

interface GeneticaCardProps {
  nombre: string;
  stock: number;
  imagenUrl?: string;
  href?: string; // link opcional para ir al detalle
}

const GeneticaCard: React.FC<GeneticaCardProps> = ({ nombre, stock, imagenUrl, href }) => {
  const nombreLimpio = nombre.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();

  const cardInner = (
    <article className="flex h-full flex-col justify-between rounded-[28px] border border-[#e5e5e5] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(15,23,42,0.15)]">
      <div className="h-36 w-full overflow-hidden rounded-[20px] bg-[#f5f5f5]">
        <img
          src={imagenUrl || "/images/default.png"}
          alt={nombreLimpio}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="mt-4 space-y-1 text-center">
        <p className="text-base font-semibold text-[#000] truncate">{nombreLimpio}</p>
        <p className="text-xs uppercase tracking-[0.15em] text-[#00000040]">Stock</p>
        <p className="text-xl font-bold tracking-tight text-[#007b00]">{stock} g</p>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardInner}
      </Link>
    );
  }

  return cardInner;
};

export default GeneticaCard;
