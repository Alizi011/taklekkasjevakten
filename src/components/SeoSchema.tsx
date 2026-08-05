import { useEffect } from "react";

interface SeoSchemaProps {
  cityName?: string;
}

export default function SeoSchema({ cityName = "Oslo og omegn" }: SeoSchemaProps) {
  useEffect(() => {
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "RoofingContractor",
      "name": "Taklekkasjevakten - Perun AS",
      "image": "https://taklekkasjevakten.no/logo.png",
      "@id": "https://taklekkasjevakten.no/#organization",
      "url": "https://taklekkasjevakten.no",
      "telephone": "+4792029090",
      "email": "post@taklekkasjevakten.no",
      "priceRange": "$$$",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Oslo",
        "addressCountry": "NO"
      },
      "areaServed": [
        "Oslo",
        "Bærum",
        "Asker",
        "Lillestrøm",
        "Lørenskog",
        "Romerike"
      ],
      "description": `Eksperter på ingeniørfaglig lekkasjesøk og feilsøking av tak i ${cityName}. Døgnåpen akuttvakt og uavhengig rådgivning.`,
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ],
        "opens": "00:00",
        "closes": "23:59"
      }
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "json-ld-schema";
    script.innerHTML = JSON.stringify(schemaData);

    const existingScript = document.getElementById("json-ld-schema");
    if (existingScript) {
      existingScript.remove();
    }

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("json-ld-schema");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [cityName]);

  return null;
}