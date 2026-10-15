import Link from "next/link";


export default function Home() {

  return (

    <main className="container">

      <section className="hero">

        <span className="eyebrow">
          BRASALAND DIGITAL
        </span>


        <h1>
          Backoffice operativo
        </h1>


        <p>
          Herramientas internas
          para gestión y análisis
          de operaciones.
        </p>


        <Link
          href="/incidents"
          className="button"
        >
          Analizar incidencias
        </Link>

        <Link
          href="/suppliers"
          className="button secondaryButton"
        >
          Gestionar proveedores
        </Link>

        <Link
          href="/inventory/products"
          className="button secondaryButton"
        >
          Ver inventario
        </Link>

        <Link
          href="/inventory/orders"
          className="button secondaryButton"
        >
          Revisar movimientos
        </Link>

      </section>

    </main>

  );

}
