"""Credenciales de usuario, sin datos de perfil ni hashes en las respuestas."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr

from app import user_service
from app.auth import get_current_user, get_store
from app.models import UserAdminUpdate, UserRegistration, UserRole
from app.storage import IdentityStore

router = APIRouter(prefix="/users", tags=["Usuarios"])


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: UserRole = UserRole.USER
    is_active: bool = True
    created_at: datetime | None = None


def require_owner(user_uuid: str, user: dict) -> None:
    if user_uuid != user["id"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este perfil.")


def require_owner_or_admin(user_uuid: str, user: dict) -> None:
    if user_uuid != user["id"] and user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permisos para modificar esta cuenta.")


@router.post("", response_model=UserResponse, status_code=201)
def create_user(
    data: UserRegistration,
    store: IdentityStore = Depends(get_store),
) -> dict:
    try:
        return user_service.create_user(
            store, str(data.email), data.password.get_secret_value(),
            name=data.name, phone=data.phone, address=data.address,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=list[UserResponse])
def list_users(
    current_user: dict = Depends(get_current_user), store: IdentityStore = Depends(get_store)
) -> list[dict]:
    return user_service.list_users(store)


@router.get("/me", response_model=UserResponse)
def read_me(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user


@router.get("/{user_uuid}", response_model=UserResponse)
def read_user(
    user_uuid: str,
    current_user: dict = Depends(get_current_user),
    store: IdentityStore = Depends(get_store),
) -> dict:
    user = user_service.get_user_by_id(store, user_uuid)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    require_owner_or_admin(user_uuid, current_user)
    return user


@router.put("/{user_uuid}", response_model=UserResponse)
@router.patch("/{user_uuid}", response_model=UserResponse)
def update_user(
    user_uuid: str,
    data: UserAdminUpdate,
    current_user: dict = Depends(get_current_user),
    store: IdentityStore = Depends(get_store),
) -> dict:
    require_owner_or_admin(user_uuid, current_user)
    is_admin = current_user.get("role") == UserRole.ADMIN
    if "role" in data.model_fields_set and not is_admin:
        raise HTTPException(status_code=403, detail="Solo un administrador puede cambiar el rol.")
    try:
        return user_service.update_user(
            store, user_uuid, data.model_dump(exclude_unset=True), allow_role_change=is_admin,
        )
    except user_service.UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.delete("/{user_uuid}", status_code=204)
def delete_user(
    user_uuid: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
    store: IdentityStore = Depends(get_store),
) -> Response:
    require_owner_or_admin(user_uuid, current_user)
    try:
        user_service.delete_user(store, user_uuid)
    except user_service.UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    with request.app.state.summary_lock:
        request.app.state.summaries.pop(user_uuid, None)
    return Response(status_code=204)