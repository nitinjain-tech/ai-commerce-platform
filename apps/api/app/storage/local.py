import os
import shutil
from typing import BinaryIO, Optional

from app.core.config import get_settings
from app.storage.base import StorageProvider

settings = get_settings()


class LocalStorageProvider(StorageProvider):
    def __init__(self, base_path: Optional[str] = None):
        self.base_path = base_path or settings.LOCAL_STORAGE_PATH
        os.makedirs(self.base_path, exist_ok=True)

    async def upload(
        self,
        file_obj: BinaryIO,
        destination_path: str,
        content_type: Optional[str] = None,
    ) -> str:
        full_path = os.path.join(self.base_path, destination_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        with open(full_path, "wb") as f:
            shutil.copyfileobj(file_obj, f)

        return f"/uploads/{destination_path}"

    async def delete(self, file_path: str) -> bool:
        clean_path = file_path.removeprefix("/uploads/")
        full_path = os.path.join(self.base_path, clean_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False

    async def exists(self, file_path: str) -> bool:
        clean_path = file_path.removeprefix("/uploads/")
        full_path = os.path.join(self.base_path, clean_path)
        return os.path.exists(full_path)
