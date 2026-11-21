"""Inicio de sesión OAuth2 y dependencia de identidad reutilizable."""
from __future__ import annotations

from secrets import compare_digest

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr, ValidationError, field_validator

from app import user_service
from app.email import send_reset_email
from app.models import Profile, UserRole
from app.security import (
    MAX_BCRYPT_PASSWORD_BYTES,
    create_access_token,
    create_reset_token,
    decode_access_token,
    decode_reset_token,
    get_settings,
    hash_password,
    verify_password,
)
from app.storage import IdentityStore

router = APIRouter(prefix="/auth", tags=["Autenticación"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
_dummy_hash = hash_password("credencial-ficticia-no-utilizable")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: SecretStr = Field(min_length=1, max_length=1024)

    @field_validator("password")
    @classmethod
    def validate_bcrypt_length(cls, password: SecretStr) -> SecretStr:
        if len(password.get_secret_value().encode("utf-8")) > 72:
            raise ValueError("La contraseña no puede superar los 72 bytes de bcrypt.")
        return password


class AuthMeResponse(BaseModel):
    email: EmailStr
    role: UserRole
    profile: Profile | None


async def get_login_credentials(request: Request) -> LoginRequest:
    media_type = request.headers.get("content-type", "").partition(";")[0].strip().lower()
    if media_type == "application/json":
        try:
            payload = await request.json()
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="El cuerpo JSON no es válido.") from exc
    elif media_type in ("application/x-www-form-urlencoded", "multipart/form-data"):
        form = await request.form()
        payload = {"email": form.get("email", form.get("username")), "password": form.get("password")}
    else:
        raise HTTPException(status_code=415, detail="Envía las credenciales como JSON o formulario.")
    try:
        return LoginRequest.model_validate(payload)
    except ValidationError as exc:
        errors = [
            {"loc": ("body", *error["loc"]), "msg": error["msg"], "type": error["type"]}
            for error in exc.errors(include_input=False, include_context=False, include_url=False)
        ]
        raise RequestValidationError(errors) from exc


def get_store(request: Request) -> IdentityStore:
    return request.app.state.identity


def unauthorized() -> HTTPException:
    return HTTPException(
        status_code=401,
        detail="Credenciales no válidas o sesión caducada.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    token: str = Depends(oauth2_scheme), store: IdentityStore = Depends(get_store)
) -> dict:
    try:
        claims = decode_access_token(token)
        user_uuid = claims.get("sub")
        version = claims.get("ver")
        if not isinstance(user_uuid, str) or not user_uuid or not isinstance(version, str):
            raise unauthorized()
        user = user_service.get_user_by_id(store, user_uuid)
    except HTTPException:
        raise
    except (JWTError, KeyError, TypeError, ValueError) as exc:
        raise unauthorized() from exc
    if (
        not user
        or not user.get("is_active", True)
        or not isinstance(user.get("auth_version"), str)
        or not compare_digest(version.encode("utf-8"), user["auth_version"].encode("utf-8"))
    ):
        raise unauthorized()
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {"schema": LoginRequest.model_json_schema()},
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "email": {"type": "string", "format": "email"},
                            "username": {"type": "string", "description": "Alias OAuth2 del email."},
                            "password": {"type": "string", "format": "password", "writeOnly": True},
                        },
                        "required": ["password"],
                        "anyOf": [{"required": ["email"]}, {"required": ["username"]}],
                    },
                },
            },
        },
    },
)
def login(
    credentials: LoginRequest = Depends(get_login_credentials), store: IdentityStore = Depends(get_store)
) -> TokenResponse:
    user = user_service.get_user_by_email(store, str(credentials.email))
    password = credentials.password.get_secret_value()
    stored_hash = user.get("hashed_password", user.get("password_hash", _dummy_hash)) if user else _dummy_hash
    valid = verify_password(password, stored_hash)
    if not user or not valid or not user.get("is_active", True):
        raise unauthorized()
    return TokenResponse(
        access_token=create_access_token(user["id"], user["auth_version"]),
        expires_in=get_settings().token_minutes * 60,
    )


@router.get("/me", response_model=AuthMeResponse)
def read_session(
    current_user: dict = Depends(get_current_user), store: IdentityStore = Depends(get_store)
) -> dict:
    return {
        "email": current_user["email"],
        "role": current_user.get("role", UserRole.USER),
        "profile": store.get_profile(current_user["id"]),
    }


# ──────────────────────────────────────────────
# Restablecimiento de contraseña
# ──────────────────────────────────────────────


class ForgotPasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr


@router.post("/forgot-password", status_code=200)
def forgot_password(
    body: ForgotPasswordRequest,
    store: IdentityStore = Depends(get_store),
) -> dict:
    """Genera un token de restablecimiento y lo envía por correo.

    Siempre responde con el mismo mensaje para evitar enumeración de usuarios.
    """
    user = user_service.get_user_by_email(store, str(body.email))
    if user and user.get("is_active", True):
        token = create_reset_token(user["id"], user["password_reset_version"])
        ui_base = get_settings().ui_base_url
        reset_url = f"{ui_base}/reset-password?token={token}"
        send_reset_email(str(body.email), reset_url)
    else:
        _dummy_hash  # timing-safe no-op

    return {
        "message": "Si el correo existe, recibirás un enlace para restablecer tu contraseña."
    }


class ResetPasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    token: str = Field(min_length=1)
    password: SecretStr = Field(min_length=12, max_length=1024)

    @field_validator("password")
    @classmethod
    def validate_bcrypt_length(cls, password: SecretStr) -> SecretStr:
        if len(password.get_secret_value().encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
            raise ValueError("La contraseña no puede superar los 72 bytes de bcrypt.")
        return password


@router.post("/reset-password", status_code=200)
def reset_password(
    body: ResetPasswordRequest,
    store: IdentityStore = Depends(get_store),
) -> dict:
    """Valida el token de restablecimiento y actualiza la contraseña.

    El token queda invalidado tras el primer uso.
    """
    try:
        claims = decode_reset_token(body.token)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="El enlace no es válido o ha expirado.") from exc

    if claims.get("purpose") != "reset_password":
        raise HTTPException(status_code=400, detail="El enlace no es válido o ha expirado.")

    user_uuid: str = claims["sub"]
    token_version = claims.get("pver")
    if not isinstance(token_version, str):
            raise HTTPException(status_code=400, detail="El enlace no es válido o ha expirado.")

    user = user_service.get_user_by_id(store, user_uuid)
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=400, detail="El enlace no es válido o ha expirado.")

    stored_version = user.get("password_reset_version")
    if not isinstance(stored_version, str) or stored_version != token_version:
        raise HTTPException(status_code=400, detail="El enlace ya ha sido usado o ha sido reemplazado.")

    new_password = body.password.get_secret_value()
    # Llamamos directamente a store.update_user para evitar el
    # schema UserUpdate de user_service (que rechaza campos internos)
    update = {"password": new_password, "password_reset_version": True}
    store.update_user(user_uuid, update)

    return {"message": "Contraseña actualizada correctamente."}


# ──────────────────────────────────────────────
# Cambio de contraseña estando conectado
# ──────────────────────────────────────────────


class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    current_password: SecretStr = Field(min_length=1, max_length=1024)
    new_password: SecretStr = Field(min_length=12, max_length=1024)

    @field_validator("new_password")
    @classmethod
    def validate_bcrypt_length(cls, password: SecretStr) -> SecretStr:
        if len(password.get_secret_value().encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
            raise ValueError("La contraseña no puede superar los 72 bytes de bcrypt.")
        return password


@router.post("/change-password", status_code=200)
def change_password(
    body: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    store: IdentityStore = Depends(get_store),
) -> dict:
    """Cambia la contraseña del usuario autenticado.

    Verifica la contraseña actual antes de aceptar la nueva.
    Invalida todos los tokens JWT previos (bump auth_version).
    """
    stored_hash = current_user.get("hashed_password", current_user.get("password_hash"))
    if not stored_hash or not verify_password(body.current_password.get_secret_value(), stored_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual no es correcta.")

    new_password = body.new_password.get_secret_value()
    update = {"password": new_password}
    user_service.update_user(store, current_user["id"], update)

    return {"message": "Contraseña actualizada correctamente."}