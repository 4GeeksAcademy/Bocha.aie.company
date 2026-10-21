"use client";

export type BreakdownValue = {
    count: number;
    percentage: number;
};

export type Satisfaction = {
    closed_cases: number;
    scored_cases: number;
    average: number | null;
    scores: Record<string, number>;
};

export type AnalysisResult = {
    company: string;
    source_file: string;
    total_records: number;
    valid_records: number;
    invalid_records: number;
    invalid_breakdown: Record<string, number>;
    by_category: Record<string, BreakdownValue>;
    by_status: Record<string, BreakdownValue>;
    satisfaction: Satisfaction;
};

type IncidentAnalysisResultsProps = {
    result: AnalysisResult;
    downloading: boolean;
    onDownload: () => void;
};

export default function IncidentAnalysisResults({
    result,
    downloading,
    onDownload,
}: IncidentAnalysisResultsProps) {
    const invalidBreakdown = result.invalid_breakdown ?? {};
    const byCategory = result.by_category ?? {};
    const byStatus = result.by_status ?? {};
    const satisfaction = result.satisfaction;
    const satisfactionScores = satisfaction?.scores ?? {};

    return (
        <>
            <section className="metrics">
                <article className="metric">
                    <span>Total</span>
                    <strong>{result.total_records}</strong>
                </article>

                <article className="metric">
                    <span>Válidos</span>
                    <strong>{result.valid_records}</strong>
                </article>

                <article className="metric">
                    <span>Inválidos</span>
                    <strong>{result.invalid_records}</strong>
                </article>

                <article className="metric">
                    <span>Satisfacción</span>
                    <strong>{satisfaction?.average?.toFixed(2) ?? "N/A"}</strong>
                </article>
            </section>

            <section className="card">
                <h2>Registros inválidos</h2>

                {Object.keys(invalidBreakdown).length === 0 ? (
                    <p>No hay registros inválidos.</p>
                ) : (
                    <ul className="dataList">
                        {Object.entries(invalidBreakdown).map(([reason, count]) => (
                            <li key={reason}>
                                <span>{reason}</span>
                                <strong>{count}</strong>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="twoColumns">
                <article className="card">
                    <h2>Categorías</h2>
                    <BreakdownList data={byCategory} />
                </article>

                <article className="card">
                    <h2>Estados</h2>
                    <BreakdownList data={byStatus} />
                </article>
            </section>

            <section className="card">
                <h2>Índice de satisfacción</h2>

                <div className="satisfactionGrid">
                    <div>
                        <span>Casos cerrados</span>
                        <strong>{satisfaction?.closed_cases ?? 0}</strong>
                    </div>

                    <div>
                        <span>Casos puntuados</span>
                        <strong>{satisfaction?.scored_cases ?? 0}</strong>
                    </div>

                    <div>
                        <span>Promedio</span>
                        <strong>{satisfaction?.average?.toFixed(2) ?? "N/A"}</strong>
                    </div>
                </div>

                <h3>Distribución de puntajes</h3>

                <ul className="dataList">
                    {Object.entries(satisfactionScores).map(([score, count]) => (
                        <li key={score}>
                            <span>Puntaje {score}</span>
                            <strong>{count}</strong>
                        </li>
                    ))}
                </ul>

                <button
                    type="button"
                    onClick={onDownload}
                    className="downloadButton"
                    disabled={downloading}
                >
                    {downloading ? "Descargando..." : "Descargar resultados CSV"}
                </button>
            </section>
        </>
    );
}

function BreakdownList({ data }: { data: Record<string, BreakdownValue> }) {
    return (
        <ul className="dataList">
            {Object.entries(data).map(([key, value]) => (
                <li key={key}>
                    <span>{key}</span>
                    <strong>
                        {value.count} ({value.percentage.toFixed(1)}%)
                    </strong>
                </li>
            ))}
        </ul>
    );
}
