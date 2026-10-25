"""Alta local de la primera cuenta, sin contraseñas en argumentos o registros."""
import argparse
from getpass import getpass

from pydantic import ValidationError

from app import user_service
from app.security import get_settings
from app.storage import IdentityStore


def main() -> None:
    parser = argparse.ArgumentParser(description="Crear la primera cuenta de TrackFlow.")
    parser.add_argument("--email", required=True)
    args = parser.parse_args()
    store = IdentityStore(get_settings().db_path)
    try:
        if len(store.users):
            parser.exit(1, "El alta inicial ya se realizó. Usa /users con una sesión válida.\n")
        password = getpass("Contraseña (mínimo 12 caracteres): ")
        if password != getpass("Repite la contraseña: "):
            parser.exit(1, "Las contraseñas no coinciden.\n")
        try:
            user = user_service.create_user(store, args.email, password, bootstrap=True)
        except (ValidationError, ValueError):
            parser.exit(1, "Alta rechazada: revisa el email y la longitud de la contraseña.\n")
        print(f"Cuenta inicial creada: {user['id']}")
    finally:
        store.close()


if __name__ == "__main__":
    main()