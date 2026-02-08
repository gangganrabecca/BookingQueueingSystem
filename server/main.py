import os
from datetime import date, datetime, time
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from neo4j import GraphDatabase
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field

_ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))


def _load_env_file(path: str) -> None:
    if not os.path.exists(path):
        return

    try:
        raw = open(path, "rb").read()
        text = raw.decode("utf-8-sig", errors="replace")
    except Exception:
        return

    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            continue
        os.environ[key] = value


load_dotenv(_ENV_PATH, override=True)
_load_env_file(_ENV_PATH)

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
JWT_SECRET = os.getenv("JWT_SECRET")
PORT = int(os.getenv("PORT", "5000"))

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is not set")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

_driver = None


def _get_driver():
    global _driver
    if _driver is None:
        uri = os.getenv("NEO4J_URI")
        user = os.getenv("NEO4J_USER") or os.getenv("NEO4J_USERNAME")
        password = os.getenv("NEO4J_PASSWORD")
        if not (uri and user and password):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Database credentials are not set. "
                    f"ENV_PATH={_ENV_PATH} exists={os.path.exists(_ENV_PATH)} "
                    f"NEO4J_URI={uri!r} NEO4J_USER={user!r} NEO4J_PASSWORD_set={bool(password)}"
                ),
            )

        def _candidate_uris(u: str) -> List[str]:
            candidates = [u]
            if u.startswith("neo4j+s://"):
                host = u[len("neo4j+s://") :]
                candidates.append("neo4j+ssc://" + host)
                candidates.append("bolt+s://" + host)
                candidates.append("bolt+ssc://" + host)
            elif u.startswith("neo4j+ssc://"):
                host = u[len("neo4j+ssc://") :]
                candidates.append("bolt+ssc://" + host)
            elif u.startswith("bolt+s://"):
                host = u[len("bolt+s://") :]
                candidates.append("bolt+ssc://" + host)
            elif u.startswith("bolt+ssc://"):
                pass
            return candidates

        last_error: Optional[Exception] = None
        for attempt_uri in _candidate_uris(uri):
            try:
                candidate = GraphDatabase.driver(attempt_uri, auth=(user, password))
                candidate.verify_connectivity()
                _driver = candidate
                break
            except Exception as e:
                last_error = e
                try:
                    candidate.close()
                except Exception:
                    pass
                continue

        if _driver is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Database unavailable: {last_error}",
            )
    return _driver


def _serialize_value(v: Any) -> Any:
    if hasattr(v, "to_native"):
        try:
            v = v.to_native()
        except Exception:
            pass
    if isinstance(v, (datetime, date, time)):
        return v.isoformat()
    if isinstance(v, list):
        return [_serialize_value(x) for x in v]
    if isinstance(v, dict):
        return {k: _serialize_value(val) for k, val in v.items()}
    return v


def _node_props_to_dict(props: Dict[str, Any]) -> Dict[str, Any]:
    return {k: _serialize_value(v) for k, v in props.items()}


def _node_to_dict(node: Any) -> Dict[str, Any]:
    try:
        return _node_props_to_dict(dict(node))
    except Exception:
        props = getattr(node, "_properties", None)
        if isinstance(props, dict):
            return _node_props_to_dict(props)
        raise


def _hash_password(password: str) -> str:
    # Truncate password to 72 bytes before hashing (bcrypt limit)
    return pwd_context.hash(password[:72])


def _verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def _create_token(user_id: str, email: str, role: str) -> str:
    payload = {"userId": user_id, "email": email, "role": role}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def _decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = "client"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ServiceCreate(BaseModel):
    id: Optional[str] = None
    name: str
    requirements: List[str] = []


class AvailabilityCreate(BaseModel):
    date: str
    time: str
    slots: int = 10


class AppointmentCreate(BaseModel):
    name: str
    email: EmailStr
    service: str
    date: str
    time: Optional[str] = None


class AppointmentUpdate(BaseModel):
    name: str
    email: EmailStr
    service: str
    date: str
    time: Optional[str] = None


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No token, authorization denied")

    token = credentials.credentials
    try:
        payload = _decode_token(token)
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is not valid")


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Admin only.")
    return user


app = FastAPI()


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    message = exc.detail
    if isinstance(message, dict):
        message = message.get("message") or message.get("detail") or "Request failed"
    return JSONResponse(status_code=exc.status_code, content={"message": str(message)})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"message": "Validation error", "details": exc.errors()},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_, __):
    return JSONResponse(status_code=500, content={"message": "Server error"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporary fix - allows all origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


async def _initialize_admin() -> None:
    admin_email = "admin@registrar.gov"
    admin_password = "admin123"
    admin_name = "Administrator"

    driver = _get_driver()
    with driver.session() as session:
        result = session.run("MATCH (u:User {email: $email}) RETURN u", email=admin_email)
        records = list(result)
        hashed = _hash_password(admin_password)

        if len(records) == 0:
            session.run(
                "CREATE (u:User {id: randomUUID(), name: $name, email: $email, password: $password, role: 'admin', createdAt: datetime()})",
                name=admin_name,
                email=admin_email,
                password=hashed,
            )
        else:
            session.run(
                "MATCH (u:User {email: $email}) SET u.role = 'admin', u.password = $password RETURN u",
                email=admin_email,
                password=hashed,
            )


def _ensure_default_services(session) -> List[Dict[str, Any]]:
    result = session.run("MATCH (s:Service) RETURN s ORDER BY s.name")
    services = [_node_to_dict(r["s"]) for r in result]
    if services:
        return services

    default_services = [
        {
            "id": "birth-cert",
            "name": "Birth Certificate",
            "requirements": [
                "National ID",
                "Negative result (PSA)",
                "Affidavit of delay registration",
                "Voter certification",
                "Permanent record",
            ],
        },
        {
            "id": "marriage-cert",
            "name": "Marriage Certificate",
            "requirements": [
                "Valid ID",
                "Marriage contract (if applicable)",
                "PSA Certificate of Marriage",
                "Affidavit (if needed)",
            ],
        },
        {
            "id": "no-marriage-cert",
            "name": "Certificate of No Marriage",
            "requirements": [
                "Valid ID",
                "PSA Certificate of No Marriage",
                "Barangay Clearance",
                "Birth Certificate",
            ],
        },
        {
            "id": "death-reg",
            "name": "Death Registration",
            "requirements": [
                "Valid ID of informant",
                "Death certificate from hospital/clinic",
                "PSA Certificate of Death",
                "Affidavit (if needed)",
            ],
        },
    ]

    for s in default_services:
        session.run(
            "CREATE (s:Service {id: $id, name: $name, requirements: $requirements})",
            id=s["id"],
            name=s["name"],
            requirements=s["requirements"],
        )

    return default_services


@app.on_event("startup")
async def startup_event() -> None:
    try:
        driver = _get_driver()
        driver.verify_connectivity()
        await _initialize_admin()
    except Exception as e:
        print(f"Neo4j startup warning: {e}")


@app.on_event("shutdown")
async def shutdown_event() -> None:
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None


@app.get("/")
async def root():
    return {"message": "Booking System API is running", "status": "ok"}

@app.get("/health")
async def health() -> Dict[str, Any]:
    return {"status": "OK", "message": "Server is running"}

@app.post("/api/auth/signup")
async def signup(payload: SignupRequest) -> Dict[str, Any]:
    try:
        driver = _get_driver()
        with driver.session() as session:
            existing = session.run("MATCH (u:User {email: $email}) RETURN u", email=str(payload.email))
            if existing.peek() is not None:
                raise HTTPException(status_code=400, detail="User already exists")

            hashed = _hash_password(payload.password)
            result = session.run(
                "CREATE (u:User {id: randomUUID(), name: $name, email: $email, password: $password, role: $role, createdAt: datetime()}) RETURN u",
                name=payload.name,
                email=str(payload.email),
                password=hashed,
                role=payload.role,
            )
            user_node = result.single()["u"]
            user = _node_to_dict(user_node)
            user.pop("password", None)
            token = _create_token(user_id=user["id"], email=user["email"], role=user.get("role", "client"))
            return {"token": token, "user": user}
    except Exception as e:
        print(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.post("/api/auth/login")
async def login(payload: LoginRequest) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run("MATCH (u:User {email: $email}) RETURN u", email=str(payload.email))
        record = result.single()
        if record is None:
            raise HTTPException(status_code=400, detail="Invalid credentials")

        user_node = record["u"]
        user_props = _node_to_dict(user_node)
        if not _verify_password(payload.password, user_props.get("password", "")):
            raise HTTPException(status_code=400, detail="Invalid credentials")

        user = _node_props_to_dict(user_props)
        user.pop("password", None)
        token = _create_token(user_id=user["id"], email=user["email"], role=user.get("role", "client"))
        return {"token": token, "user": user}


@app.get("/api/auth/me")
async def me(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run("MATCH (u:User {id: $id}) RETURN u", id=user.get("userId"))
        record = result.single()
        if record is None:
            raise HTTPException(status_code=404, detail="User not found")
        u = _node_to_dict(record["u"])
        u.pop("password", None)
        return {"user": u}


@app.get("/api/services")
async def get_services() -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        services = _ensure_default_services(session)
        return {"services": services}


@app.get("/api/services/{service_id}")
async def get_service(service_id: str) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run("MATCH (s:Service {id: $id}) RETURN s", id=service_id)
        record = result.single()
        if record is None:
            raise HTTPException(status_code=404, detail="Service not found")
        service = _node_to_dict(record["s"])
        return {"service": service}


@app.get("/api/availability")
async def get_availability() -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (a:Availability) RETURN a ORDER BY a.date, a.time"
        )
        availabilities = [_node_to_dict(r["a"]) for r in result]
        return {"availabilities": availabilities}


@app.post("/api/appointments")
async def create_appointment(payload: AppointmentCreate, user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (u:User {id: $userId}) "
            "CREATE (a:Appointment {id: randomUUID(), name: $name, email: $email, service: $service, date: $date, time: $time, status: 'confirmed', createdAt: datetime()}) "
            "CREATE (u)-[:HAS_APPOINTMENT]->(a) "
            "RETURN a",
            userId=user.get("userId"),
            name=payload.name,
            email=str(payload.email),
            service=payload.service,
            date=payload.date,
            time=payload.time,
        )
        appointment = _node_to_dict(result.single()["a"])
        _renumber_queue_for_date(session, payload.date)
        # Refresh to get the assigned queue number
        refreshed = session.run("MATCH (a:Appointment {id: $id}) RETURN a", id=appointment["id"]).single()
        appointment = _node_to_dict(refreshed["a"])
        return {"appointment": appointment}


@app.get("/api/appointments/my-appointments")
async def my_appointments(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (u:User {id: $userId})-[:HAS_APPOINTMENT]->(a:Appointment) RETURN a ORDER BY a.createdAt DESC",
            userId=user.get("userId"),
        )
        appointments = [_node_to_dict(r["a"]) for r in result]
        return {"appointments": appointments}


@app.get("/api/appointments/{appointment_id}")
async def get_appointment(appointment_id: str, user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (u:User {id: $userId})-[:HAS_APPOINTMENT]->(a:Appointment {id: $id}) RETURN a",
            userId=user.get("userId"),
            id=appointment_id,
        )
        record = result.single()
        if record is None:
            raise HTTPException(status_code=404, detail="Appointment not found")
        appointment = _node_to_dict(record["a"])
        return {"appointment": appointment}


@app.put("/api/appointments/{appointment_id}")
async def update_appointment(appointment_id: str, payload: AppointmentUpdate, user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (u:User {id: $userId})-[:HAS_APPOINTMENT]->(a:Appointment {id: $id}) "
            "SET a.name = $name, a.email = $email, a.service = $service, a.date = $date, a.time = $time, a.updatedAt = datetime() "
            "RETURN a",
            userId=user.get("userId"),
            id=appointment_id,
            name=payload.name,
            email=str(payload.email),
            service=payload.service,
            date=payload.date,
            time=payload.time,
        )
        record = result.single()
        if record is None:
            raise HTTPException(status_code=404, detail="Appointment not found")
        appointment = _node_to_dict(record["a"])
        return {"appointment": appointment}


def _renumber_queue_for_date(session, date: str) -> None:
    result = session.run(
        "MATCH (a:Appointment) WHERE a.date = $date AND a.status = 'confirmed' "
        "RETURN a ORDER BY a.createdAt ASC",
        date=date,
    )
    appointments = [dict(r["a"]).get("id") for r in result]
    for idx, appointment_id in enumerate(appointments, start=1):
        if not appointment_id:
            continue
        session.run(
            "MATCH (a:Appointment {id: $id}) SET a.queueNumber = $n",
            id=appointment_id,
            n=idx,
        )


def _renumber_confirmed_queue(session) -> None:
    result = session.run(
        "MATCH (a:Appointment) WHERE a.status = 'confirmed' "
        "RETURN a ORDER BY a.date ASC, a.createdAt ASC"
    )
    appointments = [dict(r["a"]).get("id") for r in result]
    for idx, appointment_id in enumerate(appointments, start=1):
        if not appointment_id:
            continue
        session.run(
            "MATCH (a:Appointment {id: $id}) SET a.queueNumber = $n",
            id=appointment_id,
            n=idx,
        )


@app.delete("/api/appointments/{appointment_id}")
async def cancel_appointment(appointment_id: str, user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        # Get the appointment's date before deleting
        appt_result = session.run(
            "MATCH (u:User {id: $userId})-[:HAS_APPOINTMENT]->(a:Appointment {id: $id}) RETURN a.date as date",
            userId=user.get("userId"),
            id=appointment_id,
        ).single()
        if appt_result is None:
            raise HTTPException(status_code=404, detail="Appointment not found")
        appointment_date = appt_result["date"]

        # Delete the appointment
        result = session.run(
            "MATCH (u:User {id: $userId})-[:HAS_APPOINTMENT]->(a:Appointment {id: $id}) DETACH DELETE a RETURN $id as id",
            userId=user.get("userId"),
            id=appointment_id,
        )
        record = result.single()
        if record is None:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Renumber queue for the affected date
        _renumber_queue_for_date(session, appointment_date)
        return {"message": "Appointment cancelled successfully"}


@app.get("/api/queue/current")
async def queue_current(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (u:User {id: $userId})-[:HAS_APPOINTMENT]->(a:Appointment) "
            "WHERE a.status = 'confirmed' "
            "RETURN a ORDER BY a.createdAt DESC LIMIT 1",
            userId=user.get("userId"),
        ).single()

        if result is None:
            return {"queueNumber": None, "message": "No active appointments"}

        appointment = _node_to_dict(result["a"])
        return {"queueNumber": appointment.get("queueNumber"), "appointment": appointment}


@app.get("/api/queue/all")
async def queue_all(_: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (a:Appointment) WHERE a.status = 'confirmed' RETURN a ORDER BY a.queueNumber ASC"
        )
        appointments = [_node_to_dict(r["a"]) for r in result]
        return {"appointments": appointments}


@app.get("/api/admin/appointments")
async def admin_get_appointments(_: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (a:Appointment) RETURN a ORDER BY a.date ASC, a.createdAt ASC"
        )
        appointments = [_node_to_dict(r["a"]) for r in result]
        return {"appointments": appointments}


@app.get("/api/admin/services")
async def admin_services(_: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run("MATCH (s:Service) RETURN s ORDER BY s.name")
        services = [_node_to_dict(r["s"]) for r in result]
        return {"services": services}


@app.post("/api/admin/services")
async def admin_create_service(payload: ServiceCreate, _: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        service_id = payload.id or None
        if service_id is None:
            service_id = session.run("RETURN randomUUID() as id").single()["id"]

        result = session.run(
            "CREATE (s:Service {id: $id, name: $name, requirements: $requirements}) RETURN s",
            id=service_id,
            name=payload.name,
            requirements=payload.requirements,
        )
        service = _node_to_dict(result.single()["s"])
        return {"service": service}


@app.put("/api/admin/services/{service_id}")
async def admin_update_service(service_id: str, payload: ServiceCreate, _: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run(
            "MATCH (s:Service {id: $id}) SET s.name = $name, s.requirements = $requirements RETURN s",
            id=service_id,
            name=payload.name,
            requirements=payload.requirements,
        )
        record = result.single()
        if record is None:
            raise HTTPException(status_code=404, detail="Service not found")
        service = _node_to_dict(record["s"])
        return {"service": service}


@app.delete("/api/admin/services/{service_id}")
async def admin_delete_service(service_id: str, _: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        session.run("MATCH (s:Service {id: $id}) DETACH DELETE s", id=service_id)
        return {"message": "Service deleted successfully"}


@app.get("/api/admin/availability")
async def admin_get_availability(_: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run("MATCH (a:Availability) RETURN a ORDER BY a.date, a.time")
        availabilities = [_node_to_dict(r["a"]) for r in result]
        return {"availabilities": availabilities}


@app.post("/api/admin/availability")
async def admin_create_availability(payload: AvailabilityCreate, _: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        result = session.run(
            "MERGE (a:Availability {date: $date, time: $time}) "
            "ON CREATE SET a.slots = $slots, a.id = randomUUID() "
            "ON MATCH SET a.slots = $slots "
            "RETURN a",
            date=payload.date,
            time=payload.time,
            slots=payload.slots,
        )
        availability = _node_to_dict(result.single()["a"])
        return {"availability": availability}


@app.delete("/api/admin/availability/{availability_id}")
async def admin_delete_availability(availability_id: str, _: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    driver = _get_driver()
    with driver.session() as session:
        session.run("MATCH (a:Availability {id: $id}) DETACH DELETE a", id=availability_id)
        return {"message": "Availability deleted successfully"}
