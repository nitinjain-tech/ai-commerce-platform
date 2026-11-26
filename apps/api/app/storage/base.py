from abc import ABC, abstractmethod
from typing import BinaryIO, Optional


class StorageProvider(ABC):
    @abstractmethod
    async def upload(
        self,
        file_obj: BinaryIO,
        destination_path: str,
        content_type: Optional[str] = None,
    ) -> str:
        """Uploads a file and returns its accessible URL or path."""
        pass

    @abstractmethod
    async def delete(self, file_path: str) -> bool:
        """Deletes a file."""
        pass

    @abstractmethod
    async def exists(self, file_path: str) -> bool:
        """Checks if a file exists."""
        pass
