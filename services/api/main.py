from fastapi import (
    Depends,
    FastAPI,
    File,
    HTTPException,
    Request,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
import logging
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from fastapi.responses import (
    Response,
)

from dotenv import load_dotenv
from pathlib import Path


from packages.incidents_analysis import (
    analyze_csv_text,
    summary_to_csv,
)
from services.api.auth import get_current_active_user
from services.api.routes import (
    auth_router,
    profiles_router,
    suppliers_router,
    users_router,
    incidents_router,
)


load_dotenv(Path(__file__).with_name(".env"))


app = FastAPI(
    title=(
        "Brasaland Incidents API"
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(suppliers_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(profiles_router)
app.include_router(incidents_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    first_error = exc.errors()[0]
    location = first_error.get("loc", [])
    field = str(location[-1]) if location else "unknown"
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "field": field,
            "message": first_error.get("msg", "Dato inválido"),
        },
    )

logger = logging.getLogger(__name__)

LAST_ANALYSIS = None


@app.get("/")
def root():

    return {
        "message":
            (
                "Brasaland Incidents "
                "API is running"
            )
    }


@app.post(
    "/api/incidents/analyze"
)
async def analyze_incidents(
    file: UploadFile = File(...),
    _: object = Depends(get_current_active_user),
):

    global LAST_ANALYSIS


    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail=(
                "El fichero "
                "no tiene nombre."
            ),
        )


    if not (
        file.filename
        .lower()
        .endswith(".csv")
    ):

        raise HTTPException(
            status_code=415,
            detail=(
                "El fichero debe "
                "tener extensión .csv."
            ),
        )


    content = await file.read()


    if not content:

        raise HTTPException(
            status_code=400,
            detail=(
                "El fichero está vacío."
            ),
        )


    try:

        text = content.decode(
            "utf-8-sig"
        )


    except UnicodeDecodeError as error:

        raise HTTPException(
            status_code=400,
            detail=(
                "El fichero debe "
                "utilizar codificación "
                "UTF-8."
            ),
        ) from error


    try:

        result = analyze_csv_text(
            text=text,
            source_file=file.filename,
        )


    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


    LAST_ANALYSIS = result


    return result


@app.get(
    "/api/incidents/results/export"
)
def export_results(
    _: object = Depends(get_current_active_user),
):

    if LAST_ANALYSIS is None:

        raise HTTPException(
            status_code=404,
            detail=(
                "Todavía no existe "
                "ningún análisis "
                "para exportar."
            ),
        )


    csv_content = (
        summary_to_csv(
            LAST_ANALYSIS
        )
    )


    return Response(
        content=csv_content,

        media_type="text/csv",

        headers={
            "Content-Disposition":
                (
                    "attachment; "
                    'filename="results.csv"'
                )
        },
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "http_error", "message": str(exc.detail)},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Error inesperado en la API", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": "No se pudo completar la operación",
        },
    )
