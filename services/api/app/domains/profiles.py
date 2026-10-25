"""Perfiles privados enlazados uno a uno con los usuarios."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.auth import get_current_user, get_store
from app.domains.users import require_owner
from app.models import ProfileFields
from app.storage import IdentityStore

router = APIRouter(prefix="/profiles", tags=["Perfiles"])


class ProfileResponse(ProfileFields):
    id: str
    user_id: str


class MyProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    address: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def require_valid_changes(self):
        if not self.model_fields_set:
            raise ValueError("Indica al menos un campo de perfil.")
        if "name" in self.model_fields_set and self.name is None:
            raise ValueError("El nombre no puede ser nulo.")
        return self


class ProfileUpdate(MyProfileUpdate):
    name: str | None = Field(default=None, max_length=120, validation_alias=AliasChoices("name", "display_name"))
    contact_email: EmailStr | None = None


def existing_profile(user_uuid: str, user: dict, store: IdentityStore) -> dict:
    require_owner(user_uuid, user)
    profile = store.get_profile(user_uuid)
    if profile is None:
        raise HTTPException(status_code=404, detail="Perfil no encontrado.")
    return profile


def save_profile(user_uuid: str, data: MyProfileUpdate, user: dict, store: IdentityStore) -> dict:
    existing_profile(user_uuid, user, store)
    profile = store.update_profile(user_uuid, data.model_dump(exclude_unset=True))
    if profile is None:
        raise HTTPException(status_code=404, detail="Perfil no encontrado.")
    return profile


@router.post("", response_model=ProfileResponse, status_code=201)
def create_profile(
    data: ProfileFields,
    current_user: dict = Depends(get_current_user),
    store: IdentityStore = Depends(get_store),
) -> dict:
    try:
        return store.create_profile(current_user["id"], data.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("", response_model=list[ProfileResponse])
def list_profiles(
    current_user: dict = Depends(get_current_user), store: IdentityStore = Depends(get_store)
) -> list[dict]:
    profile = store.get_profile(current_user["id"])
    return [profile] if profile else []


@router.get("/me", response_model=ProfileResponse)
def read_my_profile(
    current_user: dict = Depends(get_current_user), store: IdentityStore = Depends(get_store)
) -> dict:
    return existing_profile(current_user["id"], current_user, store)


@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    data: MyProfileUpdate,
    current_user: dict = Depends(get_current_user),
    store: IdentityStore = Depends(get_store),
) -> dict:
    return save_profile(current_user["id"], data, current_user, store)


@router.get("/{user_uuid}", response_model=ProfileResponse)
def read_profile(
    user_uuid: str,
    current_user: dict = Depends(get_current_user),
    store: IdentityStore = Depends(get_store),
) -> dict:
    return existing_profile(user_uuid, current_user, store)


@router.patch("/{user_uuid}", response_model=ProfileResponse)
def update_profile(
    user_uuid: str,
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    store: IdentityStore = Depends(get_store),
) -> dict:
    return save_profile(user_uuid, data, current_user, store)


@router.delete("/{user_uuid}", status_code=409)
def delete_profile(
    user_uuid: str,
    current_user: dict = Depends(get_current_user),
    store: IdentityStore = Depends(get_store),
) -> None:
    existing_profile(user_uuid, current_user, store)
    raise HTTPException(
        status_code=409,
        detail="El perfil está vinculado a la cuenta; elimina la cuenta para borrar ambos.",
    )