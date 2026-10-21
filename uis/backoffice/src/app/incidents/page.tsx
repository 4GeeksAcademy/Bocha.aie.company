"use client";


import Link from "next/link";
import dynamic from "next/dynamic";

import {
  useState
} from "react";


import type {
  FormEvent
} from "react";

import {
  apiFetch,
  requestJson,
} from "@/lib/api";

import type {
  AnalysisResult
} from "@/components/incident-analysis-results";


// Solo se muestra tras analizar un CSV: su código no debe ir en la carga inicial.
const IncidentAnalysisResults = dynamic(
  () => import("@/components/incident-analysis-results"),
  {
    ssr: false,
    loading: () => (
      <section className="card">
        <p>Cargando resultados...</p>
      </section>
    ),
  }
);


export default function IncidentsPage() {


  const [
    file,
    setFile,
  ] = useState<
    File | null
  >(null);


  const [
    result,
    setResult,
  ] = useState<
    AnalysisResult | null
  >(null);


  const [
    error,
    setError,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    downloading,
    setDownloading,
  ] = useState(false);


  const [
    failedAction,
    setFailedAction,
  ] = useState<
    "analyze"
    | "download"
    | null
  >(null);


  async function analyzeSelectedFile() {


    if (!file) {

      setFailedAction(
        "analyze"
      );

      setError(
        "Seleccioná un archivo CSV."
      );

      return;

    }


    setLoading(true);

    setFailedAction(
      "analyze"
    );

    setError("");

    setResult(null);


    const formData =
      new FormData();


    formData.append(
      "file",
      file
    );


    try {

      const data =
        await requestJson<
          AnalysisResult
        >(
          (
            "/backend"
            + "/api/incidents/analyze"
          ),
          {
            method:
              "POST",
            body:
              formData,
          },
          {
            requiresAuth:
              true,
            fallbackMessage:
              (
                "No fue posible "
                + "analizar el CSV."
              ),
          }
        );


      setResult(
        data as AnalysisResult
      );


    } catch (error) {


      if (
        error
        instanceof Error
      ) {

        setError(
          error.message
        );

      } else {

        setError(
          "No pudimos analizar el archivo en este momento."
        );

      }


    } finally {

      setLoading(false);

    }

  }


  async function handleSubmit(

    event:
      FormEvent<HTMLFormElement>

  ) {

    event.preventDefault();


    await analyzeSelectedFile();

  }


  async function downloadResults() {


    setDownloading(true);

    setFailedAction(
      "download"
    );

    setError("");


    try {

      const response =
        await apiFetch(
          (
            "/backend"
            + "/api/incidents/"
            + "results/export"
          ),
          {},
          {
            requiresAuth:
              true,
            fallbackMessage:
              (
                "No fue posible "
                + "descargar "
                + "los resultados."
              ),
          }
        );


      const blob =
        await response.blob();


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        url;


      link.download =
        "results.csv";


      document.body
        .appendChild(
          link
        );


      link.click();

      link.remove();


      URL.revokeObjectURL(
        url
      );


    } catch (error) {


      if (
        error
        instanceof Error
      ) {

        setError(
          error.message
        );

      } else {

        setError(
          "No pudimos descargar los resultados en este momento."
        );

      }

    } finally {

      setDownloading(false);

    }

  }


  function retryFailedAction() {


    if (
      failedAction
      === "download"
    ) {

      void downloadResults();

      return;

    }


    void analyzeSelectedFile();

  }


  return (

    <main className="container">


      <header className="pageHeader">

        <span className="eyebrow">
          OPERACIONES
        </span>


        <h1>
          Análisis de incidencias
        </h1>


        <p>
          Cargá el archivo CSV
          para validar registros
          y consultar sus métricas.
        </p>

      </header>


      <section className="card">


        <form
          onSubmit={handleSubmit}
          className="uploadForm"
        >


          <div className="fileArea">

            <label htmlFor="csvFile">

              Archivo CSV

            </label>


            <input

              id="csvFile"

              type="file"

              accept=".csv,text/csv"

              onChange={(
                event
              ) => {

                const selected =
                  event
                    .target
                    .files?.[0]
                  ?? null;


                setFile(
                  selected
                );

              }}

            />


            {
              file
              && (

                <small>

                  Seleccionado:
                  {" "}
                  {file.name}

                </small>

              )
            }

          </div>


          <button
            type="submit"
            disabled={loading}
          >

            {
              loading
                ? "Analizando..."
                : "Analizar CSV"
            }

          </button>


        </form>


        {
          error
          && (

            <div className="error">

              <p>
                {error}
              </p>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    retryFailedAction();
                  }}
                  disabled={loading || downloading}
                >
                  Reintentar
                </button>
                <span>
                  {" "}
                </span>
                <Link href="/">
                  Volver al inicio
                </Link>
              </div>

            </div>

          )
        }


      </section>


      {
        result
        && (
          <IncidentAnalysisResults
            result={result}
            downloading={downloading}
            onDownload={() => {
              void downloadResults();
            }}
          />
        )
      }


    </main>

  );

}
