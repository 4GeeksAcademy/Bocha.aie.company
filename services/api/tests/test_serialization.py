SENSITIVE_KEYS = {
    "password",
    "hashed_password",
    "password_hash",
    "new_password",
    "current_password",
    "token",
    "reset_token",
    "secret",
}

# Rutas de negocio con contrato no JSON (CSV).
NON_JSON_ROUTES = {("GET", "/api/incidents/results/export")}


def _walk_keys(value):
    if isinstance(value, dict):
        for key, nested in value.items():
            yield key
            yield from _walk_keys(nested)
    elif isinstance(value, list):
        for item in value:
            yield from _walk_keys(item)


def _assert_no_sensitive(payload):
    assert not (set(_walk_keys(payload)) & SENSITIVE_KEYS)


def test_openapi_every_json_route_has_explicit_schema(client):
    spec = client.get("/openapi.json").json()
    checked = 0
    for path, methods in spec["paths"].items():
        for method, operation in methods.items():
            if (method.upper(), path) in NON_JSON_ROUTES:
                continue
            ok = [code for code in operation["responses"] if code in {"200", "201"}]
            assert ok, (method, path)
            schema = operation["responses"][ok[0]]["content"]["application/json"]["schema"]
            ref = schema.get("$ref") or schema.get("items", {}).get("$ref")
            assert ref, (method, path, schema)
            checked += 1
    assert checked == 31


def test_export_declares_csv_contract(client):
    spec = client.get("/openapi.json").json()
    content = spec["paths"]["/api/incidents/results/export"]["get"]["responses"]["200"]["content"]
    assert list(content) == ["text/csv"]


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Brasaland Incidents API is running"}


def test_register_login_me(client):
    payload = {
        "email": "reg@example.com",
        "password": "supersecret1",
        "profile": {"name": "Reg", "phone": "3001112222", "address": "Calle 1 # 2"},
    }
    created = client.post("/users", json=payload)
    assert created.status_code == 201
    body = created.json()
    assert set(body) == {"id", "email", "is_active", "role", "created_at", "profile"}
    assert set(body["profile"]) == {"name", "phone", "address"}
    _assert_no_sensitive(body)

    login = client.post("/auth/login", data={"username": "reg@example.com", "password": "supersecret1"})
    assert login.status_code == 200
    assert set(login.json()) == {"access_token", "token_type"}
    assert login.json()["token_type"] == "bearer"

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {login.json()['access_token']}"})
    assert me.status_code == 200
    assert set(me.json()) == {"email", "role", "profile"}
    assert set(me.json()["profile"]) == {"name", "phone", "address"}


def test_password_endpoints_responses(client, auth_headers):
    forgot = client.post("/auth/forgot-password", json={"email": "nobody@example.com"})
    assert forgot.status_code == 200
    assert set(forgot.json()) == {"message"}

    bad = client.post(
        "/auth/change-password",
        json={"current_password": "wrongpass", "new_password": "anotherpass1"},
        headers=auth_headers,
    )
    assert bad.status_code == 400

    reset = client.post("/auth/reset-password", json={"token": "invalid", "new_password": "anotherpass1"})
    assert reset.status_code == 400


def test_profiles_hide_internal_ids(client, auth_headers):
    got = client.get("/profiles/me", headers=auth_headers)
    assert got.status_code == 200
    assert set(got.json()) == {"name", "phone", "address"}

    updated = client.put(
        "/profiles/me",
        json={"name": "Nuevo", "phone": "3009998888", "address": "Otra calle 3"},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json() == {"name": "Nuevo", "phone": "3009998888", "address": "Otra calle 3"}


def test_users_list_is_light_and_detail_is_filtered(client, auth_headers):
    listing = client.get("/users", headers=auth_headers)
    assert listing.status_code == 200
    assert listing.json()
    for item in listing.json():
        assert set(item) == {"id", "email", "is_active", "role", "created_at"}
    _assert_no_sensitive(listing.json())

    own_id = next(u["id"] for u in listing.json() if u["email"] == "audit@example.com")
    detail = client.get(f"/users/{own_id}", headers=auth_headers)
    assert detail.status_code == 200
    assert set(detail.json()) == {"id", "email", "is_active", "role", "created_at", "profile"}
    assert set(detail.json()["profile"]) == {"name", "phone", "address"}

    updated = client.put(f"/users/{own_id}", json={"email": "audit@example.com"}, headers=auth_headers)
    assert updated.status_code == 200
    assert set(updated.json()) == {"id", "email", "is_active", "role", "created_at", "profile"}


def test_users_delete_message(client):
    created = client.post("/users", json={"email": "del@example.com", "password": "supersecret1"})
    user_id = created.json()["id"]
    token = client.post(
        "/auth/login", data={"username": "del@example.com", "password": "supersecret1"}
    ).json()["access_token"]
    response = client.delete(f"/users/{user_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == {"message": "Usuario eliminado"}


def test_protected_routes_require_auth(client):
    assert client.get("/users").status_code == 401
    assert client.get("/suppliers").status_code == 401
    assert client.get("/auth/me").status_code == 401
    assert client.get("/profiles/me").status_code == 401


SUPPLIER = {
    "name": "Proveedor Test",
    "country": "Colombia",
    "categories": ["carne"],
    "rate_per_unit": 10.5,
    "currency": "COP",
    "status": "active",
    "contact_email": "prov@example.com",
    "notes": "nota",
}
SUPPLIER_KEYS = {
    "id", "name", "country", "categories", "rate_per_unit",
    "currency", "status", "contact_email", "notes", "updated_at",
}


def test_suppliers_flow(client, auth_headers):
    created = client.post("/suppliers", json=SUPPLIER, headers=auth_headers)
    assert created.status_code == 201
    assert set(created.json()) == SUPPLIER_KEYS
    supplier_id = created.json()["id"]

    assert set(client.get(f"/suppliers/{supplier_id}", headers=auth_headers).json()) == SUPPLIER_KEYS
    listing = client.get("/suppliers", params={"country": "Colombia"}, headers=auth_headers)
    assert listing.status_code == 200
    assert all(set(item) == SUPPLIER_KEYS for item in listing.json())

    rate = client.patch(f"/suppliers/{supplier_id}/rate", json={"rate_per_unit": 12}, headers=auth_headers)
    assert rate.status_code == 200 and rate.json()["rate_per_unit"] == 12
    status = client.patch(f"/suppliers/{supplier_id}/status", json={"status": "suspended"}, headers=auth_headers)
    assert status.status_code == 200 and status.json()["status"] == "suspended"

    deleted = client.delete(f"/suppliers/{supplier_id}", headers=auth_headers)
    assert deleted.status_code == 200
    assert deleted.json() == {"message": "Proveedor eliminado"}
    assert client.get(f"/suppliers/{supplier_id}", headers=auth_headers).status_code == 404


INCIDENT_KEYS = {
    "title", "description", "category", "status", "origin",
    "branch", "source_id", "id", "created_at", "updated_at",
}


def test_incidents_flow(client):
    from packages.shared import incidents as shared

    payload = {
        "title": "Falla",
        "description": "Nevera dañada",
        "category": sorted(shared.VALID_CATEGORIES)[0],
        "origin": sorted(shared.VALID_ORIGINS)[0],
        "branch": sorted(shared.VALID_BRANCHES)[0],
    }
    created = client.post("/api/incidents", json=payload)
    assert created.status_code == 201, created.text
    assert set(created.json()) == INCIDENT_KEYS
    incident_id = created.json()["id"]

    assert set(client.get(f"/api/incidents/{incident_id}").json()) == INCIDENT_KEYS
    listing = client.get("/api/incidents")
    assert listing.status_code == 200
    assert all(set(item) == INCIDENT_KEYS for item in listing.json())

    moved = client.patch(f"/api/incidents/{incident_id}/status", json={"status": "in_progress"})
    assert moved.status_code == 200
    assert set(moved.json()) == INCIDENT_KEYS

    summary = client.get("/api/incidents/summary").json()
    assert set(summary) == {"total", "by_status", "by_category", "by_origin", "by_branch"}
    assert summary["total"] >= 1


CSV_TEXT = (
    "incident_id,date,location_id,category,description,status,customer_id,satisfaction_score,reporter_id\n"
    "BRS-000001,2025-01-10,COL-01,EQUIPMENT,Nevera dañada,CLOSED,CLI-000001,4,MGR-01\n"
    "BRS-000002,2025-01-11,COL-02,SUPPLY,x,OPEN,,,MGR-02\n"
)


def test_analyze_and_export(client, auth_headers):
    response = client.post(
        "/api/incidents/analyze",
        files={"file": ("incidents.csv", CSV_TEXT.encode("utf-8"), "text/csv")},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert set(body) == {
        "company", "source_file", "total_records", "valid_records",
        "invalid_records", "invalid_breakdown", "by_category", "by_status", "satisfaction",
    }
    assert set(body["satisfaction"]) == {"closed_cases", "scored_cases", "average", "scores"}
    assert all(set(v) == {"count", "percentage"} for v in body["by_category"].values())
    assert body["total_records"] == 2 and body["valid_records"] == 1

    export = client.get("/api/incidents/results/export", headers=auth_headers)
    assert export.status_code == 200
    assert export.headers["content-type"].startswith("text/csv")
    assert 'filename="results.csv"' in export.headers["content-disposition"]


INGREDIENT_KEYS = {"id", "name", "sku", "unit", "category", "country", "current_stock"}
ORDER_KEYS = {
    "id", "order_type", "ingredient", "quantity", "location_id",
    "created_at", "user_uuid", "supplier_name", "reason",
}


def test_inventory_flow(client, auth_headers):
    created = client.post(
        "/inventory/products",
        json={"name": "Res", "sku": "RES-001", "unit": "kg", "category": "meat", "country": "CO"},
        headers=auth_headers,
    )
    assert created.status_code == 201
    assert set(created.json()) == INGREDIENT_KEYS
    ingredient_id = created.json()["id"]

    inbound = client.post(
        "/inventory/orders/inbound",
        json={"ingredient_id": ingredient_id, "quantity": 10, "supplier_name": "Prov", "location_id": 1},
        headers=auth_headers,
    )
    assert inbound.status_code == 201
    assert set(inbound.json()) == ORDER_KEYS
    assert set(inbound.json()["ingredient"]) == {"id", "name", "sku", "unit", "category", "country"}

    outbound = client.post(
        "/inventory/orders/outbound",
        json={"ingredient_id": ingredient_id, "quantity": 4, "reason": "waste", "location_id": 1},
        headers=auth_headers,
    )
    assert outbound.status_code == 201
    assert set(outbound.json()) == ORDER_KEYS

    detail = client.get(f"/inventory/products/{ingredient_id}")
    assert detail.status_code == 200
    assert set(detail.json()) == INGREDIENT_KEYS
    assert detail.json()["current_stock"] == 6

    listing = client.get("/inventory/products")
    assert all(set(item) == INGREDIENT_KEYS for item in listing.json())

    orders = client.get("/inventory/orders")
    assert orders.status_code == 200
    assert all(set(item) == ORDER_KEYS for item in orders.json())
