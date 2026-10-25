"""Modelos de identidad; las credenciales y el contacto se guardan separados."""
from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    SecretStr,
    field_validator,
    model_validator,
)


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"


class User(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID = Field(default_factory=uuid4)
    email: EmailStr
    hashed_password: str = Field(repr=False)
    is_active: bool = True
    role: UserRole = UserRole.USER
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    auth_version: str = Field(default_factory=lambda: str(uuid4()), repr=False)


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: SecretStr = Field(min_length=12, max_length=1024)

    @field_validator("password")
    @classmethod
    def validate_bcrypt_length(cls, password: SecretStr) -> SecretStr:
        if len(password.get_secret_value().encode("utf-8")) > 72:
            raise ValueError("La contraseña no puede superar los 72 bytes de bcrypt.")
        return password


class UserRegistration(UserCreate):
    name: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    address: str | None = Field(default=None, max_length=500)


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr | None = None
    password: SecretStr | None = Field(default=None, min_length=12, max_length=1024)

    @field_validator("password")
    @classmethod
    def validate_bcrypt_length(cls, password: SecretStr | None) -> SecretStr | None:
        if password is not None and len(password.get_secret_value().encode("utf-8")) > 72:
            raise ValueError("La contraseña no puede superar los 72 bytes de bcrypt.")
        return password

    @model_validator(mode="after")
    def reject_null_and_empty(self):
        if not self.model_fields_set or any(getattr(self, field) is None for field in self.model_fields_set):
            raise ValueError("Indica al menos un campo de credenciales no nulo.")
        return self


class UserAdminUpdate(UserUpdate):
    role: UserRole | None = None


class ProfileFields(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(default="", max_length=120, validation_alias=AliasChoices("name", "display_name"))
    contact_email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=40)
    address: str | None = Field(default=None, max_length=500)


class Profile(ProfileFields):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID = Field(validation_alias=AliasChoices("user_id", "user_uuid"))